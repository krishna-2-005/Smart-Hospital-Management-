import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { addQueueByReception, getReceptionQueues } from '@/lib/demo-store';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'reception' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all queues
    const queuesResult = await query(
      `SELECT q.*, p.patient_id_unique, pu.first_name, pu.last_name, d.id as doctor_id,
              du.first_name as doctor_first_name, du.last_name as doctor_last_name
       FROM queues q
       JOIN patients p ON q.patient_id = p.id
       JOIN users pu ON p.user_id = pu.id
       JOIN doctors d ON q.doctor_id = d.id
       JOIN users du ON d.user_id = du.id
       WHERE q.status IN ('waiting', 'in-consultation')
       ORDER BY q.priority DESC, q.queue_position ASC`
    );

    return NextResponse.json({
      queues: queuesResult.rows.map((item) => ({
        id: item.id,
        position: item.queue_position,
        patientName: `${item.first_name} ${item.last_name}`,
        patientId: item.patient_id_unique,
        doctorName: `${item.doctor_first_name} ${item.doctor_last_name}`,
        priority: item.priority,
        status: item.status,
        checkInTime: item.check_in_time,
      })),
    });
  } catch (error) {
    console.error('Error fetching queues:', error);
    return NextResponse.json({ queues: getReceptionQueues() }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'reception' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { patientId, doctorId, priority = 'normal' } = await request.json();

  try {
    // Get max queue position for this doctor
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
      { message: 'Patient added to queue', queueId: queueResult.rows[0].id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding to queue:', error);
    const queue = addQueueByReception(Number(patientId || 1), Number(doctorId || 1), priority);
    if (queue) {
      return NextResponse.json(
        { message: 'Patient added to queue', queueId: queue.id },
        { status: 201 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
