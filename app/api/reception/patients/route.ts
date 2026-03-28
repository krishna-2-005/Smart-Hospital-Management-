import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

async function ensurePatientColumns() {
  await query('ALTER TABLE patient_pre_registration ADD COLUMN IF NOT EXISTS age INTEGER');
  await query('ALTER TABLE patient_pre_registration ADD COLUMN IF NOT EXISTS gender VARCHAR(20)');
  await query('ALTER TABLE patient_pre_registration ADD COLUMN IF NOT EXISTS address TEXT');
  await query('ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INTEGER');
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'reception' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensurePatientColumns();

    const search = request.nextUrl.searchParams.get('q')?.trim() || '';

    const patientsResult = await query(
      `SELECT p.id,
              p.patient_id_unique,
              p.age,
              p.gender,
              p.medical_history,
              p.address,
              p.city,
              p.state,
              p.zip_code,
              p.created_at,
              u.first_name,
              u.last_name,
              u.phone,
              COALESCE(vs.visit_count, 0) AS visit_count,
              vs.last_visit_date,
              COALESCE(vs.scans_done_count, 0) AS scans_done_count
       FROM patients p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN (
         SELECT v.patient_id,
                COUNT(*) AS visit_count,
                MAX(v.visit_date) AS last_visit_date,
                SUM(
                  CASE
                    WHEN COALESCE(v.diagnosis, '') ILIKE '%scan%'
                      OR COALESCE(v.treatment_plan, '') ILIKE '%scan%'
                      OR COALESCE(v.symptoms, '') ILIKE '%scan%'
                    THEN 1
                    ELSE 0
                  END
                ) AS scans_done_count
         FROM visits v
         GROUP BY v.patient_id
       ) vs ON vs.patient_id = p.id
       WHERE ($1 = ''
          OR LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE LOWER($2)
          OR LOWER(COALESCE(u.phone, '')) LIKE LOWER($2)
          OR LOWER(p.patient_id_unique) LIKE LOWER($2))
       ORDER BY p.created_at DESC
       LIMIT 100`,
      [search, `%${search}%`]
    );

    return NextResponse.json({
      patients: patientsResult.rows.map((row) => ({
        id: row.id,
        patientId: row.patient_id_unique,
        firstName: row.first_name,
        lastName: row.last_name,
        age: row.age,
        gender: row.gender,
        phone: row.phone,
        address: row.address,
        city: row.city,
        state: row.state,
        zipCode: row.zip_code,
        medicalHistory: row.medical_history,
        visitCount: Number(row.visit_count || 0),
        scansDone: Number(row.scans_done_count || 0),
        lastVisitDate: row.last_visit_date,
      })),
    });
  } catch (error) {
    console.error('Error fetching receptionist patient list:', error);
    return NextResponse.json({ error: 'Failed to load patients' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'reception' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensurePatientColumns();

    const data = await request.json();

    if (!data.patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
    }

    const patientResult = await query('SELECT id, user_id FROM patients WHERE patient_id_unique = $1', [
      data.patientId,
    ]);

    if (patientResult.rows.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const patient = patientResult.rows[0];

    await query(
      `UPDATE users
       SET phone = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [data.phone || null, patient.user_id]
    );

    await query(
      `UPDATE patients
       SET age = $1,
           gender = $2,
           address = $3,
           city = $4,
           state = $5,
           zip_code = $6,
           medical_history = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [
        data.age || null,
        data.gender || null,
        data.address || null,
        data.city || null,
        data.state || null,
        data.zipCode || null,
        data.medicalHistory || null,
        patient.id,
      ]
    );

    return NextResponse.json({ message: 'Patient details updated successfully' });
  } catch (error) {
    console.error('Error updating receptionist patient:', error);
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
  }
}
