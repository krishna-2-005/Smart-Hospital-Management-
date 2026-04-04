import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db-server';
import { getAdminPatients } from '@/lib/demo-store';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await query(
      `SELECT p.id,
              p.patient_id_unique,
              p.blood_type,
              p.allergies,
              u.first_name,
              u.last_name,
              u.email
       FROM patients p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`,
    );

    return NextResponse.json({
      patients: result.rows.map((row) => ({
        id: row.id,
        patientId: row.patient_id_unique,
        name: `${row.first_name} ${row.last_name}`,
        email: row.email,
        bloodType: row.blood_type || 'NA',
        allergies: row.allergies || 'None',
      })),
    });
  } catch (error) {
    console.error('Error fetching admin patients:', error);
    return NextResponse.json({ patients: getAdminPatients() }, { status: 200 });
  }
}
