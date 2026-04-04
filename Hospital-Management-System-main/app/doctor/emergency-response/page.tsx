'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Clock, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

type EmergencyInbox = {
  pendingEmergencyAlerts: number;
  overview: {
    stats: {
      activeRequests: number;
      averageEtaMinutes: number;
    };
    requests: Array<{
      id: number;
      patientName: string;
      patientId: string;
      status: string;
      etaMinutes: number;
      latestEmergencyAlert: {
        id: number | null;
        message: string;
        time: string;
        acknowledgedAt: string | null;
        category: string;
      } | null;
    }>;
  };
};

export default function DoctorEmergencyResponsePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<EmergencyInbox | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ackRequestId, setAckRequestId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch('/api/doctor/emergency-response', { credentials: 'include' });
      if (!res.ok) return;
      const payload = await res.json();
      setData(payload);
    } catch (error) {
      console.error('Failed to load doctor emergency response', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, []);

  const acknowledgeAlert = async (requestId: number, alertId?: number | null) => {
    setAckRequestId(requestId);
    try {
      const res = await fetch('/api/doctor/emergency-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ requestId, alertId: alertId || undefined }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to acknowledge');

      toast({
        title: 'Alert Acknowledged',
        description: 'Driver and patient channels were updated.',
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Acknowledgement Failed',
        description: error.message || 'Unable to acknowledge alert',
        variant: 'destructive',
      });
    } finally {
      setAckRequestId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/doctor/queue')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-primary">Doctor Emergency Command</h1>
              <p className="text-sm text-muted-foreground">Acknowledge high-priority ambulance alerts.</p>
            </div>
          </div>
          <Button variant="outline" onClick={loadData}>Refresh</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending Acks</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold text-destructive">{data?.pendingEmergencyAlerts ?? 0}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Requests</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{data?.overview.stats.activeRequests ?? 0}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Average ETA</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{data?.overview.stats.averageEtaMinutes ?? 0}m</CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Emergency Alerts</CardTitle>
            <CardDescription>Latest hospital-target alerts from ambulance drivers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading emergency queue...</p>
            ) : !data?.overview.requests?.length ? (
              <p className="text-sm text-muted-foreground">No active emergency requests.</p>
            ) : (
              data.overview.requests.map((request) => (
                <div key={request.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{request.patientName} ({request.patientId})</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> ETA {request.etaMinutes} min</p>
                    </div>
                    <Badge className="capitalize">{request.status.replace('-', ' ')}</Badge>
                  </div>

                  {request.latestEmergencyAlert ? (
                    <div className="mt-3 rounded-md border border-destructive/20 bg-destructive/5 p-3">
                      <p className="text-xs uppercase text-destructive">{request.latestEmergencyAlert.category.replace(/-/g, ' ')}</p>
                      <p className="mt-1 text-sm">{request.latestEmergencyAlert.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(request.latestEmergencyAlert.time).toLocaleString()}</p>
                      {!request.latestEmergencyAlert.acknowledgedAt ? (
                        <Button
                          className="mt-3"
                          variant="destructive"
                          size="sm"
                          disabled={ackRequestId === request.id}
                          onClick={() => acknowledgeAlert(request.id, request.latestEmergencyAlert?.id || null)}
                        >
                          {ackRequestId === request.id ? 'Acknowledging...' : 'Acknowledge Alert'}
                        </Button>
                      ) : (
                        <p className="mt-2 text-xs text-secondary">Acknowledged at {new Date(request.latestEmergencyAlert.acknowledgedAt).toLocaleString()}</p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> No emergency alert on this request.</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
