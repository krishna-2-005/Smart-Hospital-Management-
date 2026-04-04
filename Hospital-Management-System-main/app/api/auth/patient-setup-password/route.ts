import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db-server';
import { hashPassword, setAuthCookie, generateToken } from '@/lib/auth';

async function ensurePatientColumns() {
  await query('ALTER TABLE patient_pre_registration ADD COLUMN IF NOT EXISTS age INTEGER');
  await query('ALTER TABLE patient_pre_registration ADD COLUMN IF NOT EXISTS gender VARCHAR(20)');
  await query('ALTER TABLE patient_pre_registration ADD COLUMN IF NOT EXISTS address TEXT');
  await query('ALTER TABLE patient_pre_registration ADD COLUMN IF NOT EXISTS email VARCHAR(255)');
  await query('ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INTEGER');
}

export async function POST(request: NextRequest) {
  const { patientId, password, confirmPassword } = await request.json();

  if (!patientId || !password || !confirmPassword) {
    return NextResponse.json(
      { error: 'Patient ID, password, and confirmation are required' },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: 'Passwords do not match' },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters long' },
      { status: 400 }
    );
  }

  try {
    await ensurePatientColumns();

    // Check if patient ID exists and not yet activated
    const preRegResult = await query(
      'SELECT * FROM patient_pre_registration WHERE patient_id_unique = $1',
      [patientId]
    );

    if (preRegResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid patient ID' },
        { status: 404 }
      );
    }

    const preReg = preRegResult.rows[0];

    if (preReg.is_activated) {
      return NextResponse.json(
        { error: 'This patient account is already activated' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    const fallbackEmail = `${patientId}@patient.local`;
    let userEmail = preReg.email ? String(preReg.email).trim().toLowerCase() : fallbackEmail;

    if (userEmail) {
      const existingEmail = await query('SELECT id FROM users WHERE email = $1', [userEmail]);
      if (existingEmail.rows.length > 0) {
        userEmail = fallbackEmail;
      }
    }

    // Create user account for this patient
    const userResult = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, first_name, last_name, role`,
      [
        userEmail,
        passwordHash,
        preReg.first_name,
        preReg.last_name,
        preReg.phone || null,
        'patient',
      ]
    );

    const newUser = userResult.rows[0];

    // Create patient record
    await query(
      `INSERT INTO patients (user_id, patient_id_unique, age, gender, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [newUser.id, patientId, preReg.age || null, preReg.gender || null, preReg.address || null]
    );

    // Update pre-registration to mark as activated and link to user
    await query(
      `UPDATE patient_pre_registration
       SET is_activated = true, user_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE patient_id_unique = $2`,
      [newUser.id, patientId]
    );

    // Generate token and set auth cookie
    const token = generateToken(newUser.id, 'patient');
    await setAuthCookie(token);

    return NextResponse.json(
      {
        message: 'Account setup successful',
        user: {
          id: newUser.id,
          patientId: patientId,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Password setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
