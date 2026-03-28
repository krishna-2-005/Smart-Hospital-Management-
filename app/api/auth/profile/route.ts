import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getDemoAuthProfile } from '@/lib/demo-store';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user details
    const userResult = await query(
      'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = $1',
      [user.userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userResult.rows[0];

    // Get additional role-specific data
    let additionalData: any = {};

    try {
      if (userData.role === 'patient') {
        const patientResult = await query(
          'SELECT * FROM patients WHERE user_id = $1',
          [user.userId]
        );
        if (patientResult.rows.length > 0) {
          additionalData = patientResult.rows[0];
        }
      } else if (userData.role === 'doctor') {
        const doctorResult = await query(
          'SELECT * FROM doctors WHERE user_id = $1',
          [user.userId]
        );
        if (doctorResult.rows.length > 0) {
          additionalData = doctorResult.rows[0];
        }
      }
    } catch (error) {
      // Role-specific table might not exist yet, continue with basic info
      console.log('Role-specific data not available');
    }

    return NextResponse.json(
      {
        userId: userData.id,
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role,
        isActive: userData.is_active,
        ...additionalData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile fetch error:', error);

    const user = await getCurrentUser();
    if (user) {
      const demoProfile = getDemoAuthProfile(user.userId);
      if (demoProfile) {
        return NextResponse.json(demoProfile, { status: 200 });
      }
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
