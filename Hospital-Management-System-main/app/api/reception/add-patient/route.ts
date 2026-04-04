import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db-server';

async function ensureReceptionPatientColumns() {
  await query('ALTER TABLE patient_pre_registration ADD COLUMN IF NOT EXISTS age INTEGER');
  await query('ALTER TABLE patient_pre_registration ADD COLUMN IF NOT EXISTS gender VARCHAR(20)');
  await query('ALTER TABLE patient_pre_registration ADD COLUMN IF NOT EXISTS address TEXT');
  await query('ALTER TABLE patient_pre_registration ADD COLUMN IF NOT EXISTS email VARCHAR(255)');
  await query('ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INTEGER');
}

async function generatePatientId() {
  const year = new Date().getFullYear();
  const prefix = `DC${year}`;

  const latest = await query(
    `SELECT patient_id_unique
     FROM patient_pre_registration
     WHERE patient_id_unique LIKE $1
     ORDER BY patient_id_unique DESC
     LIMIT 1`,
    [`${prefix}%`]
  );

  const latestId = latest.rows[0]?.patient_id_unique as string | undefined;
  const latestSequence = latestId ? Number(latestId.replace(prefix, '')) : 0;
  const nextSequence = Number.isFinite(latestSequence) ? latestSequence + 1 : 1;

  return `${prefix}${String(nextSequence).padStart(3, '0')}`;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  
  // Only receptionists can add patients
  if (!user || user.role !== 'reception') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureReceptionPatientColumns();

    const { firstName, lastName, phone, email, age, gender, address } = await request.json();

    // Validate required fields
    if (!firstName || !lastName || !phone || !age || !gender || !address) {
      return NextResponse.json(
        { error: 'First name, last name, age, gender, mobile number, and address are required' },
        { status: 400 }
      );
    }

    const parsedAge = Number(age);
    if (!Number.isInteger(parsedAge) || parsedAge <= 0 || parsedAge > 130) {
      return NextResponse.json({ error: 'Age must be a valid number between 1 and 130' }, { status: 400 });
    }

    const normalizedEmail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;
    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 });
    }

    // Generate unique patient ID in DCYYYY### format (e.g., DC2025001)
    let patientId = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      patientId = await generatePatientId();

      // Check if unique
      const existingCheck = await query(
        'SELECT id FROM patient_pre_registration WHERE patient_id_unique = $1',
        [patientId]
      );

      if (existingCheck.rows.length === 0) {
        isUnique = true;
        break;
      }

      attempts++;
    }

    if (!patientId || !isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique patient ID' },
        { status: 500 }
      );
    }

    // Create pre-registration record
    const result = await query(
      `INSERT INTO patient_pre_registration (
        patient_id_unique, first_name, last_name, phone, email, age, gender, address, created_by_receptionist_id, is_activated
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, patient_id_unique, first_name, last_name, age, gender, phone, email, address`,
      [patientId, firstName, lastName, phone, normalizedEmail, parsedAge, gender, address, user.userId, false]
    );

    const preReg = result.rows[0];

    return NextResponse.json(
      {
        message: 'Patient pre-registration created successfully',
        patient: {
          patientId: preReg.patient_id_unique,
          firstName: preReg.first_name,
          lastName: preReg.last_name,
          age: preReg.age,
          gender: preReg.gender,
          phone: preReg.phone,
          email: preReg.email,
          address: preReg.address,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding patient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
