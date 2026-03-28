import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSmartEmergencyRequest } from '@/lib/demo-store';

const ALLOWED_TYPES = ['accident', 'cardiac', 'stroke', 'breathing', 'trauma', 'other'];

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'patient') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const emergencyType = String(body.emergencyType || '').toLowerCase();
  const conditionSummary = String(body.conditionSummary || '').trim();
  const lat = Number(body.lat);
  const lng = Number(body.lng);

  if (!ALLOWED_TYPES.includes(emergencyType)) {
    return NextResponse.json({ error: 'Invalid emergency type' }, { status: 400 });
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Valid location is required' }, { status: 400 });
  }

  if (conditionSummary.length < 6) {
    return NextResponse.json({ error: 'Condition summary is too short' }, { status: 400 });
  }

  const result = createSmartEmergencyRequest(Number(user.userId), {
    emergencyType: emergencyType as 'accident' | 'cardiac' | 'stroke' | 'breathing' | 'trauma' | 'other',
    conditionSummary,
    lat,
    lng,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ request: result.data }, { status: 201 });
}
