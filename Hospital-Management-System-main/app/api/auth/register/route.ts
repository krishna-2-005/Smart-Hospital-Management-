import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db-server';
import { hashPassword, setAuthCookie, generateToken } from '@/lib/auth';
import { registerDemoUser } from '@/lib/demo-store';

export async function POST(request: NextRequest) {
  const { email, password, firstName, lastName, role, userType } = await request.json();

  try {
    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['admin', 'doctor', 'reception', 'driver'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Patient registration must be done by reception.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userResult = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, role`,
      [email, passwordHash, firstName, lastName, role]
    );

    const user = userResult.rows[0];

    // If doctor role, create doctor record
    if (role === 'doctor') {
      const specialization = userType || 'General Medicine';
      const licenseNumber = `LIC${Date.now()}${Math.floor(Math.random() * 10000)}`;
      await query(
        `INSERT INTO doctors (user_id, specialization, license_number)
         VALUES ($1, $2, $3)`,
        [user.id, specialization, licenseNumber]
      );
    }

    // Generate token
    const token = generateToken(user.id, role);
    await setAuthCookie(token);

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    const demoUser = registerDemoUser({
      email,
      password,
      firstName,
      lastName,
      role,
      userType,
    });

    if (!demoUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    const token = generateToken(demoUser.id, demoUser.role);
    await setAuthCookie(token);

    return NextResponse.json(
      {
        message: 'User registered successfully (demo mode)',
        user: {
          id: demoUser.id,
          email: demoUser.email,
          firstName: demoUser.firstName,
          lastName: demoUser.lastName,
          role: demoUser.role,
        },
      },
      { status: 201 }
    );
  }
}
