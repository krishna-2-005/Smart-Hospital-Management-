import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPatientSmartEmergencyStatus } from '@/lib/demo-store';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'patient') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = getPatientSmartEmergencyStatus(Number(user.userId));

  if (!status) {
    return NextResponse.json({ status: null }, { status: 200 });
  }

  return NextResponse.json({ status }, { status: 200 });
}
