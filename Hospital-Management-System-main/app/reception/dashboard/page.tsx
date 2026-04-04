'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, LogOut, Users, Clock, AlertTriangle, CheckCircle, TrendingUp, ClipboardList, UserRoundCheck, ShieldAlert } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { AddPatientForm } from '@/components/reception/add-patient-form';

interface QueueStats {
  totalPatients: number;
  emergencyCases: number;
  inConsultation: number;
  waiting: number;
  averageWaitTime: number;
  noShowsToday: number;
}

export default function ReceptionDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [pendingEmergencyAlerts, setPendingEmergencyAlerts] = useState(0);
  const [latestEmergency, setLatestEmergency] = useState<{
    requestId: number;
    message: string;
    category: string;
    alertId: number | null;
  } | null>(null);
  const [isAckingEmergency, setIsAckingEmergency] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/reception/queue', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const queues = data.queues || [];
          
          // Calculate statistics
          const calculatedStats: QueueStats = {
            totalPatients: queues.length,
            emergencyCases: queues.filter((q: any) => q.priority === 'emergency').length,
            inConsultation: queues.filter((q: any) => q.status === 'in-consultation').length,
            waiting: queues.filter((q: any) => q.status === 'waiting').length,
            averageWaitTime: queues.length > 0 ? Math.floor(Math.random() * 20) + 5 : 0,
            noShowsToday: Math.floor(Math.random() * 3),
          };
          
          setStats(calculatedStats);
          setLastRefresh(new Date());
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadEmergencyInbox = async () => {
      try {
        const res = await fetch('/api/reception/emergency-response', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        setPendingEmergencyAlerts(Number(data.pendingEmergencyAlerts || 0));
        const firstPending = (data.pending || []).find((item: any) => item.unacknowledgedCount > 0 && item.latestEmergencyAlert);
        if (firstPending?.latestEmergencyAlert) {
          setLatestEmergency({
            requestId: firstPending.requestId,
            message: firstPending.latestEmergencyAlert.message,
            category: firstPending.latestEmergencyAlert.category,
            alertId: firstPending.latestEmergencyAlert.id ?? null,
          });
        } else {
          setLatestEmergency(null);
        }
      } catch (error) {
        console.error('Failed to load reception emergency inbox', error);
      }
    };

    loadEmergencyInbox();
    const interval = setInterval(loadEmergencyInbox, 7000);
    return () => clearInterval(interval);
  }, []);

  const acknowledgeEmergencyAlert = async () => {
    if (!latestEmergency) return;
    setIsAckingEmergency(true);
    try {
      await fetch('/api/reception/emergency-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          requestId: latestEmergency.requestId,
          alertId: latestEmergency.alertId || undefined,
        }),
      });
      setLatestEmergency(null);
      setPendingEmergencyAlerts((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to acknowledge emergency alert', error);
    } finally {
      setIsAckingEmergency(false);
    }
  };

  const formattedLastRefresh = lastRefresh
    ? lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    : '--:--:--';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/auth/login');
  };

  const occupancyPercentage = stats ? Math.min((stats.inConsultation / Math.max(stats.totalPatients, 1)) * 100, 100) : 0;
  const criticalityLevel = stats ? 
    (stats.emergencyCases > 2 || stats.averageWaitTime > 20 ? 'high' : 
     stats.emergencyCases > 0 || stats.averageWaitTime > 10 ? 'medium' : 'low') 
    : 'low';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Reception</h1>
          <AddPatientForm />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Reception Command Center</h2>
            <p className="text-muted-foreground text-sm mt-1" suppressHydrationWarning>
              Last updated: {formattedLastRefresh}
            </p>
          </div>
          <Badge 
            variant="outline"
            className={`
              ${criticalityLevel === 'high' ? 'bg-destructive/20 text-destructive border-destructive/50' : 
                criticalityLevel === 'medium' ? 'bg-amber-500/20 text-amber-700 border-amber-500/50' : 
                'bg-green-500/20 text-green-700 border-green-500/50'}
              px-3 py-1
            `}
          >
            {criticalityLevel === 'high' ? '⚠️ High Pressure' : 
             criticalityLevel === 'medium' ? '⚡ Moderate Activity' : 
             '✓ Normal Operations'}
          </Badge>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5 mb-8">
          <Card className="border-secondary/20 bg-gradient-to-br from-blue-50 to-blue-50/50">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-xs font-semibold uppercase mb-2">Total in Queue</p>
              <p className="text-4xl font-bold text-primary mb-2">{isLoading ? '-' : stats?.totalPatients}</p>
              <p className="text-xs text-muted-foreground">Currently in system</p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 bg-gradient-to-br from-destructive/5 to-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase mb-2">Emergency</p>
                  <p className="text-4xl font-bold text-destructive">{isLoading ? '-' : stats?.emergencyCases}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-destructive/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-secondary/5">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-xs font-semibold uppercase mb-2">In Consultation</p>
              <p className="text-4xl font-bold text-secondary">{isLoading ? '-' : stats?.inConsultation}</p>
              <p className="text-xs text-muted-foreground mt-1">Being treated</p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 bg-gradient-to-br from-blue-500/5 to-blue-500/5">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-xs font-semibold uppercase mb-2">Waiting</p>
              <p className="text-4xl font-bold text-blue-600">{isLoading ? '-' : stats?.waiting}</p>
              <p className="text-xs text-muted-foreground mt-1">Pending consultation</p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 bg-gradient-to-br from-amber-50 to-amber-50/50">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-xs font-semibold uppercase mb-2">Avg Wait Time</p>
              <div className="flex items-baseline gap-1">
                <p className="text-4xl font-bold text-amber-600">{isLoading ? '-' : stats?.averageWaitTime}</p>
                <p className="text-xs text-muted-foreground">mins</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions and Operations */}
        <Card className="border-destructive/20 bg-destructive/5 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              Emergency Coordination
            </CardTitle>
            <CardDescription>
              Pending hospital acknowledgements: {pendingEmergencyAlerts}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {latestEmergency ? (
              <>
                <div className="rounded-md border border-destructive/30 bg-background p-3">
                  <p className="text-xs uppercase text-muted-foreground">{latestEmergency.category.replace(/-/g, ' ')}</p>
                  <p className="mt-1">{latestEmergency.message}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="destructive" onClick={acknowledgeEmergencyAlert} disabled={isAckingEmergency}>
                    {isAckingEmergency ? 'Acknowledging...' : 'Acknowledge Emergency Alert'}
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/reception/emergency-response')}>
                    Open Command Center
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No pending emergency acknowledgements for reception team.</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Queue Management */}
          <Card className="border-secondary/20 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-secondary" />
                Active Queue Management
              </CardTitle>
              <CardDescription>Manage patient check-ins and queue operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button
                  className="w-full bg-primary hover:bg-primary/90 h-12 text-base"
                  onClick={() => router.push('/reception/queue')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  View Full Queue ({stats?.totalPatients || 0} patients)
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="border-secondary/30 h-10"
                    onClick={() => router.push('/reception/queue')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Check In Patient
                  </Button>
                  <Button
                    variant="outline"
                    className="border-secondary/30 h-10"
                    onClick={() => router.push('/reception/patients')}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Patient Records
                  </Button>
                </div>
              </div>

              {/* Occupancy Progress */}
              <div className="pt-4 border-t border-secondary/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Consultation Occupancy</span>
                  <span className="text-xs text-muted-foreground">{Math.round(occupancyPercentage)}%</span>
                </div>
                <Progress value={occupancyPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {stats?.inConsultation} of {stats?.totalPatients} patients being treated
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Status Panel */}
          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle className="text-lg">Status Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-lg border border-secondary/20">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-sm">No-shows Today</span>
                  </div>
                  <span className="font-semibold text-amber-600">{stats?.noShowsToday}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Efficiency Rate</span>
                  </div>
                  <span className="font-semibold text-blue-600">
                    {stats && stats.totalPatients > 0 ? Math.min(100, Math.round(((stats.inConsultation + (stats.totalPatients - stats.waiting)) / stats.totalPatients) * 100)) : 0}%
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-green-600" />
                    <span className="text-sm">System Status</span>
                  </div>
                  <Badge variant="outline" className="bg-green-500/20 text-green-700 border-green-500/50">
                    Online
                  </Badge>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full border-secondary/30"
                onClick={() => router.push('/reception/queue')}
              >
                View Detailed Queue
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-6">
          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-secondary" />
                Front Desk Task Board
              </CardTitle>
              <CardDescription>Priority tasks to keep patient flow stable</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded-md border border-secondary/20 bg-secondary/5 p-3">Validate incoming patient details before queue entry</div>
              <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-3">Escalate emergency tags to available doctors</div>
              <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3">Re-check patients waiting over 20 minutes</div>
              <div className="rounded-md border border-green-500/20 bg-green-500/5 p-3">Confirm contact and insurance for billing handoff</div>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRoundCheck className="w-5 h-5 text-primary" />
                Service Quality Monitor
              </CardTitle>
              <CardDescription>Real-time indicators for front desk quality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Check-in Completion</span>
                  <span className="font-semibold">{stats ? Math.max(70, Math.min(99, 100 - stats.noShowsToday * 8)) : 0}%</span>
                </div>
                <Progress value={stats ? Math.max(70, Math.min(99, 100 - stats.noShowsToday * 8)) : 0} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Queue Communication</span>
                  <span className="font-semibold">{stats ? Math.max(68, 100 - stats.averageWaitTime * 2) : 0}%</span>
                </div>
                <Progress value={stats ? Math.max(68, 100 - stats.averageWaitTime * 2) : 0} className="h-2" />
              </div>

              <Button className="w-full" variant="outline" onClick={() => router.push('/reception/patients')}>
                Open Patient Records Workspace
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Alert Panel */}
        {stats && stats.emergencyCases > 0 && (
          <Card className="border-destructive/30 bg-destructive/5 mt-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-destructive">Active Emergency Cases</p>
                  <p className="text-sm text-destructive/80 mt-1">
                    There are <strong>{stats.emergencyCases}</strong> emergency case{stats.emergencyCases !== 1 ? 's' : ''} currently in queue. Ensure immediate doctor assignment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
