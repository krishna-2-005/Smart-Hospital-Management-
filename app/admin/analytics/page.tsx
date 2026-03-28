'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, BarChart3, TrendingUp, Users, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
  visitsTodayCount: number;
  appointmentsTodayCount: number;
  emergencyCasesToday: number;
  totalBeds: number;
  availableBeds: number;
  patientsInQueue: number;
  doctorsOnDuty: number;
  totalPatients: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeRange, setTimeRange] = useState('today');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Generate mock trend data for charts
  const hourlyVisits = [3, 5, 8, 12, 10, 7, 9, 11, 15, 8, 6, 4];
  const appointmentsByHour = [2, 4, 7, 9, 8, 5, 6, 8, 10, 7, 5, 3];
  const queueTrend = [5, 8, 12, 15, 18, 14, 12, 10, 8, 6, 4, 2];

  // Department stats
  const departmentStats = [
    { name: 'Emergency', patients: stats?.emergencyCasesToday || 0, color: 'destructive' },
    { name: 'ICU', patients: Math.floor((stats?.visitsTodayCount || 0) * 0.15), color: 'amber' },
    { name: 'General Ward', patients: Math.floor((stats?.visitsTodayCount || 0) * 0.35), color: 'blue' },
    { name: 'Pediatrics', patients: Math.floor((stats?.visitsTodayCount || 0) * 0.25), color: 'secondary' },
    { name: 'Maternity', patients: Math.floor((stats?.visitsTodayCount || 0) * 0.25), color: 'pink' },
  ];

  // Bed utilization
  const bedOccupancy = stats ? Math.round(((stats.totalBeds - stats.availableBeds) / stats.totalBeds) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-primary">Hospital Analytics</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading analytics...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary">Hospital Analytics</h1>
              <p className="text-sm text-muted-foreground">Real-time operational insights</p>
            </div>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Visits Today</p>
                  <p className="text-3xl font-bold text-primary mt-1">{stats?.visitsTodayCount || 0}</p>
                </div>
                <Calendar className="w-8 h-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Appointments</p>
                  <p className="text-3xl font-bold text-secondary mt-1">{stats?.appointmentsTodayCount || 0}</p>
                </div>
                <Users className="w-8 h-8 text-secondary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Emergency Cases</p>
                  <p className="text-3xl font-bold text-destructive mt-1">{stats?.emergencyCasesToday || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-destructive/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">In Queue</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{stats?.patientsInQueue || 0}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Hourly Visits Chart */}
          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-secondary" />
                Hourly Visits
              </CardTitle>
              <CardDescription>Patient visits by hour today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {hourlyVisits.map((visits, idx) => {
                  const maxVisits = Math.max(...hourlyVisits);
                  const percentage = (visits / maxVisits) * 100;
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{idx.toString().padStart(2, '0')}:00</span>
                        <span className="font-medium">{visits} visits</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Appointments by Hour */}
          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-secondary" />
                Appointments Scheduled
              </CardTitle>
              <CardDescription>Appointments by hour today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {appointmentsByHour.map((appointments, idx) => {
                  const maxAppts = Math.max(...appointmentsByHour);
                  const percentage = (appointments / maxAppts) * 100;
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{idx.toString().padStart(2, '0')}:00</span>
                        <span className="font-medium">{appointments} slots</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Department Breakdown & Bed Utilization */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Department Stats */}
          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle>Patient Distribution by Department</CardTitle>
              <CardDescription>Current patient load across departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentStats.map((dept, idx) => {
                  const totalVisits = stats?.visitsTodayCount || 1;
                  const percentage = (dept.patients / totalVisits) * 100;
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium">{dept.name}</span>
                        <Badge variant="outline">{dept.patients} patients</Badge>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Bed Utilization */}
          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle>Bed Utilization Status</CardTitle>
              <CardDescription>Current occupancy and availability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">Overall Occupancy</span>
                  <span className={`text-lg font-bold ${bedOccupancy > 80 ? 'text-destructive' : bedOccupancy > 60 ? 'text-amber-600' : 'text-secondary'}`}>
                    {bedOccupancy}%
                  </span>
                </div>
                <Progress value={bedOccupancy} className="h-3" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-secondary/10">
                <div>
                  <p className="text-muted-foreground text-sm">Total Beds</p>
                  <p className="text-2xl font-bold text-primary mt-1">{stats?.totalBeds || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Available</p>
                  <p className="text-2xl font-bold text-secondary mt-1">{stats?.availableBeds || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-secondary/10">
                <div>
                  <p className="text-muted-foreground text-sm">Occupied</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{(stats?.totalBeds || 0) - (stats?.availableBeds || 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Doctors On Duty</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{stats?.doctorsOnDuty || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue Trend */}
        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle>Queue Pressure Trend</CardTitle>
            <CardDescription>Patient queue size throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {queueTrend.map((queue, idx) => {
                const maxQueue = Math.max(...queueTrend);
                const percentage = (queue / maxQueue) * 100;
                const timeLabel = `${(idx * 2).toString().padStart(2, '0')}:00`;
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground w-12">{timeLabel}</span>
                      <div className="flex-1 mx-4">
                        <div className="bg-secondary/10 rounded-full h-8 flex items-center justify-center" style={{width: `${Math.max(10, percentage)}%`}}>
                          <span className="text-xs font-semibold text-secondary">{queue}</span>
                        </div>
                      </div>
                      <span className="text-sm font-medium w-16 text-right">{queue} patients</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-lg border border-secondary/20 p-6">
          <h3 className="font-semibold text-foreground mb-4">Today's Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-muted-foreground text-sm">Total Patients Registered</p>
              <p className="text-2xl font-bold text-primary mt-1">{stats?.totalPatients || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Active Consultations</p>
              <p className="text-2xl font-bold text-secondary mt-1">{Math.floor((stats?.visitsTodayCount || 0) * 0.4)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Average Wait Time</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">~12 min</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">System Load</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">Moderate</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
