import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getClient, query } from '@/lib/db-server';
import { getBeds, updateBedAllocation } from '@/lib/demo-store';

async function ensureBedAllocationTables() {
  await query(`ALTER TABLE beds ADD COLUMN IF NOT EXISTS notes TEXT`);
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
  await query(`CREATE INDEX IF NOT EXISTS idx_bed_allocations_patient_id ON bed_allocations(patient_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_bed_allocations_status ON bed_allocations(status)`);
}

type BedAllocationDetails = {
  admissionReason?: string;
  admissionDiagnosis?: string;
  admittingDoctorName?: string;
  expectedStayDays?: number;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  clinicalNotes?: string;
  requiresVentilator?: boolean;
  requiresIsolation?: boolean;
  dietType?: string;
  allergiesConfirmed?: boolean;
};

function toHistoryLine(message: string) {
  const stamp = new Date().toISOString();
  return `[${stamp}] ${message}`;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureBedAllocationTables();

    const bedsResult = await query(
      `SELECT b.*, p.patient_id_unique, u.first_name, u.last_name,
              ba.id AS allocation_id,
              ba.admission_reason,
              ba.admission_diagnosis,
              ba.admitting_doctor_name,
              ba.expected_stay_days,
              ba.insurance_provider,
              ba.insurance_policy_number,
              ba.emergency_contact_name,
              ba.emergency_contact_phone,
              ba.clinical_notes,
              ba.requires_ventilator,
              ba.requires_isolation,
              ba.diet_type,
              ba.allergies_confirmed,
              ba.allocated_at AS allocation_started_at
       FROM beds b
       LEFT JOIN patients p ON b.allocated_to_patient_id = p.id
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN bed_allocations ba ON ba.bed_id = b.id AND ba.status = 'active'
       ORDER BY b.floor_number, b.bed_number`
    );

    return NextResponse.json({
      beds: bedsResult.rows.map((bed) => ({
        id: bed.id,
        bedNumber: bed.bed_number,
        ward: bed.ward,
        bedType: bed.bed_type,
        floor: bed.floor_number,
        isAvailable: bed.is_available,
        allocatedPatient: bed.allocated_to_patient_id
          ? {
              id: bed.allocated_to_patient_id,
              name: `${bed.first_name} ${bed.last_name}`,
              patientId: bed.patient_id_unique,
            }
          : null,
        allocationDetails: bed.allocation_id
          ? {
              id: bed.allocation_id,
              admissionReason: bed.admission_reason,
              admissionDiagnosis: bed.admission_diagnosis,
              admittingDoctorName: bed.admitting_doctor_name,
              expectedStayDays: bed.expected_stay_days,
              insuranceProvider: bed.insurance_provider,
              insurancePolicyNumber: bed.insurance_policy_number,
              emergencyContactName: bed.emergency_contact_name,
              emergencyContactPhone: bed.emergency_contact_phone,
              clinicalNotes: bed.clinical_notes,
              requiresVentilator: bed.requires_ventilator,
              requiresIsolation: bed.requires_isolation,
              dietType: bed.diet_type,
              allergiesConfirmed: bed.allergies_confirmed,
              allocatedAt: bed.allocation_started_at,
            }
          : null,
        allocatedAt: bed.allocated_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching beds:', error);
    return NextResponse.json({ beds: getBeds() }, { status: 200 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    bedId,
    action,
    allocatedToPatientId,
    allocationDetails,
  }: {
    bedId: number;
    action: 'allocate' | 'release';
    allocatedToPatientId?: number;
    allocationDetails?: BedAllocationDetails;
  } = await request.json();

  try {
    await ensureBedAllocationTables();

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const bedResult = await client.query(
        `SELECT b.id, b.bed_number, b.ward, b.bed_type, b.is_available, b.allocated_to_patient_id
         FROM beds b
         WHERE b.id = $1
         FOR UPDATE`,
        [bedId],
      );

      if (bedResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Bed not found' }, { status: 404 });
      }

      const bed = bedResult.rows[0];

      if (action === 'allocate') {
        if (!allocatedToPatientId) {
          await client.query('ROLLBACK');
          return NextResponse.json({ error: 'Patient selection is required for allocation' }, { status: 400 });
        }

        if (!bed.is_available) {
          await client.query('ROLLBACK');
          return NextResponse.json({ error: 'Bed is already occupied' }, { status: 409 });
        }

        await client.query(
          `UPDATE beds
           SET allocated_to_patient_id = $1,
               is_available = false,
               allocated_at = CURRENT_TIMESTAMP,
               notes = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [allocatedToPatientId, allocationDetails?.clinicalNotes || null, bedId],
        );

        await client.query(
          `INSERT INTO bed_allocations (
             bed_id, patient_id, allocated_by_user_id,
             admission_reason, admission_diagnosis, admitting_doctor_name,
             expected_stay_days, insurance_provider, insurance_policy_number,
             emergency_contact_name, emergency_contact_phone,
             clinical_notes, requires_ventilator, requires_isolation,
             diet_type, allergies_confirmed, status, allocated_at
           ) VALUES (
             $1, $2, $3,
             $4, $5, $6,
             $7, $8, $9,
             $10, $11,
             $12, $13, $14,
             $15, $16, 'active', CURRENT_TIMESTAMP
           )`,
          [
            bedId,
            allocatedToPatientId,
            user.userId,
            allocationDetails?.admissionReason || null,
            allocationDetails?.admissionDiagnosis || null,
            allocationDetails?.admittingDoctorName || null,
            allocationDetails?.expectedStayDays || null,
            allocationDetails?.insuranceProvider || null,
            allocationDetails?.insurancePolicyNumber || null,
            allocationDetails?.emergencyContactName || null,
            allocationDetails?.emergencyContactPhone || null,
            allocationDetails?.clinicalNotes || null,
            Boolean(allocationDetails?.requiresVentilator),
            Boolean(allocationDetails?.requiresIsolation),
            allocationDetails?.dietType || null,
            Boolean(allocationDetails?.allergiesConfirmed),
          ],
        );

        await client.query(
          `UPDATE patients
           SET medical_history = TRIM(BOTH E'\n' FROM CONCAT(COALESCE(medical_history, ''),
             CASE WHEN COALESCE(medical_history, '') = '' THEN '' ELSE E'\n' END,
             $1
           )),
           updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [
            toHistoryLine(
              `Bed allocated: ${bed.bed_number} (${bed.ward}/${bed.bed_type}). Reason: ${allocationDetails?.admissionReason || 'admission'}`,
            ),
            allocatedToPatientId,
          ],
        );
      } else {
        const currentPatientId = bed.allocated_to_patient_id;
        if (!currentPatientId) {
          await client.query('ROLLBACK');
          return NextResponse.json({ error: 'Bed is already free' }, { status: 409 });
        }

        await client.query(
          `UPDATE beds
           SET allocated_to_patient_id = NULL,
               is_available = true,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [bedId],
        );

        await client.query(
          `UPDATE bed_allocations
           SET status = 'released',
               released_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE bed_id = $1 AND patient_id = $2 AND status = 'active'`,
          [bedId, currentPatientId],
        );

        await client.query(
          `UPDATE patients
           SET medical_history = TRIM(BOTH E'\n' FROM CONCAT(COALESCE(medical_history, ''),
             CASE WHEN COALESCE(medical_history, '') = '' THEN '' ELSE E'\n' END,
             $1
           )),
           updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [toHistoryLine(`Bed released: ${bed.bed_number} (${bed.ward}/${bed.bed_type}).`), currentPatientId],
        );
      }

      await client.query('COMMIT');
      return NextResponse.json({ message: `Bed ${action === 'allocate' ? 'allocated' : 'released'} successfully` });
    } catch (transactionError) {
      await client.query('ROLLBACK');
      throw transactionError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating bed:', error);
    const updated = updateBedAllocation(
      Number(bedId),
      action === 'allocate' ? Number(allocatedToPatientId || 0) || null : null,
      action === 'release',
      allocationDetails,
    );
    if (updated) {
      return NextResponse.json({ message: `Bed ${action === 'allocate' ? 'allocated' : 'released'} successfully` });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
