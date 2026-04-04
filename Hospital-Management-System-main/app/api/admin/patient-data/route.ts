import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db-server';
import { getAdminPatientData } from '@/lib/demo-store';

function maskEmail(email: string | null | undefined) {
  if (!email) return 'hidden';
  const [name, domain] = email.split('@');
  if (!name || !domain) return 'hidden';
  const keep = Math.min(2, name.length);
  return `${name.slice(0, keep)}***@${domain}`;
}

function maskPhone(phone: string | null | undefined) {
  if (!phone) return 'hidden';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return 'hidden';
  return `******${digits.slice(-4)}`;
}

function normalizeIntakeType(value: string | null) {
  if (!value) return 'all';
  const normalized = value.toLowerCase();
  if (normalized === 'appointments') return 'appointment';
  if (normalized === 'walk-ins' || normalized === 'walkins') return 'walk-in';
  if (normalized === 'emergency') return 'emergency';
  return normalized;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ward = request.nextUrl.searchParams.get('ward') || 'all';
  const intakeType = normalizeIntakeType(request.nextUrl.searchParams.get('intakeType'));

  try {
    const records = await query(
      `SELECT a.id,
              a.appointment_date,
              a.appointment_time,
              a.status,
              a.reason_for_visit,
              p.id AS patient_id,
              p.patient_id_unique,
              up.first_name AS patient_first_name,
              up.last_name AS patient_last_name,
              up.email AS patient_email,
              up.phone AS patient_phone,
              d.specialization,
              ud.first_name AS doctor_first_name,
              ud.last_name AS doctor_last_name,
              COALESCE(ward_data.ward, 'General') AS ward,
              CASE
                WHEN a.status = 'scheduled' THEN 'appointment'
                ELSE 'walk-in'
              END AS intake_type
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN users up ON up.id = p.user_id
       LEFT JOIN doctors d ON d.id = a.doctor_id
       LEFT JOIN users ud ON ud.id = d.user_id
       LEFT JOIN LATERAL (
         SELECT b.ward
         FROM bed_allocations ba
         JOIN beds b ON b.id = ba.bed_id
         WHERE ba.patient_id = p.id
         ORDER BY ba.allocated_at DESC
         LIMIT 1
       ) ward_data ON TRUE
       WHERE ($1 = 'all' OR LOWER(COALESCE(ward_data.ward, 'General')) = LOWER($1))
         AND (
           $2 = 'all'
           OR CASE WHEN a.status = 'scheduled' THEN 'appointment' ELSE 'walk-in' END = $2
         )
       ORDER BY a.appointment_date DESC, a.appointment_time DESC
       LIMIT 200`,
      [ward, intakeType],
    );

    return NextResponse.json({
      records: records.rows.map((row) => ({
        id: row.id,
        date: `${row.appointment_date} ${row.appointment_time}`,
        patientName: `${row.patient_first_name} ${row.patient_last_name}`,
        patientId: row.patient_id_unique,
        doctorName: row.doctor_first_name && row.doctor_last_name
          ? `${row.doctor_first_name} ${row.doctor_last_name}`
          : 'Unassigned',
        specialization: row.specialization || 'General Medicine',
        ward: row.ward || 'General',
        intakeType: row.intake_type,
        visitStatus: row.status,
        reason: row.reason_for_visit || 'Consultation',
        protectedEmail: maskEmail(row.patient_email),
        protectedPhone: maskPhone(row.patient_phone),
      })),
    });
  } catch (error) {
    console.error('Error fetching admin patient data:', error);
    return NextResponse.json(
      { records: getAdminPatientData({ ward, intakeType }) },
      { status: 200 },
    );
  }
}
