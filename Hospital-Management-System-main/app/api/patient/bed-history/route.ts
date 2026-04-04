import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db-server';
import { getPatientBedHistory } from '@/lib/demo-store';

async function ensureBedAllocationTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS bed_allocations (
      id SERIAL PRIMARY KEY,
      bed_id INTEGER NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
      patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      allocated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      admission_reason TEXT,
      admission_diagnosis TEXT,
      admitting_doctor_name VARCHAR(150),
      expected_stay_days INTEGER,
      insurance_provider VARCHAR(120),
      insurance_policy_number VARCHAR(120),
      emergency_contact_name VARCHAR(120),
      emergency_contact_phone VARCHAR(30),
      clinical_notes TEXT,
      requires_ventilator BOOLEAN DEFAULT false,
      requires_isolation BOOLEAN DEFAULT false,
      diet_type VARCHAR(60),
      allergies_confirmed BOOLEAN DEFAULT false,
      status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'released')),
      allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      released_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'patient') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureBedAllocationTable();

    const patientResult = await query('SELECT id FROM patients WHERE user_id = $1', [user.userId]);
    if (patientResult.rows.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const patientId = patientResult.rows[0].id;

    const historyResult = await query(
      `SELECT ba.id, b.bed_number, b.ward, b.bed_type,
              ba.admission_reason, ba.admission_diagnosis,
              ba.admitting_doctor_name, ba.expected_stay_days,
              ba.status, ba.allocated_at, ba.released_at
       FROM bed_allocations ba
       JOIN beds b ON b.id = ba.bed_id
       WHERE ba.patient_id = $1
       ORDER BY ba.allocated_at DESC`,
      [patientId],
    );

    return NextResponse.json({
      bedHistory: historyResult.rows.map((item) => ({
        id: item.id,
        bedNumber: item.bed_number,
        ward: item.ward,
        bedType: item.bed_type,
        admissionReason: item.admission_reason,
        diagnosis: item.admission_diagnosis,
        admittingDoctorName: item.admitting_doctor_name,
        expectedStayDays: item.expected_stay_days,
        status: item.status,
        allocatedAt: item.allocated_at,
        releasedAt: item.released_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching bed history:', error);
    return NextResponse.json({ bedHistory: getPatientBedHistory(user.userId) }, { status: 200 });
  }
}
