'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ambulance, Bell, Clock3, LogOut, MapPin, Navigation, RefreshCw, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type DriverOverview = {
  driver: {
    id: number;
    name: string;
    phone: string;
  };
  ambulance: {
    id: number;
    vehicleCode: string;
    status: 'available' | 'dispatched';
    lat: number;
    lng: number;
    currentRequestId: number | null;
  } | null;
  activeRequest: {
    id: number;
    patientName: string;
    patientId: string;
    emergencyType: string;
    conditionSummary: string;
    status: string;
    etaMinutes: number;
    pickup: { lat: number; lng: number };
    hospital: { name: string; requiredBedType: string } | null;
    timeline: Array<{ status: string; message: string; time: string }>;
  } | null;
  recentUpdates: Array<{
    requestId: number;
    patientName: string;
    message: string;
    time: string;
  }>;
};

const STATUS_ACTIONS: Array<{ status: 'ambulance-assigned' | 'en-route' | 'hospital-notified' | 'arriving' | 'arrived'; label: string }> = [
  { status: 'ambulance-assigned', label: 'Acknowledge Dispatch' },
  { status: 'en-route', label: 'Patient Onboard / En Route' },
  { status: 'hospital-notified', label: 'Notify Hospital Team' },
  { status: 'arriving', label: 'Arriving at Hospital' },
  { status: 'arrived', label: 'Handover Completed' },
];

export default function DriverDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [overview, setOverview] = useState<DriverOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [note, setNote] = useState('');

  const loadOverview = async (showLoader = false) => {
    if (showLoader) setIsLoading(true);

    try {
      const res = await fetch('/api/driver/emergency', { credentials: 'include' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load driver dashboard');
      }

      setOverview(data.overview || null);
    } catch (error: any) {
      if (String(error.message || '').toLowerCase().includes('unauthorized')) {
        router.push('/auth/login');
        return;
      }

      toast({
        title: 'Error',
        description: error.message || 'Failed to load dashboard',
        variant: 'destructive',
      });
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOverview(true);
    const interval = setInterval(() => loadOverview(false), 8000);
    return () => clearInterval(interval);
  }, []);

  const activeRequest = overview?.activeRequest || null;

  const canSendStatus = useMemo(() => {
    return Boolean(activeRequest?.id) && !isUpdating;
  }, [activeRequest?.id, isUpdating]);

  const handleStatusUpdate = async (status: 'ambulance-assigned' | 'en-route' | 'hospital-notified' | 'arriving' | 'arrived') => {
    if (!activeRequest) return;

    setIsUpdating(true);
    try {
      const res = await fetch('/api/driver/emergency/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          requestId: activeRequest.id,
          status,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send update');
      }

      setNote('');
      toast({
        title: 'Update Sent',
        description: `Emergency status moved to ${status.replace('-', ' ')}.`,
      });

      await loadOverview(false);
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Unable to send update',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/auth/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-6xl">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">Loading driver workspace...</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary md:text-2xl">Driver Emergency Console</h1>
            <p className="text-sm text-muted-foreground">Manage live ambulance dispatch updates in real time.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => loadOverview(false)}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4" /> Driver</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-semibold">{overview?.driver.name || 'NA'}</p>
              <p className="text-muted-foreground">Phone: {overview?.driver.phone || 'NA'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Ambulance className="h-4 w-4" /> Ambulance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {overview?.ambulance ? (
                <>
                  <p className="font-semibold">{overview.ambulance.vehicleCode}</p>
                  <Badge variant={overview.ambulance.status === 'available' ? 'secondary' : 'default'}>
                    {overview.ambulance.status}
                  </Badge>
                  <p className="text-muted-foreground">Lat/Lng: {overview.ambulance.lat}, {overview.ambulance.lng}</p>
                </>
              ) : (
                <p className="text-muted-foreground">No ambulance assigned yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Clock3 className="h-4 w-4" /> Current ETA</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{activeRequest ? `${activeRequest.etaMinutes} min` : 'No active case'}</p>
              {activeRequest && <p className="mt-1 text-xs text-muted-foreground">Status: {activeRequest.status}</p>}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Live Emergency Assignment</CardTitle>
              <CardDescription>Push relevant field updates for hospital and patient teams.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!activeRequest ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  You have no active emergency assignment right now.
                </div>
              ) : (
                <>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Patient</p>
                        <p className="font-semibold">{activeRequest.patientName}</p>
                        <p className="text-xs text-muted-foreground">{activeRequest.patientId}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Emergency Type</p>
                        <p className="font-semibold capitalize">{activeRequest.emergencyType}</p>
                        <p className="text-xs text-muted-foreground">{activeRequest.conditionSummary}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-4 w-4" /> Pickup: {activeRequest.pickup.lat}, {activeRequest.pickup.lng}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1"><Navigation className="h-4 w-4" /> Hospital: {activeRequest.hospital?.name || 'NA'} ({activeRequest.hospital?.requiredBedType || 'NA'} bed)</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Optional Update Note</label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Example: Heavy traffic near junction, reaching in 6 minutes"
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {STATUS_ACTIONS.map((action) => (
                      <Button
                        key={action.status}
                        variant="outline"
                        disabled={!canSendStatus}
                        onClick={() => handleStatusUpdate(action.status)}
                      >
                        {isUpdating ? 'Updating...' : action.label}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Recent Driver Updates</CardTitle>
              <CardDescription>Latest ambulance channel notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview?.recentUpdates.length ? (
                overview.recentUpdates.map((item, idx) => (
                  <div key={`${item.requestId}-${idx}`} className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">#{item.requestId} - {new Date(item.time).toLocaleString()}</p>
                    <p className="text-sm font-semibold">{item.patientName}</p>
                    <p className="text-sm text-muted-foreground">{item.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No updates yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
