import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { sendDriverEmergencyAlert } from '@/lib/demo-store';

const ALLOWED_ALERT_TYPES = [
  'patient-critical',
  'route-blocked',
  'requires-icu-prep',
  'oxygen-support-needed',
  'security-support',
] as const;

type AlertType = (typeof ALLOWED_ALERT_TYPES)[number];

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'driver') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const requestId = Number(body.requestId);
  const alertType = String(body.alertType || '').trim() as AlertType;
  const message = typeof body.message === 'string' ? body.message : undefined;

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ error: 'Valid requestId is required' }, { status: 400 });
  }

  if (!ALLOWED_ALERT_TYPES.includes(alertType)) {
    return NextResponse.json({ error: 'Invalid alert type' }, { status: 400 });
  }

  const result = sendDriverEmergencyAlert(Number(user.userId), {
    requestId,
    alertType,
    message,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(
    {
      message: 'Emergency alert broadcast to hospital teams',
      alert: result.data,
    },
    { status: 200 }
  );
}
