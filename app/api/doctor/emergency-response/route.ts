import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { acknowledgeHospitalEmergencyAlert, getHospitalEmergencyInbox } from '@/lib/demo-store';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'doctor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const inbox = getHospitalEmergencyInbox(Number(user.userId));
  if (!inbox) {
    return NextResponse.json({ error: 'Emergency inbox unavailable' }, { status: 404 });
  }

  return NextResponse.json(inbox, { status: 200 });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'doctor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const requestId = Number(body.requestId);
  const alertId = typeof body.alertId === 'number' ? body.alertId : undefined;
  const note = typeof body.note === 'string' ? body.note : undefined;

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ error: 'Valid requestId is required' }, { status: 400 });
  }

  const result = acknowledgeHospitalEmergencyAlert(Number(user.userId), {
    requestId,
    alertId,
    note,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ message: 'Emergency alert acknowledged', acknowledgement: result.data }, { status: 200 });
}
