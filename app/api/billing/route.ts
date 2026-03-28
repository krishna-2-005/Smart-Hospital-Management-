import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Mock billing data
const mockBillings = [
  {
    id: 1,
    appointmentId: 1,
    patientId: 1,
    patientName: 'John Doe',
    doctorName: 'Dr. Sarah Johnson',
    serviceType: 'General Consultation',
    amount: 150,
    date: '2024-01-15',
    status: 'paid',
    paymentMethod: 'Credit Card',
  },
  {
    id: 2,
    appointmentId: 2,
    patientId: 1,
    patientName: 'John Doe',
    doctorName: 'Dr. Mike Chen',
    serviceType: 'Specialist Consultation',
    amount: 250,
    date: '2024-01-20',
    status: 'pending',
    paymentMethod: null,
  },
  {
    id: 3,
    appointmentId: 3,
    patientId: 2,
    patientName: 'Jane Smith',
    doctorName: 'Dr. Sarah Johnson',
    serviceType: 'Laboratory Tests',
    amount: 200,
    date: '2024-01-22',
    status: 'paid',
    paymentMethod: 'Insurance',
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

    let filteredBillings = mockBillings;

    // Role-based filtering
    if (userRole === 'patient') {
      // Patients see only their bills
      filteredBillings = mockBillings.filter(b => b.patientId === parseInt(userId || '0'));
    } else if (userRole === 'doctor') {
      // Doctors see bills for their appointments
      filteredBillings = mockBillings.filter(b => b.doctorName.includes('Sarah'));
    }
    // Admins see all

    // Query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'date';

    if (status) {
      filteredBillings = filteredBillings.filter(b => b.status === status);
    }

    // Sorting
    if (sortBy === 'amount') {
      filteredBillings.sort((a, b) => b.amount - a.amount);
    } else if (sortBy === 'date') {
      filteredBillings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return NextResponse.json({ billings: filteredBillings });
  } catch (error) {
    console.error('Error fetching billings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('userRole')?.value;

    if (userRole !== 'admin' && userRole !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { appointmentId, serviceType, amount, action } = body;

    if (action === 'create') {
      // Create new billing record
      if (!appointmentId || !serviceType || !amount) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const newBilling = {
        id: mockBillings.length + 1,
        appointmentId,
        patientId: 1,
        patientName: 'Patient Name',
        doctorName: 'Doctor Name',
        serviceType,
        amount,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        paymentMethod: null,
      };

      mockBillings.push(newBilling);
      return NextResponse.json(newBilling, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error creating billing:', error);
    return NextResponse.json(
      { error: 'Failed to create billing' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('userRole')?.value;

    if (!userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { billingId, status, paymentMethod } = body;

    const billing = mockBillings.find(b => b.id === billingId);

    if (!billing) {
      return NextResponse.json({ error: 'Billing not found' }, { status: 404 });
    }

    // Patients can only mark as wanting to pay, admins process payments
    if (userRole === 'patient' && status !== 'payment_requested') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (status) {
      billing.status = status;
    }

    if (paymentMethod) {
      billing.paymentMethod = paymentMethod;
    }

    return NextResponse.json(billing);
  } catch (error) {
    console.error('Error updating billing:', error);
    return NextResponse.json(
      { error: 'Failed to update billing' },
      { status: 500 }
    );
  }
}
