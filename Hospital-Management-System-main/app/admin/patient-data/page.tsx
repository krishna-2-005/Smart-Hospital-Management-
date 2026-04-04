'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

export default function AdminPatientDataPage() {
  const router = useRouter();
  const [records, setRecords] = useState<PatientDataRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [wardFilter, setWardFilter] = useState('all');
  const [intakeFilter, setIntakeFilter] = useState('all');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setWardFilter(params.get('ward') || 'all');
    setIntakeFilter(params.get('intakeType') || 'all');
  }, []);

  const loadRecords = async (ward: string, intakeType: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (ward && ward !== 'all') params.set('ward', ward);
      if (intakeType && intakeType !== 'all') params.set('intakeType', intakeType);
      const res = await fetch(`/api/admin/patient-data?${params.toString()}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (error) {
      console.error('Error loading patient data records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords(wardFilter, intakeFilter);
  }, [wardFilter, intakeFilter]);

  const uniqueWards = useMemo(() => {
    return Array.from(new Set(records.map((record) => record.ward))).sort();
  }, [records]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary">Patient Data Workspace</h1>
              <p className="text-sm text-muted-foreground">Admin-only consultation records with protected data masking</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin/analytics')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Back to Analytics
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-secondary" />
              Data Access Controls
            </CardTitle>
            <CardDescription>
              Contact information is masked to protect sensitive data while preserving operational visibility.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Select value={wardFilter} onValueChange={setWardFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by ward" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Wards</SelectItem>
                {uniqueWards.map((ward) => (
                  <SelectItem key={ward} value={ward}>{ward}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={intakeFilter} onValueChange={setIntakeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by intake type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Intake Types</SelectItem>
                <SelectItem value="appointment">Appointments</SelectItem>
                <SelectItem value="walk-in">Walk-ins</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setWardFilter('all');
                setIntakeFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Patient Records ({records.length})</CardTitle>
            <CardDescription>
              Date, patient, doctor consultation, ward mapping, and protected contact fields.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading patient data...</div>
            ) : records.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No patient records found for selected filters.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor Consulted</TableHead>
                    <TableHead>Ward</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Protected Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
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
                      <TableCell className="max-w-[230px] truncate" title={record.reason}>{record.reason}</TableCell>
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
      </main>
    </div>
  );
}
