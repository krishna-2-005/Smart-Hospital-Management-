'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Clock, Navigation, ShieldAlert, Siren, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface AdminOverview {
  uspLine: string;
  stats: {
    activeRequests: number;
    availableAmbulances: number;
    hospitalsOnNetwork: number;
    averageEtaMinutes: number;
  };
  requests: Array<{
    id: number;
    patientName: string;
    patientId: string;
    emergencyType: string;
    conditionSummary: string;
    status: string;
    etaMinutes: number;
    requestedAt: string;
    ambulance: {
      vehicleCode: string;
      driverName: string;
    } | null;
    hospital: {
      name: string;
      score: number;
      distanceKm: number;
      requiredBedType: string;
    } | null;
    latestAlert: {
      target: string;
      message: string;
      time: string;
      priority?: 'normal' | 'emergency';
      acknowledgedAt?: string | null;
      category?: string;
    } | null;
    latestEmergencyAlert: {
      id: number | null;
      message: string;
      time: string;
      acknowledgedAt: string | null;
      category: string;
    } | null;
  }>;
  ambulances: Array<{
    id: number;
    vehicleCode: string;
    driverName: string;
    status: 'available' | 'dispatched';
    lat: number;
    lng: number;
    currentRequestId: number | null;
  }>;
}

interface HospitalInboxResponse {
  role: 'admin' | 'doctor' | 'reception';
  overview: AdminOverview;
  pending: Array<{
    requestId: number;
    patientName: string;
    status: string;
    etaMinutes: number;
    unacknowledgedCount: number;
    latestEmergencyAlert: {
      id: number | null;
      message: string;
      time: string;
      category: string;
      acknowledgedAt: string | null;
    } | null;
  }>;
  pendingEmergencyAlerts: number;
}

export default function EmergencyResponsePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<HospitalInboxResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ackRequestId, setAckRequestId] = useState<number | null>(null);

  const loadOverview = async () => {
    try {
      const res = await fetch('/api/admin/emergency-response', { credentials: 'include' });
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      }
    } catch (error) {
      console.error('Failed to load emergency overview', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pendingByRequest = useMemo(() => {
    const map = new Map<number, HospitalInboxResponse['pending'][number]>();
    (data?.pending || []).forEach((item) => {
      map.set(item.requestId, item);
    });
    return map;
  }, [data?.pending]);

  const acknowledgeAlert = async (requestId: number, alertId?: number | null) => {
    setAckRequestId(requestId);
    try {
      const res = await fetch('/api/admin/emergency-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ requestId, alertId: alertId || undefined }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to acknowledge emergency alert');
      }

      toast({
        title: 'Alert Acknowledged',
        description: 'Driver and patient channels were notified with hospital confirmation.',
      });
      await loadOverview();
    } catch (error: any) {
      toast({
        title: 'Acknowledgement Failed',
        description: error.message || 'Unable to acknowledge emergency alert',
        variant: 'destructive',
      });
    } finally {
      setAckRequestId(null);
    }
  };

  useEffect(() => {
    loadOverview();
    const interval = setInterval(loadOverview, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">Smart Emergency Response Engine</h1>
            <p className="text-xs text-muted-foreground">Emergency command center for pre-arrival coordination</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">USP Positioning</CardTitle>
            <CardDescription>
              {data?.overview.uspLine || 'We do not just send ambulances - we prepare the hospital before the patient arrives.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="inline-flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              Pending emergency acknowledgements: <span className="font-semibold">{data?.pendingEmergencyAlerts || 0}</span>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">Loading command data...</CardContent>
          </Card>
        ) : !data ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">No emergency overview available.</CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Active Requests</CardTitle>
                </CardHeader>
                <CardContent className="text-3xl font-bold text-destructive flex items-center gap-2">
                  <ShieldAlert className="w-6 h-6" />
                  {data.overview.stats.activeRequests}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Available Ambulances</CardTitle>
                </CardHeader>
                <CardContent className="text-3xl font-bold text-secondary flex items-center gap-2">
                  <Siren className="w-6 h-6" />
                  {data.overview.stats.availableAmbulances}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Hospitals in Network</CardTitle>
                </CardHeader>
                <CardContent className="text-3xl font-bold text-primary flex items-center gap-2">
                  <Building2 className="w-6 h-6" />
                  {data.overview.stats.hospitalsOnNetwork}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Average ETA</CardTitle>
                </CardHeader>
                <CardContent className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  {data.overview.stats.averageEtaMinutes}m
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Live Emergency Requests</CardTitle>
                <CardDescription>Patient to ambulance to hospital pipeline with real-time status.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.overview.requests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active emergency requests right now.</p>
                ) : (
                  data.overview.requests.map((request) => (
                    <div key={request.id} className="rounded-lg border border-secondary/15 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">
                            {request.patientName} ({request.patientId})
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {request.emergencyType} • ETA {request.etaMinutes} min
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {pendingByRequest.get(request.id)?.unacknowledgedCount ? (
                            <Badge variant="destructive">
                              {pendingByRequest.get(request.id)?.unacknowledgedCount} pending ack
                            </Badge>
                          ) : null}
                          <Badge className="capitalize">{request.status.replace('-', ' ')}</Badge>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">{request.conditionSummary}</p>

                      <div className="grid gap-3 md:grid-cols-3 text-sm">
                        <div className="rounded-md border border-secondary/10 p-3">
                          <p className="font-semibold flex items-center gap-2"><Siren className="w-4 h-4" /> Ambulance</p>
                          <p>{request.ambulance?.vehicleCode || 'Unassigned'}</p>
                          <p className="text-muted-foreground">{request.ambulance?.driverName || 'Awaiting driver'}</p>
                        </div>

                        <div className="rounded-md border border-secondary/10 p-3">
                          <p className="font-semibold flex items-center gap-2"><Building2 className="w-4 h-4" /> Hospital</p>
                          <p>{request.hospital?.name || 'Selecting...'}</p>
                          <p className="text-muted-foreground">
                            Score {request.hospital?.score ?? 'NA'} • {request.hospital?.distanceKm ?? 'NA'} km
                          </p>
                        </div>

                        <div className="rounded-md border border-secondary/10 p-3">
                          <p className="font-semibold flex items-center gap-2"><Navigation className="w-4 h-4" /> Latest Alert</p>
                          <p>{request.latestAlert?.message || 'No alerts yet'}</p>
                          <p className="text-muted-foreground">
                            {request.latestAlert ? new Date(request.latestAlert.time).toLocaleTimeString() : ''}
                          </p>
                        </div>
                      </div>

                      {request.latestEmergencyAlert && !request.latestEmergencyAlert.acknowledgedAt ? (
                        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
                          <p className="text-xs font-semibold uppercase text-destructive">
                            Emergency Alert: {request.latestEmergencyAlert.category.replace(/-/g, ' ')}
                          </p>
                          <p className="text-sm mt-1">{request.latestEmergencyAlert.message}</p>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <p className="text-xs text-muted-foreground">
                              {new Date(request.latestEmergencyAlert.time).toLocaleString()}
                            </p>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={ackRequestId === request.id}
                              onClick={() => acknowledgeAlert(request.id, request.latestEmergencyAlert?.id || null)}
                            >
                              {ackRequestId === request.id ? 'Acknowledging...' : 'Acknowledge Alert'}
                            </Button>
                          </div>
                        </div>
                      ) : request.latestEmergencyAlert?.acknowledgedAt ? (
                        <div className="rounded-md border border-secondary/20 bg-secondary/5 p-3 text-sm">
                          Alert acknowledged at {new Date(request.latestEmergencyAlert.acknowledgedAt).toLocaleString()}.
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ambulance Fleet</CardTitle>
                <CardDescription>Driver availability and live assignment state.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {data.overview.ambulances.map((ambulance) => (
                  <div key={ambulance.id} className="rounded-lg border border-secondary/15 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{ambulance.vehicleCode}</p>
                      <Badge variant={ambulance.status === 'available' ? 'secondary' : 'destructive'}>
                        {ambulance.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Driver: {ambulance.driverName}</p>
                    <p className="text-xs text-muted-foreground">GPS: {ambulance.lat}, {ambulance.lng}</p>
                    <p className="text-xs text-muted-foreground">
                      {ambulance.currentRequestId ? `Assigned to request #${ambulance.currentRequestId}` : 'Ready for dispatch'}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-secondary/15 bg-secondary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="w-4 h-4" />
                  Coordination Flow
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                User Emergency {'->'} Smart Ambulance Assignment {'->'} Route Optimization {'->'} Hospital Scoring {'->'} Advance Data Sharing {'->'} Prepared Arrival
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
