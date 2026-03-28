import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Mock discharge data
const mockDischarges = [
  {
    id: 1,
    admissionId: 1,
    patientId: 1,
    patientName: 'John Doe',
    admissionDate: '2024-01-10',
    dischargeDate: '2024-01-15',
    status: 'completed',
    reason: 'Recovered',
    principalDiagnosis: 'Pneumonia',
    procedures: ['Chest X-ray', 'Oxygen therapy'],
    medications: [
      { name: 'Amoxicillin', dosage: '500mg', frequency: 'Twice daily', duration: '7 days' },
      { name: 'Ibuprofen', dosage: '200mg', frequency: 'As needed', duration: 'As needed' },
    ],
    followUpInstructions:
      'Follow up in 2 weeks. Rest for at least 1 week. Avoid strenuous activities.',
    doctorName: 'Dr. Sarah Johnson',
  },
  {
    id: 2,
    admissionId: 2,
    patientId: 2,
    patientName: 'Jane Smith',
    admissionDate: '2024-01-12',
    dischargeDate: null,
    status: 'pending',
    reason: null,
    principalDiagnosis: 'Appendicitis',
    procedures: [],
    medications: [],
    followUpInstructions: null,
    doctorName: 'Dr. Mike Chen',
  },
];

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('userRole')?.value;
    const userId = cookieStore.get('userId')?.value;

    if (!userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let discharges = mockDischarges;

    // Filter based on role
    if (userRole === 'patient') {
      discharges = discharges.filter(d => d.patientId === parseInt(userId || '0'));
    } else if (userRole === 'doctor') {
      // Doctors see discharges for their patients
      discharges = discharges.filter(d => d.doctorName.includes('Sarah'));
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    if (status) {
      discharges = discharges.filter(d => d.status === status);
    }

    return NextResponse.json({ discharges });
  } catch (error) {
    console.error('Error fetching discharges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discharges' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('userRole')?.value;

    if (userRole !== 'doctor' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      admissionId,
      patientId,
      patientName,
      reason,
      principalDiagnosis,
      procedures,
      medications,
      followUpInstructions,
      doctorName,
      action,
    } = body;

    if (action === 'initiate') {
      // Create new discharge record
      if (!admissionId || !patientId) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const newDischarge = {
        id: mockDischarges.length + 1,
        admissionId,
        patientId,
        patientName,
        admissionDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0],
        dischargeDate: null,
        status: 'pending',
        reason: null,
        principalDiagnosis,
        procedures: procedures || [],
        medications: medications || [],
        followUpInstructions: null,
        doctorName,
      };

      mockDischarges.push(newDischarge);
      return NextResponse.json(newDischarge, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error creating discharge:', error);
    return NextResponse.json(
      { error: 'Failed to create discharge' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('userRole')?.value;

    if (userRole !== 'doctor' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      dischargeId,
      status,
      reason,
      procedures,
      medications,
      followUpInstructions,
    } = body;

    const discharge = mockDischarges.find(d => d.id === dischargeId);

    if (!discharge) {
      return NextResponse.json({ error: 'Discharge record not found' }, { status: 404 });
    }

    if (status) {
      discharge.status = status;
    }

    if (reason) {
      discharge.reason = reason;
    }

    if (procedures) {
      discharge.procedures = procedures;
    }

    if (medications) {
      discharge.medications = medications;
    }

    if (followUpInstructions) {
      discharge.followUpInstructions = followUpInstructions;
    }

    if (status === 'completed') {
      discharge.dischargeDate = new Date().toISOString().split('T')[0];
    }

    return NextResponse.json(discharge);
  } catch (error) {
    console.error('Error updating discharge:', error);
    return NextResponse.json(
      { error: 'Failed to update discharge' },
      { status: 500 }
    );
  }
}
