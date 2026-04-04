import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db-server';
import { getPatientQueueStatus, joinQueueForPatient } from '@/lib/demo-store';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'patient') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get patient ID
    const patientResult = await query('SELECT id FROM patients WHERE user_id = $1', [user.userId]);
    if (patientResult.rows.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const patientId = patientResult.rows[0].id;

    // Get current queue position for patient
    const queueResult = await query(
      `SELECT q.*, u.first_name, u.last_name, d.specialization
       FROM queues q
       JOIN doctors d ON q.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE q.patient_id = $1 AND q.status != 'completed'
       ORDER BY q.created_at DESC
       LIMIT 1`,
      [patientId]
    );

    if (queueResult.rows.length === 0) {
      return NextResponse.json({
        queuePosition: null,
        message: 'Not currently in any queue',
      });
    }

    const queueData = queueResult.rows[0];

    return NextResponse.json({
      queuePosition: queueData.queue_position,
      status: queueData.status,
      doctorName: `${queueData.first_name} ${queueData.last_name}`,
      specialization: queueData.specialization,
      estimatedWaitTime: queueData.estimated_wait_time_minutes,
      priority: queueData.priority,
      checkInTime: queueData.check_in_time,
    });
  } catch (error) {
    console.error('Error fetching queue status:', error);
    const queueStatus = getPatientQueueStatus(user.userId);
    return NextResponse.json(queueStatus || { queuePosition: null }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'patient') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { doctorId, priority = 'normal' } = await request.json();

  try {
    // Get patient ID
    const patientResult = await query('SELECT id FROM patients WHERE user_id = $1', [user.userId]);
    if (patientResult.rows.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const patientId = patientResult.rows[0].id;

    // Get next queue position
    const maxPositionResult = await query(
      'SELECT COALESCE(MAX(queue_position), 0) as max_pos FROM queues WHERE doctor_id = $1 AND status != "completed"',
      [doctorId]
    );

    const nextPosition = (maxPositionResult.rows[0]?.max_pos || 0) + 1;

    // Add patient to queue
    const queueResult = await query(
      `INSERT INTO queues (doctor_id, patient_id, queue_position, priority, check_in_time, status)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 'waiting')
       RETURNING id`,
      [doctorId, patientId, nextPosition, priority]
    );

    return NextResponse.json(
      { message: 'Added to queue', queueId: queueResult.rows[0].id, position: nextPosition },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error joining queue:', error);
    const queue = joinQueueForPatient(user.userId, Number(doctorId || 1), priority);
    if (queue) {
      return NextResponse.json(
        { message: 'Added to queue', queueId: queue.id, position: queue.queuePosition },
        { status: 201 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
