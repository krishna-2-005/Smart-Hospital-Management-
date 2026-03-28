import { NextRequest, NextResponse } from 'next/server';
import { createPublicSmartEmergencyRequest } from '@/lib/demo-store';

const ALLOWED_TYPES = ['accident', 'cardiac', 'stroke', 'breathing', 'trauma', 'other'];

export async function POST(request: NextRequest) {
  const body = await request.json();
  const callerName = String(body.callerName || '').trim();
  const callerPhone = String(body.callerPhone || '').trim();
  const ageValue = body.age;
  const emergencyType = String(body.emergencyType || '').toLowerCase();
  const conditionSummary = String(body.conditionSummary || '').trim();
  const lat = Number(body.lat);
  const lng = Number(body.lng);

  if (callerName.length < 2) {
    return NextResponse.json({ error: 'Caller name is required' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(emergencyType)) {
    return NextResponse.json({ error: 'Invalid emergency type' }, { status: 400 });
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Valid location is required' }, { status: 400 });
  }

  if (conditionSummary.length < 6) {
    return NextResponse.json({ error: 'Condition summary is too short' }, { status: 400 });
  }

  const age = Number.isFinite(Number(ageValue)) ? Number(ageValue) : null;

  const result = createPublicSmartEmergencyRequest({
    callerName,
    callerPhone,
    age,
    emergencyType: emergencyType as 'accident' | 'cardiac' | 'stroke' | 'breathing' | 'trauma' | 'other',
    conditionSummary,
    lat,
    lng,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(
    {
      requestId: result.data.id,
      status: result.data.status,
    },
    { status: 201 }
  );
}
