import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { comparePassword, setAuthCookie, generateToken } from '@/lib/auth';
import { validateDemoStaffCredentials } from '@/lib/demo-store';

export async function POST(request: NextRequest) {
  const { staffId, password } = await request.json();

  if (!staffId || !password) {
    return NextResponse.json(
      { error: 'Staff ID and password are required' },
      { status: 400 }
    );
  }

  try {
    // Ensure staff_id column exists
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS staff_id VARCHAR(8) UNIQUE`);

    const userResult = await query(
      `SELECT id, email, staff_id, password_hash, first_name, last_name, role, must_change_password
       FROM users WHERE staff_id = $1 AND is_active = true AND role != 'patient'`,
      [staffId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid Staff ID or password' },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid Staff ID or password' },
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
          staffId: user.staff_id,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          mustChangePassword: user.must_change_password ?? false,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);

    const demoUser = validateDemoStaffCredentials(staffId, password);
    if (demoUser) {
      const token = generateToken(demoUser.id, demoUser.role);
      await setAuthCookie(token);

      return NextResponse.json(
        {
          message: 'Login successful (demo mode)',
          user: {
            id: demoUser.id,
            staffId: demoUser.staffId,
            firstName: demoUser.firstName,
            lastName: demoUser.lastName,
            role: demoUser.role,
            mustChangePassword: demoUser.mustChangePassword ?? false,
          },
        },
        { status: 200 }
      );
    }

    if (error instanceof Error) {
      const isDbConfigError = error.message.includes('Database pool not initialized');
      const isDbConnectionError =
        error.message.includes('Database connection failed') ||
        error.message.includes('ECONNREFUSED');

      if (isDbConfigError || isDbConnectionError) {
        return NextResponse.json(
          {
            error: 'Database is unavailable. Verify DATABASE_URL and make sure PostgreSQL is running.',
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
