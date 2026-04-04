import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db-server';
import { getDoctorQueue, updateDoctorQueue } from '@/lib/demo-store';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'doctor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get doctor ID
    const doctorResult = await query('SELECT id FROM doctors WHERE user_id = $1', [user.userId]);
    if (doctorResult.rows.length === 0) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const doctorId = doctorResult.rows[0].id;

    // Get queue for this doctor
    const queueResult = await query(
      `SELECT q.*, p.patient_id_unique, u.first_name, u.last_name, pat.date_of_birth
       FROM queues q
       JOIN patients p ON q.patient_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE q.doctor_id = $1 AND q.status IN ('waiting', 'in-consultation')
       ORDER BY q.priority DESC, q.queue_position ASC`,
      [doctorId]
    );

    return NextResponse.json({
      queue: queueResult.rows.map((item) => ({
        id: item.id,
        position: item.queue_position,
        patientName: `${item.first_name} ${item.last_name}`,
        patientId: item.patient_id_unique,
        priority: item.priority,
        status: item.status,
        estimatedWaitTime: item.estimated_wait_time_minutes,
      })),
    });
  } catch (error) {
    console.error('Error fetching doctor queue:', error);
    return NextResponse.json({ queue: getDoctorQueue(user.userId) }, { status: 200 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'doctor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { queueId, status } = await request.json();

  try {
    // Update queue status
    await query('UPDATE queues SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      status,
      queueId,
    ]);

    return NextResponse.json({ message: 'Queue status updated' });
  } catch (error) {
    console.error('Error updating queue:', error);
    const updated = updateDoctorQueue(Number(queueId), status);
    if (updated) {
      return NextResponse.json({ message: 'Queue status updated' });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
