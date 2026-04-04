import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db-server';
import { getPatientProfile, updatePatientProfile } from '@/lib/demo-store';

async function ensureBedAllocationTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS bed_allocations (
      id SERIAL PRIMARY KEY,
      bed_id INTEGER NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
      patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      allocated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      admission_reason TEXT,
      admission_diagnosis TEXT,
      admitting_doctor_name VARCHAR(150),
      expected_stay_days INTEGER,
      insurance_provider VARCHAR(120),
      insurance_policy_number VARCHAR(120),
      emergency_contact_name VARCHAR(120),
      emergency_contact_phone VARCHAR(30),
      clinical_notes TEXT,
      requires_ventilator BOOLEAN DEFAULT false,
      requires_isolation BOOLEAN DEFAULT false,
      diet_type VARCHAR(60),
      allergies_confirmed BOOLEAN DEFAULT false,
      status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'released')),
      allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      released_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'patient') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureBedAllocationTable();

    // Get patient details
    const patientResult = await query(
      `SELECT p.*, u.email, u.phone, u.first_name, u.last_name
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1`,
      [user.userId]
    );

    if (patientResult.rows.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const patient = patientResult.rows[0];

    const currentBedResult = await query(
      `SELECT b.bed_number, b.ward, b.bed_type,
              ba.allocated_at, ba.admission_reason, ba.admission_diagnosis,
              ba.admitting_doctor_name, ba.expected_stay_days, ba.diet_type
       FROM bed_allocations ba
       JOIN beds b ON b.id = ba.bed_id
       WHERE ba.patient_id = $1 AND ba.status = 'active'
       ORDER BY ba.allocated_at DESC
       LIMIT 1`,
      [patient.id],
    );

    const bedHistoryResult = await query(
      `SELECT ba.id, b.bed_number, b.ward, b.bed_type,
              ba.admission_reason, ba.admission_diagnosis,
              ba.admitting_doctor_name, ba.expected_stay_days,
              ba.status, ba.allocated_at, ba.released_at
       FROM bed_allocations ba
       JOIN beds b ON b.id = ba.bed_id
       WHERE ba.patient_id = $1
       ORDER BY ba.allocated_at DESC
       LIMIT 10`,
      [patient.id],
    );

    const activeBed = currentBedResult.rows[0];

    return NextResponse.json({
      patientId: patient.patient_id_unique,
      firstName: patient.first_name,
      lastName: patient.last_name,
      age: patient.age,
      email: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.date_of_birth,
      gender: patient.gender,
      bloodType: patient.blood_type,
      allergies: patient.allergies,
      medicalHistory: patient.medical_history,
      emergencyContactName: patient.emergency_contact_name,
      emergencyContactPhone: patient.emergency_contact_phone,
      address: patient.address,
      city: patient.city,
      state: patient.state,
      zipCode: patient.zip_code,
      currentBed: activeBed
        ? {
            bedNumber: activeBed.bed_number,
            ward: activeBed.ward,
            bedType: activeBed.bed_type,
            allocatedAt: activeBed.allocated_at,
            admissionReason: activeBed.admission_reason,
            diagnosis: activeBed.admission_diagnosis,
            admittingDoctorName: activeBed.admitting_doctor_name,
            expectedStayDays: activeBed.expected_stay_days,
            dietType: activeBed.diet_type,
          }
        : null,
      bedHistory: bedHistoryResult.rows.map((item) => ({
        id: item.id,
        bedNumber: item.bed_number,
        ward: item.ward,
        bedType: item.bed_type,
        admissionReason: item.admission_reason,
        diagnosis: item.admission_diagnosis,
        admittingDoctorName: item.admitting_doctor_name,
        expectedStayDays: item.expected_stay_days,
        status: item.status,
        allocatedAt: item.allocated_at,
        releasedAt: item.released_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    const profile = getPatientProfile(user.userId);
    if (profile) {
      return NextResponse.json(profile, { status: 200 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'patient') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  const allowedPatientUpdates = {
    phone: data.phone,
    emergencyContactName: data.emergencyContactName,
    emergencyContactPhone: data.emergencyContactPhone,
    address: data.address,
    city: data.city,
    state: data.state,
    zipCode: data.zipCode,
  };

  try {
    // Patients can edit only personal/contact details from their own portal.
    await query(
      `UPDATE patients
       SET emergency_contact_name = $1, emergency_contact_phone = $2,
           address = $3, city = $4, state = $5, zip_code = $6, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $7`,
      [
        allowedPatientUpdates.emergencyContactName || null,
        allowedPatientUpdates.emergencyContactPhone || null,
        allowedPatientUpdates.address || null,
        allowedPatientUpdates.city || null,
        allowedPatientUpdates.state || null,
        allowedPatientUpdates.zipCode || null,
        user.userId,
      ]
    );

    // Update user phone if provided
    if (typeof allowedPatientUpdates.phone !== 'undefined') {
      await query('UPDATE users SET phone = $1 WHERE id = $2', [allowedPatientUpdates.phone || null, user.userId]);
    }

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating patient profile:', error);
    const updated = updatePatientProfile(user.userId, allowedPatientUpdates);
    if (updated) {
      return NextResponse.json({ message: 'Profile updated successfully' });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
