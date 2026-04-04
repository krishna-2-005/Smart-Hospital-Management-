import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDriverEmergencyOverview, updateDriverOperationalProfile } from '@/lib/demo-store';

export async function GET() {
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

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'driver') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const result = updateDriverOperationalProfile(Number(user.userId), {
    name: typeof body.name === 'string' ? body.name : undefined,
    phone: typeof body.phone === 'string' ? body.phone : undefined,
    lat: typeof body.lat === 'number' ? body.lat : undefined,
    lng: typeof body.lng === 'number' ? body.lng : undefined,
    shiftStatus:
      body.shiftStatus === 'on-duty' || body.shiftStatus === 'break' || body.shiftStatus === 'off-duty'
        ? body.shiftStatus
        : undefined,
    fuelLevelPercent: typeof body.fuelLevelPercent === 'number' ? body.fuelLevelPercent : undefined,
    standbyZone: typeof body.standbyZone === 'string' ? body.standbyZone : undefined,
    oxygenKitReady: typeof body.oxygenKitReady === 'boolean' ? body.oxygenKitReady : undefined,
    defibrillatorReady: typeof body.defibrillatorReady === 'boolean' ? body.defibrillatorReady : undefined,
    stretcherReady: typeof body.stretcherReady === 'boolean' ? body.stretcherReady : undefined,
    vehicleNotes: typeof body.vehicleNotes === 'string' ? body.vehicleNotes : undefined,
    lastMaintenanceDate: typeof body.lastMaintenanceDate === 'string' ? body.lastMaintenanceDate : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(
    {
      message: 'Driver details updated successfully',
      overview: result.data,
    },
    { status: 200 }
  );
}
