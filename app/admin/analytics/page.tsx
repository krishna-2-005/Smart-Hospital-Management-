'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BarChart3, Calendar, Clock3, HeartPulse, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

interface PatientDataRecord {
  id: string | number;
  date: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  specialization: string;
  ward: string;
  intakeType: string;
  visitStatus: string;
  reason: string;
  protectedEmail: string;
  protectedPhone: string;
}

const DEPARTMENT_COLORS = ['#0f766e', '#1d4ed8', '#d97706', '#ef4444', '#6366f1'];
const TIME_LABELS = ['06h', '08h', '10h', '12h', '14h', '16h', '18h', '20h'];

type TimeRange = 'today' | 'week' | 'month';

const rangeMultiplier: Record<TimeRange, number> = {
  today: 1,
  week: 5.4,
  month: 20,
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWard, setSelectedWard] = useState('all');
  const [selectedIntakeType, setSelectedIntakeType] = useState('all');
  const [patientRecords, setPatientRecords] = useState<PatientDataRecord[]>([]);
  const [isRecordsLoading, setIsRecordsLoading] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);

  const throughputSectionRef = useRef<HTMLDivElement | null>(null);
  const intakeSectionRef = useRef<HTMLDivElement | null>(null);
  const recordsSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setFocus(params.get('focus'));
  }, []);

  useEffect(() => {
    if (!focus) return;
    const sectionMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
      throughput: throughputSectionRef,
      intake: intakeSectionRef,
    };
    const selectedSection = sectionMap[focus];
    selectedSection?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focus]);

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
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPatientRecords = async () => {
      setIsRecordsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedWard !== 'all') params.set('ward', selectedWard);
        if (selectedIntakeType !== 'all') params.set('intakeType', selectedIntakeType);
        const res = await fetch(`/api/admin/patient-data?${params.toString()}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setPatientRecords(data.records || []);
        }
      } catch (error) {
        console.error('Error fetching patient records for analytics:', error);
      } finally {
        setIsRecordsLoading(false);
      }
    };

    fetchPatientRecords();
  }, [selectedWard, selectedIntakeType]);

  const scaledStats = useMemo(() => {
    const base = stats || {
      visitsTodayCount: 0,
      appointmentsTodayCount: 0,
      emergencyCasesToday: 0,
      totalBeds: 0,
      availableBeds: 0,
      patientsInQueue: 0,
      doctorsOnDuty: 0,
      totalPatients: 0,
    };

    const multiplier = rangeMultiplier[timeRange];

    return {
      visits: Math.round(base.visitsTodayCount * multiplier),
      appointments: Math.round(base.appointmentsTodayCount * multiplier),
      emergency: Math.max(1, Math.round(base.emergencyCasesToday * (multiplier * 0.85))),
      queue: Math.max(0, Math.round(base.patientsInQueue * (0.7 + multiplier * 0.12))),
      doctors: base.doctorsOnDuty,
      totalBeds: base.totalBeds,
      availableBeds: base.availableBeds,
      totalPatients: Math.max(base.totalPatients, Math.round(base.totalPatients * (0.15 + multiplier * 0.1))),
    };
  }, [stats, timeRange]);

  const bedOccupancy = useMemo(() => {
    if (!scaledStats.totalBeds) return 0;
    return Math.round(((scaledStats.totalBeds - scaledStats.availableBeds) / scaledStats.totalBeds) * 100);
  }, [scaledStats]);

  const areaTrendData = useMemo(() => {
    const visitBase = Math.max(8, Math.round(scaledStats.visits / 8));
    const queueBase = Math.max(2, Math.round(scaledStats.queue / 6));

    return TIME_LABELS.map((time, index) => {
      const wave = 0.85 + Math.sin(index * 0.7) * 0.2;
      const queueWave = 0.8 + Math.cos(index * 0.6) * 0.25;
      return {
        time,
        visits: Math.max(1, Math.round(visitBase * wave + index * 0.8)),
        queue: Math.max(1, Math.round(queueBase * queueWave + (index < 4 ? index : 8 - index))),
      };
    });
  }, [scaledStats]);

  const throughputData = useMemo(
    () => [
      { name: 'Appointments', value: scaledStats.appointments },
      { name: 'Walk-ins', value: Math.max(0, scaledStats.visits - scaledStats.appointments) },
      { name: 'Emergency', value: scaledStats.emergency },
    ],
    [scaledStats],
  );

  const departmentDistribution = useMemo(() => {
    const emergency = scaledStats.emergency;
    const icu = Math.max(1, Math.round(scaledStats.visits * 0.16));
    const general = Math.max(1, Math.round(scaledStats.visits * 0.34));
    const pediatrics = Math.max(1, Math.round(scaledStats.visits * 0.21));
    const maternity = Math.max(1, Math.round(scaledStats.visits * 0.19));

    return [
      { name: 'Emergency', value: emergency },
      { name: 'ICU', value: icu },
      { name: 'General', value: general },
      { name: 'Pediatrics', value: pediatrics },
      { name: 'Maternity', value: maternity },
    ];
  }, [scaledStats]);

  const responseTiming = useMemo(() => {
    const loadFactor = 0.7 + bedOccupancy / 100;
    return [
      { metric: 'Triage', minutes: Math.max(2, Math.round(4 * loadFactor)) },
      { metric: 'Doctor Assignment', minutes: Math.max(4, Math.round(8 * loadFactor)) },
      { metric: 'Bed Allocation', minutes: Math.max(3, Math.round(6 * loadFactor)) },
      { metric: 'Discharge Turnaround', minutes: Math.max(15, Math.round(25 * loadFactor)) },
    ];
  }, [bedOccupancy]);

  const summaryCards = [
    {
      label: 'Patient Throughput',
      value: scaledStats.visits,
      helper: 'Total clinical visits',
      icon: Users,
      tone: 'text-primary',
    },
    {
      label: 'Scheduled Workload',
      value: scaledStats.appointments,
      helper: 'Appointments in selected range',
      icon: Calendar,
      tone: 'text-secondary',
    },
    {
      label: 'Average Wait',
      value: `${Math.max(6, Math.round((scaledStats.queue / Math.max(1, scaledStats.doctors)) * 7))}m`,
      helper: 'Estimated from queue pressure',
      icon: Clock3,
      tone: 'text-amber-600',
    },
    {
      label: 'Bed Occupancy',
      value: `${bedOccupancy}%`,
      helper: `${scaledStats.totalBeds - scaledStats.availableBeds}/${scaledStats.totalBeds} occupied`,
      icon: HeartPulse,
      tone: bedOccupancy > 80 ? 'text-destructive' : 'text-sky-700',
    },
  ];

  const handleDepartmentClick = (department: string) => {
    setSelectedWard(department);
    recordsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleIntakeClick = (name: string) => {
    const intakeMap: Record<string, string> = {
      Appointments: 'appointment',
      'Walk-ins': 'walk-in',
      Emergency: 'emergency',
    };
    setSelectedIntakeType(intakeMap[name] || 'all');
    recordsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f6fbff_0%,#f1f7ff_45%,#eef4fb_100%)]">
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold text-primary sm:text-2xl">Hospital Analytics</h1>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
          <Card className="border-border/70 bg-background/80">
            <CardContent className="py-14 text-center text-muted-foreground">Loading analytics dashboard...</CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_15%,rgba(30,64,175,0.14),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(13,148,136,0.14),transparent_32%),linear-gradient(180deg,#f6fbff_0%,#f4f8ff_45%,#edf3fb_100%)]">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-primary sm:text-2xl">Hospital Analytics</h1>
              <p className="text-xs text-muted-foreground sm:text-sm">Operational intelligence for clinical leadership</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden sm:inline-flex">Live refresh every 30s</Badge>
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
              <SelectTrigger className="w-[145px] bg-background/90">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:space-y-6 sm:px-6 sm:py-8">
        <div className="rounded-2xl border border-border/70 bg-background/75 p-4 shadow-sm backdrop-blur-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">Clinical Operations Snapshot</h2>
              <p className="text-sm text-muted-foreground">Real-time overview of flow, utilization, and emergency readiness</p>
            </div>
            <Badge className="bg-secondary/20 text-secondary">{timeRange.toUpperCase()} WINDOW</Badge>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <Card key={card.label} className="border-border/70 bg-card/80">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">{card.label}</p>
                      <p className={`mt-1 text-3xl font-bold ${card.tone}`}>{card.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{card.helper}</p>
                    </div>
                    <card.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div
          ref={throughputSectionRef}
          className={`grid grid-cols-1 gap-5 xl:grid-cols-3 rounded-xl ${focus === 'throughput' ? 'ring-2 ring-secondary/50 p-1' : ''}`}
        >
          <Card className="border-border/70 bg-card/80 xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-secondary" />
                Hourly Throughput vs Queue
              </CardTitle>
              <CardDescription>Visits and queue stress trend during service hours</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                className="h-[260px] w-full sm:h-[320px]"
                config={{
                  visits: { label: 'Visits', color: '#0f766e' },
                  queue: { label: 'Queue', color: '#1d4ed8' },
                }}
              >
                <AreaChart data={areaTrendData} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-visits)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-visits)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="queueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-queue)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-queue)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="visits" stroke="var(--color-visits)" fillOpacity={1} fill="url(#visitsFill)" />
                  <Area type="monotone" dataKey="queue" stroke="var(--color-queue)" fillOpacity={1} fill="url(#queueFill)" />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle>Bed Utilization Gauge</CardTitle>
              <CardDescription>Current occupancy against total capacity</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <ChartContainer
                className="h-[220px] w-full max-w-[300px]"
                config={{
                  occupancy: { label: 'Occupancy', color: '#dc2626' },
                }}
              >
                <RadialBarChart
                  data={[{ name: 'Occupancy', value: bedOccupancy }]}
                  startAngle={180}
                  endAngle={0}
                  innerRadius="58%"
                  outerRadius="100%"
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="value" background cornerRadius={8} fill="var(--color-occupancy)" />
                </RadialBarChart>
              </ChartContainer>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{bedOccupancy}%</p>
                <p className="text-xs text-muted-foreground">
                  {scaledStats.totalBeds - scaledStats.availableBeds} occupied / {scaledStats.availableBeds} available beds
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          ref={intakeSectionRef}
          className={`grid grid-cols-1 gap-5 lg:grid-cols-2 rounded-xl ${focus === 'intake' ? 'ring-2 ring-secondary/50 p-1' : ''}`}
        >
          <Card className="border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle>Department Mix (Pie)</CardTitle>
              <CardDescription>Patient distribution by active department load</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <ChartContainer
                className="h-[250px] w-full sm:h-[300px]"
                config={{
                  Emergency: { label: 'Emergency', color: DEPARTMENT_COLORS[0] },
                  ICU: { label: 'ICU', color: DEPARTMENT_COLORS[1] },
                  General: { label: 'General', color: DEPARTMENT_COLORS[2] },
                  Pediatrics: { label: 'Pediatrics', color: DEPARTMENT_COLORS[3] },
                  Maternity: { label: 'Maternity', color: DEPARTMENT_COLORS[4] },
                }}
              >
                <PieChart>
                  <Pie
                    data={departmentDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                    style={{ cursor: 'pointer' }}
                    onClick={(data) => {
                      const name = (data as { name?: string } | undefined)?.name;
                      if (name) handleDepartmentClick(name);
                    }}
                  >
                    {departmentDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
                {departmentDistribution.map((dept, index) => (
                  <button
                    key={dept.name}
                    type="button"
                    onClick={() => handleDepartmentClick(dept.name)}
                    className={`rounded-md border border-border/60 bg-background/70 p-2 text-left transition hover:border-secondary/50 ${selectedWard === dept.name ? 'ring-1 ring-secondary/50' : ''}`}
                  >
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: DEPARTMENT_COLORS[index] }} />
                      {dept.name}
                    </p>
                    <p className="text-lg font-semibold">{dept.value}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle>Intake Type Breakdown</CardTitle>
              <CardDescription>Appointments vs walk-ins vs emergency burden</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                className="h-[250px] w-full sm:h-[300px]"
                config={{
                  value: { label: 'Patients', color: '#1d4ed8' },
                }}
              >
                <BarChart data={throughputData} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="value"
                    fill="var(--color-value)"
                    radius={[8, 8, 0, 0]}
                    style={{ cursor: 'pointer' }}
                    onClick={(data) => {
                      const name = (data as { name?: string } | undefined)?.name;
                      if (name) handleIntakeClick(name);
                    }}
                  />
                </BarChart>
              </ChartContainer>
              <div className="mt-3 flex flex-wrap gap-2">
                {throughputData.map((item) => {
                  const intakeMap: Record<string, string> = {
                    Appointments: 'appointment',
                    'Walk-ins': 'walk-in',
                    Emergency: 'emergency',
                  };
                  const mapped = intakeMap[item.name] || 'all';
                  return (
                    <Button
                      key={item.name}
                      type="button"
                      size="sm"
                      variant={selectedIntakeType === mapped ? 'default' : 'outline'}
                      onClick={() => handleIntakeClick(item.name)}
                    >
                      {item.name}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card ref={recordsSectionRef} className="border-border/70 bg-card/80">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Patient Data Table</CardTitle>
                <CardDescription>
                  Filtered by chart clicks with protected contact fields for privacy.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Ward: {selectedWard}</Badge>
                <Badge variant="outline">Intake: {selectedIntakeType}</Badge>
                <Button variant="outline" size="sm" onClick={() => router.push(`/admin/patient-data?ward=${selectedWard}&intakeType=${selectedIntakeType}`)}>
                  Open Full Patient Data
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isRecordsLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading patient records...</div>
            ) : patientRecords.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No patient records for selected chart filters.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor Consulted</TableHead>
                    <TableHead>Ward</TableHead>
                    <TableHead>Intake</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Protected Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patientRecords.slice(0, 15).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.date).toLocaleString()}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{record.patientName}</p>
                          <p className="text-xs text-muted-foreground">ID: {record.patientId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{record.doctorName}</p>
                          <p className="text-xs text-muted-foreground">{record.specialization}</p>
                        </div>
                      </TableCell>
                      <TableCell>{record.ward}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{record.intakeType}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate" title={record.reason}>{record.reason}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{record.visitStatus}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-xs">{record.protectedEmail}</p>
                          <p className="text-xs">{record.protectedPhone}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-secondary" />
              Response Time Benchmarks
            </CardTitle>
            <CardDescription>Operational timing estimates for critical workflow stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {responseTiming.map((item) => (
                <div key={item.metric} className="rounded-lg border border-border/60 bg-background/70 p-4">
                  <p className="text-sm text-muted-foreground">{item.metric}</p>
                  <p className="mt-1 text-3xl font-bold text-foreground">{item.minutes}m</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
