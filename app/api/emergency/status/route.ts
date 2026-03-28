import { NextRequest, NextResponse } from 'next/server';
import { getSmartEmergencyStatusById } from '@/lib/demo-store';

export async function GET(request: NextRequest) {
  const requestIdParam = request.nextUrl.searchParams.get('requestId');
  const requestId = Number(requestIdParam);

  if (!Number.isFinite(requestId) || requestId <= 0) {
    return NextResponse.json({ error: 'Valid requestId is required' }, { status: 400 });
  }

  const status = getSmartEmergencyStatusById(requestId);
  if (!status) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  return NextResponse.json({ status }, { status: 200 });
}
