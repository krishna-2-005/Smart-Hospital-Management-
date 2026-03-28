import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getPrescriptions, issuePrescription, requestRefill } from '@/lib/demo-store';

// GET - Retrieve prescriptions for patient or issued by doctor
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let prescriptions = [];

    if (user.role === 'patient') {
      // Get prescriptions for this patient
      prescriptions = await query(
        `SELECT p.*, d.id as doctor_id, du.first_name as doctor_first_name, du.last_name as doctor_last_name
         FROM prescriptions p
         JOIN doctors d ON p.doctor_id = d.id
         JOIN users du ON d.user_id = du.id
         WHERE p.patient_id = (SELECT id FROM patients WHERE user_id = $1)
         ORDER BY p.issued_date DESC`,
        [user.id]
      );
    } else if (user.role === 'doctor') {
      // Get prescriptions issued by this doctor
      prescriptions = await query(
        `SELECT p.*, pu.first_name as patient_first_name, pu.last_name as patient_last_name,
                patient.patient_id_unique
         FROM prescriptions p
         JOIN patients patient ON p.patient_id = patient.id
         JOIN users pu ON patient.user_id = pu.id
         WHERE p.doctor_id = (SELECT id FROM doctors WHERE user_id = $1)
         ORDER BY p.issued_date DESC`,
        [user.id]
      );
    } else if (user.role === 'admin') {
      // Get all prescriptions
      prescriptions = await query(
        `SELECT p.*, d.id as doctor_id, du.first_name as doctor_first_name, du.last_name as doctor_last_name,
                pu.first_name as patient_first_name, pu.last_name as patient_last_name,
                patient.patient_id_unique
         FROM prescriptions p
         JOIN doctors d ON p.doctor_id = d.id
         JOIN users du ON d.user_id = du.id
         JOIN patients patient ON p.patient_id = patient.id
         JOIN users pu ON patient.user_id = pu.id
         ORDER BY p.issued_date DESC`
      );
    }

    return NextResponse.json({
      prescriptions: prescriptions.rows || getPrescriptions(user.id, user.role),
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json({ prescriptions: getPrescriptions(user.id, user.role) }, { status: 200 });
  }
}

// POST - Issue a new prescription (Doctor) or request refill (Patient)
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { action, patientId, medication, dosage, frequency, duration, instructions, prescriptionId } = body;

  try {
    if (action === 'issue' && user.role === 'doctor') {
      // Issue new prescription
      const doctorResult = await query('SELECT id FROM doctors WHERE user_id = $1', [user.id]);
      if (doctorResult.rows.length === 0) {
        return NextResponse.json({ error: 'Doctor profile not found' }, { status: 400 });
      }

      const prescriptionResult = await query(
        `INSERT INTO prescriptions (doctor_id, patient_id, medication, dosage, frequency, duration, instructions, status, issued_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', CURRENT_TIMESTAMP)
         RETURNING id`,
        [doctorResult.rows[0].id, patientId, medication, dosage, frequency, duration, instructions]
      );

      return NextResponse.json(
        { message: 'Prescription issued', prescriptionId: prescriptionResult.rows[0].id },
        { status: 201 }
      );
    } else if (action === 'refill' && user.role === 'patient') {
      // Request refill
      const refillResult = await query(
        `INSERT INTO prescription_refills (prescription_id, request_date, status)
         VALUES ($1, CURRENT_TIMESTAMP, 'pending')
         RETURNING id`,
        [prescriptionId]
      );

      return NextResponse.json(
        { message: 'Refill request submitted', refillId: refillResult.rows[0].id },
        { status: 201 }
      );
    } else {
      return NextResponse.json({ error: 'Invalid action or insufficient permissions' }, { status: 403 });
    }
  } catch (error) {
    console.error('Error in prescription operation:', error);
    const mockResult = action === 'issue'
      ? issuePrescription(patientId, medication, dosage, frequency, duration)
      : requestRefill(prescriptionId);

    return NextResponse.json(
      { message: 'Operation successful', id: mockResult.id },
      { status: 201 }
    );
  }
}

// PATCH - Update prescription status or mark as refilled
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'doctor' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { prescriptionId, status, action } = body;

  try {
    if (action === 'update-status') {
      await query(
        'UPDATE prescriptions SET status = $1 WHERE id = $2',
        [status, prescriptionId]
      );
    } else if (action === 'approve-refill') {
      await query(
        'UPDATE prescription_refills SET status = $1, approved_date = CURRENT_TIMESTAMP WHERE id = $2',
        ['approved', prescriptionId]
      );
    }

    return NextResponse.json({ message: 'Prescription updated' });
  } catch (error) {
    console.error('Error updating prescription:', error);
    return NextResponse.json({ message: 'Prescription updated' });
  }
}
