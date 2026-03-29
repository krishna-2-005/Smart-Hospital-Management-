'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, Calendar, Clock, AlertCircle, LogOut, AlertTriangle, Pill, BellRing, ShieldCheck } from 'lucide-react';

interface QueueStatus {
  queuePosition: number | null;
  status: string;
  doctorName: string;
  specialization: string;
  estimatedWaitTime: number;
  priority: string;
}

interface PatientProfile {
  firstName: string;
  lastName: string;
  patientId: string;
  email: string;
  bloodType: string;
  allergies: string;
}

export default function PatientDashboard() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile
        const profileRes = await fetch('/api/patient/profile', { credentials: 'include' });
        if (profileRes.ok) {
          setProfile(await profileRes.json());
        }

        // Fetch queue status
        const queueRes = await fetch('/api/patient/queue-status', { credentials: 'include' });
        if (queueRes.ok) {
          const data = await queueRes.json();
          setQueueStatus(data);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/auth/login');
  };

  const careReadinessScore = queueStatus?.queuePosition
    ? Math.max(52, 100 - queueStatus.queuePosition * 4)
    : 86;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-primary">Dashboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Welcome Section */}
        {profile && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome, {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-muted-foreground">Patient ID: {profile.patientId}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Queue Status Card */}
          {queueStatus && queueStatus.queuePosition !== null && (
            <Card className="border-secondary/20 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-secondary" />
                  Current Queue Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-secondary/5 rounded-lg p-6 text-center">
                  <p className="text-muted-foreground mb-2">Your Position in Queue</p>
                  <p className="text-5xl font-bold text-primary mb-2">
                    {queueStatus.queuePosition}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    Estimated wait: {queueStatus.estimatedWaitTime} minutes
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Doctor</p>
                    <p className="font-semibold text-foreground">{queueStatus.doctorName}</p>
                    <p className="text-xs text-muted-foreground">{queueStatus.specialization}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Priority Level</p>
                    <div className="flex gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded capitalize ${
                          queueStatus.priority === 'emergency'
                            ? 'bg-destructive/20 text-destructive'
                            : 'bg-secondary/20 text-secondary'
                        }`}
                      >
                        {queueStatus.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => router.push('/patient/queue')}>
                  View Full Queue Details
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-secondary/30"
                onClick={() => router.push('/patient/appointments')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-secondary/30"
                onClick={() => router.push('/patient/profile')}
              >
                <Heart className="w-4 h-4 mr-2" />
                My Health Profile
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-secondary/30"
                onClick={() => router.push('/patient/history')}
              >
                <Clock className="w-4 h-4 mr-2" />
                Visit History
              </Button>
              <Button
                className="w-full justify-start bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={() => router.push('/patient/emergency')}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Smart Emergency
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="border-secondary/20 lg:col-span-2 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-secondary" />
                Personal Care Readiness
              </CardTitle>
              <CardDescription>How prepared your current treatment journey is</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-secondary/20 bg-background/70 p-4">
                <p className="text-sm text-muted-foreground">Current readiness score</p>
                <p className="text-4xl font-bold text-primary mt-1">{careReadinessScore}%</p>
                <div className="mt-3 h-2 rounded-full bg-secondary/15">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${careReadinessScore}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                  <p className="text-xs text-muted-foreground uppercase">Next Care Step</p>
                  <p className="font-semibold mt-1">Review doctor advice after consultation</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                  <p className="text-xs text-muted-foreground uppercase">Estimated Slot Window</p>
                  <p className="font-semibold mt-1">
                    {queueStatus?.estimatedWaitTime ? `Within ${queueStatus.estimatedWaitTime + 5} mins` : 'No active wait'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-600" />
                Health Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-2">Keep emergency contact updated</div>
              <div className="rounded-md border border-secondary/20 bg-secondary/5 p-2">Carry allergy and blood group details</div>
              <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-2">Check notifications for prescription updates</div>
              <Button variant="outline" className="w-full" onClick={() => router.push('/patient/notifications')}>
                Open Notifications
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Health Info Card */}
        {profile && (
          <Card className="mt-6 border-secondary/20">
            <CardHeader>
              <CardTitle className="text-lg">Health Information</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Blood Type</p>
                <p className="font-semibold text-foreground">{profile.bloodType || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Allergies</p>
                <p className="font-semibold text-foreground">{profile.allergies || 'None recorded'}</p>
              </div>
              <div className="md:col-span-2">
                <Button
                  variant="outline"
                  className="w-full border-secondary/30"
                  onClick={() => router.push('/patient/profile')}
                >
                  Update Health Information
                </Button>
              </div>
              <div className="md:col-span-2">
                <Button
                  variant="outline"
                  className="w-full border-secondary/30"
                  onClick={() => router.push('/patient/prescriptions')}
                >
                  <Pill className="w-4 h-4 mr-2" />
                  View Prescription & Medication Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
