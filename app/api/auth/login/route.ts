import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { comparePassword, setAuthCookie, generateToken } from '@/lib/auth';
import { validateDemoCredentials } from '@/lib/demo-store';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  try {
    const userResult = await query(
      'SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
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
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);

    const demoUser = validateDemoCredentials(email, password);
    if (demoUser) {
      const token = generateToken(demoUser.id, demoUser.role);
      await setAuthCookie(token);

      return NextResponse.json(
        {
          message: 'Login successful (demo mode)',
          user: {
            id: demoUser.id,
            email: demoUser.email,
            firstName: demoUser.firstName,
            lastName: demoUser.lastName,
            role: demoUser.role,
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
