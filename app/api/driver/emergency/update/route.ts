import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateDriverEmergencyStatus } from '@/lib/demo-store';

const ALLOWED_STATUSES = ['ambulance-assigned', 'en-route', 'hospital-notified', 'arriving', 'arrived'];

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'driver') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const requestId = Number(body.requestId);
  const status = String(body.status || '').trim() as
    | 'ambulance-assigned'
    | 'en-route'
    | 'hospital-notified'
    | 'arriving'
    | 'arrived';
  const note = typeof body.note === 'string' ? body.note : undefined;

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ error: 'Valid requestId is required' }, { status: 400 });
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }

  const result = updateDriverEmergencyStatus(Number(user.userId), { requestId, status, note });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ status: result.data }, { status: 200 });
}
