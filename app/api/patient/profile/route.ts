import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getPatientProfile, updatePatientProfile } from '@/lib/demo-store';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'patient') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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
