import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Mock notifications data
const mockNotifications = [
  {
    id: 1,
    userId: 1,
    type: 'appointment_reminder',
    title: 'Appointment Reminder',
    message: 'Your appointment with Dr. Sarah Johnson is tomorrow at 2:00 PM',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false,
    actionUrl: '/patient/appointments',
  },
  {
    id: 2,
    userId: 1,
    type: 'prescription_ready',
    title: 'Prescription Ready',
    message: 'Your prescription for Amoxicillin is ready for pickup at the pharmacy',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
    actionUrl: '/patient/prescriptions',
  },
  {
    id: 3,
    userId: 1,
    type: 'billing_alert',
    title: 'Invoice Available',
    message: 'New invoice of $150.00 is available for your consultation on Jan 20',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    read: false,
    actionUrl: '/patient/billing',
  },
  {
    id: 4,
    userId: 2,
    type: 'queue_update',
    title: 'Queue Update',
    message: 'You are now 3rd in the queue. Estimated wait time: 15 minutes',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
    actionUrl: '/patient/queue',
  },
];

// Mock notification preferences
const mockPreferences: Record<
  number,
  {
    emailNotifications: boolean;
    smsNotifications: boolean;
    appointmentReminders: boolean;
    prescriptionAlerts: boolean;
    billingAlerts: boolean;
    queueUpdates: boolean;
  }
> = {
  1: {
    emailNotifications: true,
    smsNotifications: true,
    appointmentReminders: true,
    prescriptionAlerts: true,
    billingAlerts: true,
    queueUpdates: true,
  },
  2: {
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    prescriptionAlerts: true,
    billingAlerts: false,
    queueUpdates: true,
  },
};

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userRole = cookieStore.get('userRole')?.value;
    const userId = parseInt(cookieStore.get('userId')?.value || '0');

    if (!userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    // Get preferences
    if (action === 'preferences') {
      const prefs = mockPreferences[userId] || {
        emailNotifications: true,
        smsNotifications: true,
        appointmentReminders: true,
        prescriptionAlerts: true,
        billingAlerts: true,
        queueUpdates: true,
      };
      return NextResponse.json({ preferences: prefs });
    }

    // Get notifications
    let notifications = mockNotifications.filter(n => n.userId === userId);

    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    // Sort by timestamp (newest first)
    notifications.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      notifications,
      unreadCount: notifications.filter(n => !n.read).length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = parseInt(cookieStore.get('userId')?.value || '0');

    const body = await request.json();
    const { notificationId, read, action } = body;

    // Mark as read
    if (action === 'markRead') {
      const notification = mockNotifications.find(n => n.id === notificationId);
      if (notification && notification.userId === userId) {
        notification.read = read;
        return NextResponse.json(notification);
      }
    }

    // Mark all as read
    if (action === 'markAllRead') {
      mockNotifications.forEach(n => {
        if (n.userId === userId) {
          n.read = true;
        }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = parseInt(cookieStore.get('userId')?.value || '0');

    const body = await request.json();
    const { action, preferences } = body;

    // Update preferences
    if (action === 'updatePreferences') {
      mockPreferences[userId] = {
        ...mockPreferences[userId],
        ...preferences,
      };
      return NextResponse.json({ preferences: mockPreferences[userId] });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing notification request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
