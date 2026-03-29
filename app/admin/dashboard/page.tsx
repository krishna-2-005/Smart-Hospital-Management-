'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bed,
  Calendar,
  Heart,
  Stethoscope,
  Users,
  UserCog,
} from 'lucide-react';
import { MetricCard } from '@/components/admin/metric-card';
import { ActionTile } from '@/components/admin/action-tile';

interface Stats {
  visitsTodayCount: number;
  appointmentsTodayCount: number;
  emergencyCasesToday: number;
  totalBeds: number;
  availableBeds: number;
  patientsInQueue: number;
  doctorsOnDuty: number;
  totalPatients: number;
}

const DEMO_STATS: Stats = {
  visitsTodayCount: 148,
  appointmentsTodayCount: 73,
  emergencyCasesToday: 6,
  totalBeds: 240,
  availableBeds: 62,
  patientsInQueue: 19,
  doctorsOnDuty: 34,
  totalPatients: 2875,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setStats({
            visitsTodayCount: Number(data.stats?.visitsTodayCount || 0),
            appointmentsTodayCount: Number(data.stats?.appointmentsTodayCount || 0),
            emergencyCasesToday: Number(data.stats?.emergencyCasesToday || 0),
            totalBeds: Number(data.stats?.totalBeds || 0),
            availableBeds: Number(data.stats?.availableBeds || 0),
            patientsInQueue: Number(data.stats?.patientsInQueue || 0),
            doctorsOnDuty: Number(data.stats?.doctorsOnDuty || 0),
            totalPatients: Number(data.stats?.totalPatients || 0),
          });
          setUsingDemoData(false);
        } else {
          setStats(DEMO_STATS);
          setUsingDemoData(true);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(DEMO_STATS);
        setUsingDemoData(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const bedOccupancy =
    stats && stats.totalBeds > 0
      ? Math.round(((stats.totalBeds - stats.availableBeds) / stats.totalBeds) * 100)
      : 0;

  const queuePressure = stats ? Math.min(100, stats.patientsInQueue * 5) : 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(38,87,176,0.14),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(28,148,106,0.14),transparent_35%),linear-gradient(180deg,#f7f9ff_0%,#eef2f9_100%)]">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8 rounded-2xl border border-border/70 bg-background/70 p-6 shadow-lg shadow-primary/5 backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
              <p className="mt-1 text-muted-foreground">
                Real-time command surface for patient flow, beds, staffing, and emergency response.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => router.push('/admin/analytics')}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
              <Button variant="outline" onClick={() => router.push('/admin/patient-data')}>
                <Users className="mr-2 h-4 w-4" />
                Patient Data
              </Button>
              <Button variant="outline" onClick={() => router.push('/admin/emergency')}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Emergency Desk
              </Button>
              <Button variant="outline" onClick={() => router.push('/admin/emergency-response')}>
                <Activity className="mr-2 h-4 w-4" />
                Smart ER Engine
              </Button>
              <Button variant="secondary" onClick={() => router.push('/reception/queue')}>
                <Users className="mr-2 h-4 w-4" />
                Live Queue
              </Button>
            </div>
          </div>

          {usingDemoData && (
            <div className="mt-4 rounded-lg border border-amber-300/60 bg-amber-100/70 px-3 py-2 text-sm text-amber-900">
              Live stats are unavailable right now, so you are viewing preview metrics.
            </div>
          )}
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="border-border/70 bg-background/70">
                <CardContent className="pt-6">
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="mt-4 h-10 w-20 animate-pulse rounded bg-muted" />
                  <div className="mt-4 h-3 w-2/3 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <MetricCard
                label="Visits Today"
                value={stats.visitsTodayCount}
                helper="Outpatient and inpatient interactions"
                tone="primary"
                icon={Activity}
                onClick={() => router.push('/admin/analytics?focus=throughput')}
              />
              <MetricCard
                label="Appointments"
                value={stats.appointmentsTodayCount}
                helper="Scheduled for the current day"
                tone="secondary"
                icon={Calendar}
                onClick={() => router.push('/admin/analytics?focus=intake')}
              />
              <MetricCard
                label="Emergency Cases"
                value={stats.emergencyCasesToday}
                helper="Requires active triage handling"
                tone="critical"
                icon={AlertTriangle}
                onClick={() => router.push('/admin/emergency')}
              />
              <MetricCard
                label="Beds Available"
                value={`${stats.availableBeds}/${stats.totalBeds}`}
                helper="Capacity snapshot across all wards"
                tone="info"
                icon={Bed}
                onClick={() => router.push('/admin/beds')}
              />
            </div>

            <div className="mb-8 grid gap-4 lg:grid-cols-3">
              <Card className="border-border/70 bg-card/80 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Operational Pressure</CardTitle>
                  <CardDescription>Live indicators for flow and capacity planning</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Bed occupancy</span>
                      <span className="font-semibold text-foreground">{bedOccupancy}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${bedOccupancy}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Queue pressure</span>
                      <span className="font-semibold text-foreground">{queuePressure}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-secondary transition-all duration-700"
                        style={{ width: `${queuePressure}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <Card className="border-border/70 bg-background/90 py-0 shadow-none">
                      <CardContent className="pt-5">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">In Queue</p>
                        <p className="mt-1 text-3xl font-bold text-primary">{stats.patientsInQueue}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/70 bg-background/90 py-0 shadow-none">
                      <CardContent className="pt-5">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Doctors On Duty</p>
                        <p className="mt-1 text-3xl font-bold text-secondary">{stats.doctorsOnDuty}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/70 bg-background/90 py-0 shadow-none">
                      <CardContent className="pt-5">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Patients</p>
                        <p className="mt-1 text-3xl font-bold text-sky-600">{stats.totalPatients}</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle>Shift Focus</CardTitle>
                  <CardDescription>Where operations should focus next</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                    <p className="text-sm text-muted-foreground">Triage Load</p>
                    <p className="text-xl font-bold text-destructive">{stats.emergencyCasesToday} active</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                    <p className="text-sm text-muted-foreground">Doctor Coverage</p>
                    <p className="text-xl font-bold text-secondary">{stats.doctorsOnDuty} available</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                    <p className="text-sm text-muted-foreground">Patient Movement</p>
                    <p className="text-xl font-bold text-primary">{stats.visitsTodayCount} today</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mb-8 grid gap-4 lg:grid-cols-2">
              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle>Executive Action Center</CardTitle>
                  <CardDescription>Role-specific actions for administrators and operations leads</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <Button variant="outline" className="justify-start" onClick={() => router.push('/admin/doctors')}>
                    <Stethoscope className="mr-2 h-4 w-4" />
                    Rebalance Doctor Allocation
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => router.push('/admin/beds')}>
                    <Bed className="mr-2 h-4 w-4" />
                    Reserve Surge Beds
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => router.push('/admin/emergency')}>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Escalate Emergency Protocol
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => router.push('/admin/analytics')}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Review Throughput Trends
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle>Service-Level Monitor</CardTitle>
                  <CardDescription>At-a-glance service quality and operational target health</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Emergency response target</span>
                      <span className="font-semibold text-foreground">{Math.max(70, 98 - stats.emergencyCasesToday * 3)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-destructive" style={{ width: `${Math.max(70, 98 - stats.emergencyCasesToday * 3)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Patient wait-time target</span>
                      <span className="font-semibold text-foreground">{Math.max(68, 100 - stats.patientsInQueue * 2)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-secondary" style={{ width: `${Math.max(68, 100 - stats.patientsInQueue * 2)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Clinical capacity utilization</span>
                      <span className="font-semibold text-foreground">{bedOccupancy}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${bedOccupancy}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          </>
        ) : (
          <Card className="border-border/70 bg-background/70">
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Statistics are currently unavailable. Check your API and database connection.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
