import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getBeds, updateBedAllocation } from '@/lib/demo-store';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const bedsResult = await query(
      `SELECT b.*, p.patient_id_unique, u.first_name, u.last_name
       FROM beds b
       LEFT JOIN patients p ON b.allocated_to_patient_id = p.id
       LEFT JOIN users u ON p.user_id = u.id
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

  const { bedId, allocatedToPatientId, isAvailable } = await request.json();

  try {
    await query(
      `UPDATE beds
       SET allocated_to_patient_id = $1, is_available = $2, allocated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [allocatedToPatientId, isAvailable, bedId]
    );

    return NextResponse.json({ message: 'Bed updated successfully' });
  } catch (error) {
    console.error('Error updating bed:', error);
    const updated = updateBedAllocation(Number(bedId), allocatedToPatientId ? Number(allocatedToPatientId) : null, Boolean(isAvailable));
    if (updated) {
      return NextResponse.json({ message: 'Bed updated successfully' });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
