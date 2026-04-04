import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getAdminDoctors,
  getEmergencyCases,
  updateEmergencyAssignment,
  updateEmergencyStatus,
} from '@/lib/demo-store';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ cases: getEmergencyCases() }, { status: 200 });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { caseId, status, assignedDoctorId, forceOverride } = await request.json();

  const normalizedCaseId = Number(caseId);
  if (!normalizedCaseId) {
    return NextResponse.json({ error: 'Invalid caseId' }, { status: 400 });
  }

  const hasStatusUpdate = typeof status === 'string' && status.length > 0;
  const hasAssignmentUpdate = typeof assignedDoctorId !== 'undefined';

  if (!hasStatusUpdate && !hasAssignmentUpdate) {
    return NextResponse.json({ error: 'No update payload provided' }, { status: 400 });
  }

  let updated = true;

  if (hasStatusUpdate) {
    updated = updateEmergencyStatus(normalizedCaseId, status as 'pending' | 'in-progress' | 'resolved') && updated;
  }

  if (hasAssignmentUpdate) {
    const emergencyCase = getEmergencyCases().find((item) => item.id === normalizedCaseId);
    if (!emergencyCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const doctorId = assignedDoctorId ? Number(assignedDoctorId) : null;
    const isGuardedCase = emergencyCase.severity === 'critical' && emergencyCase.status === 'pending';

    if (doctorId && isGuardedCase && !forceOverride) {
      const selectedDoctor = getAdminDoctors().find((doc) => doc.id === doctorId);
      if (!selectedDoctor) {
        return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
      }
      if (!selectedDoctor.isAvailable) {
        return NextResponse.json(
          { error: 'Only available doctors can be assigned to pending critical cases unless override is enabled.' },
          { status: 400 }
        );
      }
    }

    updated =
      updateEmergencyAssignment(normalizedCaseId, doctorId, {
        actorUserId: Number(user.userId || 0),
        actorLabel: `Admin #${Number(user.userId || 0)}`,
        forceOverride: Boolean(forceOverride),
      }) && updated;
  }

  if (!updated) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Emergency case updated' }, { status: 200 });
}
