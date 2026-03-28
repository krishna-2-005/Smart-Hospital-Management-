import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { createPatientAppointment, getPatientAppointments } from '@/lib/demo-store';

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

    // Get appointments
    const appointmentsResult = await query(
      `SELECT a.*, u.first_name, u.last_name, d.specialization
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE a.patient_id = $1
       ORDER BY a.appointment_date DESC`,
      [patientId]
    );

    return NextResponse.json({
      appointments: appointmentsResult.rows.map((apt) => ({
        id: apt.id,
        date: apt.appointment_date,
        time: apt.appointment_time,
        doctorName: `${apt.first_name} ${apt.last_name}`,
        specialization: apt.specialization,
        reason: apt.reason_for_visit,
        status: apt.status,
      })),
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ appointments: getPatientAppointments(user.userId) }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'patient') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { doctorId, appointmentDate, appointmentTime, reasonForVisit } = await request.json();

  try {
    // Get patient ID
    const patientResult = await query('SELECT id FROM patients WHERE user_id = $1', [user.userId]);
    if (patientResult.rows.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const patientId = patientResult.rows[0].id;

    // Create appointment
    const appointmentResult = await query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason_for_visit, status)
       VALUES ($1, $2, $3, $4, $5, 'scheduled')
       RETURNING id`,
      [patientId, doctorId, appointmentDate, appointmentTime, reasonForVisit]
    );

    return NextResponse.json(
      { message: 'Appointment booked', appointmentId: appointmentResult.rows[0].id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating appointment:', error);
    const appointment = createPatientAppointment(user.userId, {
      doctorId,
      appointmentDate,
      appointmentTime,
      reasonForVisit,
    });

    if (appointment) {
      return NextResponse.json(
        { message: 'Appointment booked', appointmentId: appointment.id },
        { status: 201 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
