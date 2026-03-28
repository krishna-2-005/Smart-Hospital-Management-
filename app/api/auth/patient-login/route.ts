import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { comparePassword, setAuthCookie, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { patientId, password } = await request.json();

  if (!patientId) {
    return NextResponse.json(
      { error: 'Patient ID is required' },
      { status: 400 }
    );
  }

  try {
    // Check if patient ID exists
    const preRegResult = await query(
      'SELECT * FROM patient_pre_registration WHERE patient_id_unique = $1',
      [patientId]
    );

    if (preRegResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid patient ID' },
        { status: 401 }
      );
    }

    const preReg = preRegResult.rows[0];

    // If not activated, this is first login - check if password is set
    if (!preReg.is_activated) {
      return NextResponse.json(
        {
          message: 'First login detected',
          requiresPasswordSetup: true,
          patientId: patientId,
          firstName: preReg.first_name,
          lastName: preReg.last_name,
        },
        { status: 200 }
      );
    }

    // For activated patients, verify password
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required for activated accounts' },
        { status: 400 }
      );
    }

    if (!preReg.user_id) {
      return NextResponse.json(
        { error: 'Patient account not properly configured' },
        { status: 500 }
      );
    }

    const userResult = await query(
      'SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE id = $1 AND role = $2',
      [preReg.user_id, 'patient']
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = generateToken(user.id, user.role);
    await setAuthCookie(token);

    return NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user.id,
          patientId: patientId,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Patient login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
