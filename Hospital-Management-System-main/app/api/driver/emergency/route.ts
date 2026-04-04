import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDriverEmergencyOverview } from '@/lib/demo-store';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'driver') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const overview = getDriverEmergencyOverview(Number(user.userId));
  if (!overview) {
    return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
  }

  return NextResponse.json({ overview }, { status: 200 });
}
