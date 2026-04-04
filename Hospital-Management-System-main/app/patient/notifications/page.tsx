'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bell, Trash2, Settings, CheckCircle, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  prescriptionAlerts: boolean;
  billingAlerts: boolean;
  queueUpdates: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    smsNotifications: true,
    appointmentReminders: true,
    prescriptionAlerts: true,
    billingAlerts: true,
    queueUpdates: true,
  });
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPreferences = async () => {
      try {
        const res = await fetch('/api/notifications?action=preferences', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setPreferences(data.preferences || preferences);
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      }
    };

    fetchNotifications();
    fetchPreferences();
  }, [preferences]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          notificationId,
          read: !notification.read,
          action: 'markRead',
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setNotifications(notifications.map(n => (n.id === notificationId ? updated : n)));
        setUnreadCount(prev => (updated.read ? prev - 1 : prev + 1));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'markAllRead',
        }),
      });

      if (res.ok) {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleSavePreferences = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'updatePreferences',
          preferences,
        }),
      });

      if (res.ok) {
        setSuccessMessage('Notification preferences updated!');
        setIsPreferencesOpen(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_reminder':
        return '📅';
      case 'prescription_ready':
        return '💊';
      case 'billing_alert':
        return '💳';
      case 'queue_update':
        return '⏳';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment_reminder':
        return 'bg-blue-50 border-blue-200';
      case 'prescription_ready':
        return 'bg-green-50 border-green-200';
      case 'billing_alert':
        return 'bg-amber-50 border-amber-200';
      case 'queue_update':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-secondary/5 border-secondary/20';
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary">Notifications</h1>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
                Mark All as Read
              </Button>
            )}
            <Button
              onClick={() => setIsPreferencesOpen(true)}
              variant="outline"
              size="sm"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Stats */}
        <Card className="border-secondary/20">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-primary">{notifications.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Total</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">{unreadCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Unread</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{readNotifications.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Read</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              All Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <Tabs defaultValue="unread" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="unread">
                    Unread ({unreadNotifications.length})
                  </TabsTrigger>
                  <TabsTrigger value="read">
                    Read ({readNotifications.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="unread" className="space-y-3">
                  {unreadNotifications.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">All caught up!</p>
                  ) : (
                    unreadNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`rounded-lg border p-4 ${getNotificationColor(
                          notification.type
                        )} hover:shadow-md transition-all cursor-pointer`}
                        onClick={() => setSelectedNotification(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl mt-1">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-foreground">{notification.title}</p>
                              {!notification.read && (
                                <Badge className="bg-blue-600">New</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 text-muted-foreground hover:text-primary" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="read" className="space-y-3">
                  {readNotifications.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No read notifications</p>
                  ) : (
                    readNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`rounded-lg border p-4 ${getNotificationColor(
                          notification.type
                        )} opacity-75 hover:shadow-md transition-all cursor-pointer`}
                        onClick={() => setSelectedNotification(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl mt-1">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground mb-1">{notification.title}</p>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Preferences Dialog */}
      {isPreferencesOpen && (
        <Dialog open={isPreferencesOpen} onOpenChange={setIsPreferencesOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Notification Preferences
              </DialogTitle>
              <DialogDescription>Customize how you receive notifications</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Communication Channels</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email"
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        emailNotifications: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="email" className="cursor-pointer">
                    Email Notifications
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sms"
                    checked={preferences.smsNotifications}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        smsNotifications: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="sms" className="cursor-pointer">
                    SMS Notifications
                  </Label>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h3 className="font-semibold text-sm">Alert Types</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="appointments"
                    checked={preferences.appointmentReminders}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        appointmentReminders: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="appointments" className="cursor-pointer">
                    Appointment Reminders
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="prescriptions"
                    checked={preferences.prescriptionAlerts}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        prescriptionAlerts: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="prescriptions" className="cursor-pointer">
                    Prescription Alerts
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="billing"
                    checked={preferences.billingAlerts}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        billingAlerts: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="billing" className="cursor-pointer">
                    Billing Alerts
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="queue"
                    checked={preferences.queueUpdates}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        queueUpdates: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="queue" className="cursor-pointer">
                    Queue Updates
                  </Label>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsPreferencesOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={handleSavePreferences}
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        )}
    </div>
  );
}

function getTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
