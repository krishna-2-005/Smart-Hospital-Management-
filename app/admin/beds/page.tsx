'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  LogOut,
  ArrowLeft,
  Download,
  Search,
  X,
  FileText,
  BedDouble,
  UserRound,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { exportToCSV, exportToHTML, getReportTitle } from '@/lib/export-utils';

type AllocationDetails = {
  id?: number;
  admissionReason?: string;
  admissionDiagnosis?: string;
  admittingDoctorName?: string;
  expectedStayDays?: number;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  clinicalNotes?: string;
  requiresVentilator?: boolean;
  requiresIsolation?: boolean;
  dietType?: string;
  allergiesConfirmed?: boolean;
  allocatedAt?: string;
};

interface Bed {
  id: number;
  bedNumber: string;
  ward: string;
  bedType: string;
  floor: number;
  isAvailable: boolean;
  allocatedPatient: {
    id: number;
    name: string;
    patientId: string;
  } | null;
  allocationDetails?: AllocationDetails | null;
}

interface PatientOption {
  id: number;
  patientId: string;
  name: string;
  bloodType?: string;
  allergies?: string;
}

const defaultAllocationForm: Required<AllocationDetails> & { patientId: string } = {
  patientId: '',
  admissionReason: '',
  admissionDiagnosis: '',
  admittingDoctorName: '',
  expectedStayDays: 1,
  insuranceProvider: '',
  insurancePolicyNumber: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  clinicalNotes: '',
  requiresVentilator: false,
  requiresIsolation: false,
  dietType: 'regular',
  allergiesConfirmed: false,
  id: 0,
  allocatedAt: '',
};

export default function BedsPage() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [wardFilter, setWardFilter] = useState('all');
  const [bedTypeFilter, setBedTypeFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [allocationForm, setAllocationForm] = useState(defaultAllocationForm);
  const [isSavingAllocation, setIsSavingAllocation] = useState(false);
  const router = useRouter();

  const fetchBeds = async () => {
    try {
      const res = await fetch('/api/admin/beds', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBeds(data.beds || []);
      }
    } catch (error) {
      console.error('Error fetching beds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/admin/patients', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
      }
    } catch (error) {
      console.error('Error fetching patients for allocation:', error);
    }
  };

  useEffect(() => {
    fetchBeds();
    fetchPatients();
    const interval = setInterval(fetchBeds, 20000);
    return () => clearInterval(interval);
  }, []);

  const wards = useMemo(() => Array.from(new Set(beds.map((b) => b.ward))), [beds]);
  const bedTypes = useMemo(() => Array.from(new Set(beds.map((b) => b.bedType))), [beds]);

  const filteredBeds = useMemo(() => {
    let filtered = beds;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.bedNumber.toLowerCase().includes(query) ||
          b.ward.toLowerCase().includes(query) ||
          (b.allocatedPatient?.name || '').toLowerCase().includes(query) ||
          (b.allocatedPatient?.patientId || '').toLowerCase().includes(query),
      );
    }

    if (wardFilter !== 'all') {
      filtered = filtered.filter((b) => b.ward === wardFilter);
    }

    if (bedTypeFilter !== 'all') {
      filtered = filtered.filter((b) => b.bedType === bedTypeFilter);
    }

    if (availabilityFilter === 'available') {
      filtered = filtered.filter((b) => b.isAvailable);
    } else if (availabilityFilter === 'occupied') {
      filtered = filtered.filter((b) => !b.isAvailable);
    }

    return filtered;
  }, [beds, searchQuery, wardFilter, bedTypeFilter, availabilityFilter]);

  const handleReleaseBed = async (bed: Bed) => {
    await fetch('/api/admin/beds', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ bedId: bed.id, action: 'release' }),
    });

    await fetchBeds();
  };

  const openAllocationDialog = (bed: Bed) => {
    setSelectedBed(bed);
    setAllocationForm(defaultAllocationForm);
    setIsAllocationDialogOpen(true);
  };

  const submitAllocation = async () => {
    if (!selectedBed || !allocationForm.patientId || !allocationForm.admissionReason.trim()) {
      return;
    }

    setIsSavingAllocation(true);
    try {
      await fetch('/api/admin/beds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bedId: selectedBed.id,
          action: 'allocate',
          allocatedToPatientId: Number(allocationForm.patientId),
          allocationDetails: {
            admissionReason: allocationForm.admissionReason,
            admissionDiagnosis: allocationForm.admissionDiagnosis,
            admittingDoctorName: allocationForm.admittingDoctorName,
            expectedStayDays: allocationForm.expectedStayDays,
            insuranceProvider: allocationForm.insuranceProvider,
            insurancePolicyNumber: allocationForm.insurancePolicyNumber,
            emergencyContactName: allocationForm.emergencyContactName,
            emergencyContactPhone: allocationForm.emergencyContactPhone,
            clinicalNotes: allocationForm.clinicalNotes,
            requiresVentilator: allocationForm.requiresVentilator,
            requiresIsolation: allocationForm.requiresIsolation,
            dietType: allocationForm.dietType,
            allergiesConfirmed: allocationForm.allergiesConfirmed,
          },
        }),
      });

      setIsAllocationDialogOpen(false);
      setSelectedBed(null);
      setAllocationForm(defaultAllocationForm);
      await fetchBeds();
    } finally {
      setIsSavingAllocation(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/auth/login');
  };

  const handleExportCSV = () => {
    const exportData = filteredBeds.map((b) => ({
      'Bed Number': b.bedNumber,
      Ward: b.ward,
      Floor: b.floor,
      Type: b.bedType,
      Status: b.isAvailable ? 'Available' : 'Occupied',
      'Patient Name': b.allocatedPatient?.name || 'N/A',
      'Patient ID': b.allocatedPatient?.patientId || 'N/A',
      'Admission Reason': b.allocationDetails?.admissionReason || 'N/A',
      'Admitting Doctor': b.allocationDetails?.admittingDoctorName || 'N/A',
    }));

    exportToCSV(exportData, `beds-status-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportHTML = () => {
    const title = getReportTitle('Hospital Bed Status Report');
    const occupancyRate = beds.length > 0
      ? Math.round(((beds.length - beds.filter((b) => b.isAvailable).length) / beds.length) * 100)
      : 0;

    const summary = `
      <div class="summary">
        <h2>Report Summary</h2>
        <div class="summary-item"><div class="summary-label">Total Beds</div><div class="summary-value">${filteredBeds.length}</div></div>
        <div class="summary-item"><div class="summary-label">Available</div><div class="summary-value">${filteredBeds.filter((b) => b.isAvailable).length}</div></div>
        <div class="summary-item"><div class="summary-label">Occupied</div><div class="summary-value">${filteredBeds.filter((b) => !b.isAvailable).length}</div></div>
        <div class="summary-item"><div class="summary-label">Occupancy Rate</div><div class="summary-value">${occupancyRate}%</div></div>
      </div>
    `;

    const tableHTML = `
      <h1>${title}</h1>
      ${summary}
      <h2>Bed Details</h2>
      <table>
        <thead>
          <tr>
            <th>Bed Number</th>
            <th>Ward</th>
            <th>Floor</th>
            <th>Type</th>
            <th>Status</th>
            <th>Patient</th>
            <th>Admission Reason</th>
          </tr>
        </thead>
        <tbody>
          ${filteredBeds
            .map(
              (b) => `
            <tr>
              <td>${b.bedNumber}</td>
              <td>${b.ward}</td>
              <td>${b.floor}</td>
              <td>${b.bedType}</td>
              <td>${b.isAvailable ? 'Available' : 'Occupied'}</td>
              <td>${b.allocatedPatient ? `${b.allocatedPatient.name} (${b.allocatedPatient.patientId})` : '-'}</td>
              <td>${b.allocationDetails?.admissionReason || '-'}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    `;

    exportToHTML(tableHTML, 'Hospital Bed Status Report');
  };

  const getBedTypeColor = (bedType: string) => {
    switch (bedType) {
      case 'icu':
        return 'bg-destructive/20 text-destructive';
      case 'general':
        return 'bg-secondary/20 text-secondary';
      case 'pediatric':
        return 'bg-blue-500/20 text-blue-700';
      case 'maternity':
        return 'bg-pink-500/20 text-pink-700';
      case 'isolation':
        return 'bg-amber-500/20 text-amber-700';
      default:
        return 'bg-muted/20 text-muted-foreground';
    }
  };

  const occupancyPercentage = beds.length > 0
    ? Math.round(((beds.length - beds.filter((b) => b.isAvailable).length) / beds.length) * 100)
    : 0;

  const hasActiveFilters =
    searchQuery || wardFilter !== 'all' || bedTypeFilter !== 'all' || availabilityFilter !== 'all';

  const selectedPatient = patients.find((p) => String(p.id) === allocationForm.patientId);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-primary">Bed Management</h1>
            <p className="text-xs text-muted-foreground">Detailed admission and bed allocation workflow</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Total Beds</p>
              <p className="text-3xl font-bold text-primary">{beds.length}</p>
            </CardContent>
          </Card>
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Available</p>
              <p className="text-3xl font-bold text-secondary">{beds.filter((b) => b.isAvailable).length}</p>
            </CardContent>
          </Card>
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Occupied</p>
              <p className="text-3xl font-bold text-destructive">{beds.filter((b) => !b.isAvailable).length}</p>
            </CardContent>
          </Card>
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Occupancy Rate</p>
              <p className={`text-3xl font-bold ${occupancyPercentage > 80 ? 'text-destructive' : occupancyPercentage > 60 ? 'text-amber-600' : 'text-secondary'}`}>
                {occupancyPercentage}%
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-secondary/20 mb-6">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Bed Occupancy Trend</span>
                <span className={`text-sm font-semibold ${occupancyPercentage > 80 ? 'text-destructive' : occupancyPercentage > 60 ? 'text-amber-600' : 'text-secondary'}`}>
                  {occupancyPercentage}%
                </span>
              </div>
              <Progress value={occupancyPercentage} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-secondary/20">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Hospital Beds ({filteredBeds.length})</CardTitle>
                <CardDescription>Allocate beds with complete admission details</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportHTML}>
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by bed number, ward, patient name, or patient ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={wardFilter} onValueChange={setWardFilter}>
                  <SelectTrigger><SelectValue placeholder="Filter by ward" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Wards</SelectItem>
                    {wards.map((w) => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={bedTypeFilter} onValueChange={setBedTypeFilter}>
                  <SelectTrigger><SelectValue placeholder="Filter by bed type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {bedTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger><SelectValue placeholder="Filter by availability" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available Only</SelectItem>
                    <SelectItem value="occupied">Occupied Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {searchQuery && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchQuery('')}>
                      Search: "{searchQuery}" <X className="w-3 h-3 ml-1" />
                    </Badge>
                  )}
                  {wardFilter !== 'all' && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setWardFilter('all')}>
                      Ward: {wardFilter} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  )}
                  {bedTypeFilter !== 'all' && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setBedTypeFilter('all')}>
                      Type: {bedTypeFilter} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  )}
                  {availabilityFilter !== 'all' && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setAvailabilityFilter('all')}>
                      {availabilityFilter === 'available' ? 'Available' : 'Occupied'} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setWardFilter('all');
                      setBedTypeFilter('all');
                      setAvailabilityFilter('all');
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-8">Loading beds...</div>
            ) : filteredBeds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {beds.length === 0 ? 'No beds found.' : 'No beds match your filters.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredBeds.map((bed) => (
                  <div key={bed.id} className="p-4 rounded-lg border border-secondary/20 hover:border-secondary/40 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">Bed {bed.bedNumber}</p>
                        <p className="text-sm text-muted-foreground">{bed.ward} - Floor {bed.floor}</p>
                      </div>
                      <Badge className={getBedTypeColor(bed.bedType)}>
                        {bed.bedType.charAt(0).toUpperCase() + bed.bedType.slice(1)}
                      </Badge>
                    </div>

                    {bed.allocatedPatient ? (
                      <div className="p-3 rounded bg-secondary/10 border border-secondary/20 mb-3 space-y-1">
                        <p className="text-xs text-muted-foreground">Occupied by</p>
                        <p className="font-semibold text-foreground text-sm">{bed.allocatedPatient.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {bed.allocatedPatient.patientId}</p>
                        {bed.allocationDetails?.admissionReason && (
                          <p className="text-xs text-muted-foreground">Reason: {bed.allocationDetails.admissionReason}</p>
                        )}
                        {bed.allocationDetails?.admittingDoctorName && (
                          <p className="text-xs text-muted-foreground">Doctor: {bed.allocationDetails.admittingDoctorName}</p>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded bg-green-500/10 border border-green-500/20 mb-3">
                        <p className="font-semibold text-green-700 text-sm">Available</p>
                      </div>
                    )}

                    {bed.isAvailable ? (
                      <Dialog open={isAllocationDialogOpen && selectedBed?.id === bed.id} onOpenChange={(open) => {
                        setIsAllocationDialogOpen(open);
                        if (!open) {
                          setSelectedBed(null);
                          setAllocationForm(defaultAllocationForm);
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full border-secondary/30" onClick={() => openAllocationDialog(bed)}>
                            <BedDouble className="w-4 h-4 mr-2" />
                            Allocate with Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Allocate Bed {bed.bedNumber}</DialogTitle>
                            <DialogDescription>
                              Capture complete admission details for clinical, billing, and future history.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium mb-1 block">Patient</label>
                              <Select
                                value={allocationForm.patientId}
                                onValueChange={(value) => setAllocationForm((prev) => ({ ...prev, patientId: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select patient" />
                                </SelectTrigger>
                                <SelectContent>
                                  {patients.map((patient) => (
                                    <SelectItem key={patient.id} value={String(patient.id)}>
                                      {patient.name} ({patient.patientId})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {selectedPatient && (
                                <div className="mt-2 rounded-md border border-secondary/20 bg-secondary/5 p-2 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-2"><UserRound className="w-3.5 h-3.5" />{selectedPatient.name}</div>
                                  <p>Blood Type: {selectedPatient.bloodType || 'NA'}</p>
                                  <p>Allergies: {selectedPatient.allergies || 'None'}</p>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm font-medium mb-1 block">Admission Reason</label>
                                <Input
                                  value={allocationForm.admissionReason}
                                  onChange={(e) => setAllocationForm((prev) => ({ ...prev, admissionReason: e.target.value }))}
                                  placeholder="Primary reason for bed admission"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-1 block">Admission Diagnosis</label>
                                <Input
                                  value={allocationForm.admissionDiagnosis}
                                  onChange={(e) => setAllocationForm((prev) => ({ ...prev, admissionDiagnosis: e.target.value }))}
                                  placeholder="Working diagnosis"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm font-medium mb-1 block">Admitting Doctor</label>
                                <Input
                                  value={allocationForm.admittingDoctorName}
                                  onChange={(e) => setAllocationForm((prev) => ({ ...prev, admittingDoctorName: e.target.value }))}
                                  placeholder="Doctor name"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-1 block">Expected Stay (days)</label>
                                <Input
                                  type="number"
                                  min={1}
                                  value={allocationForm.expectedStayDays}
                                  onChange={(e) =>
                                    setAllocationForm((prev) => ({
                                      ...prev,
                                      expectedStayDays: Number(e.target.value || 1),
                                    }))
                                  }
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm font-medium mb-1 block">Insurance Provider</label>
                                <Input
                                  value={allocationForm.insuranceProvider}
                                  onChange={(e) => setAllocationForm((prev) => ({ ...prev, insuranceProvider: e.target.value }))}
                                  placeholder="Provider name"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-1 block">Policy Number</label>
                                <Input
                                  value={allocationForm.insurancePolicyNumber}
                                  onChange={(e) => setAllocationForm((prev) => ({ ...prev, insurancePolicyNumber: e.target.value }))}
                                  placeholder="Insurance policy number"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm font-medium mb-1 block">Emergency Contact Name</label>
                                <Input
                                  value={allocationForm.emergencyContactName}
                                  onChange={(e) => setAllocationForm((prev) => ({ ...prev, emergencyContactName: e.target.value }))}
                                  placeholder="Contact person"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-1 block">Emergency Contact Phone</label>
                                <Input
                                  value={allocationForm.emergencyContactPhone}
                                  onChange={(e) => setAllocationForm((prev) => ({ ...prev, emergencyContactPhone: e.target.value }))}
                                  placeholder="Contact number"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="text-sm font-medium mb-1 block">Diet Type</label>
                                <Select
                                  value={allocationForm.dietType}
                                  onValueChange={(value) => setAllocationForm((prev) => ({ ...prev, dietType: value }))}
                                >
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="regular">Regular</SelectItem>
                                    <SelectItem value="cardiac">Cardiac</SelectItem>
                                    <SelectItem value="diabetic">Diabetic</SelectItem>
                                    <SelectItem value="renal">Renal</SelectItem>
                                    <SelectItem value="liquid">Liquid</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-end">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                  <input
                                    type="checkbox"
                                    checked={allocationForm.requiresVentilator}
                                    onChange={(e) =>
                                      setAllocationForm((prev) => ({ ...prev, requiresVentilator: e.target.checked }))
                                    }
                                  />
                                  Ventilator Required
                                </label>
                              </div>
                              <div className="flex items-end">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                  <input
                                    type="checkbox"
                                    checked={allocationForm.requiresIsolation}
                                    onChange={(e) =>
                                      setAllocationForm((prev) => ({ ...prev, requiresIsolation: e.target.checked }))
                                    }
                                  />
                                  Isolation Required
                                </label>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                id="allergies-confirmed"
                                type="checkbox"
                                checked={allocationForm.allergiesConfirmed}
                                onChange={(e) =>
                                  setAllocationForm((prev) => ({ ...prev, allergiesConfirmed: e.target.checked }))
                                }
                              />
                              <label htmlFor="allergies-confirmed" className="text-sm">
                                Allergy details verified before allocation
                              </label>
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-1 block">Clinical Notes</label>
                              <Textarea
                                rows={4}
                                value={allocationForm.clinicalNotes}
                                onChange={(e) => setAllocationForm((prev) => ({ ...prev, clinicalNotes: e.target.value }))}
                                placeholder="Nursing instructions, vitals monitoring, special equipment notes"
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                className="flex-1"
                                disabled={isSavingAllocation || !allocationForm.patientId || !allocationForm.admissionReason.trim()}
                                onClick={submitAllocation}
                              >
                                {isSavingAllocation ? 'Allocating...' : 'Confirm Bed Allocation'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsAllocationDialogOpen(false);
                                  setSelectedBed(null);
                                  setAllocationForm(defaultAllocationForm);
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-secondary/30"
                        onClick={() => handleReleaseBed(bed)}
                      >
                        Release Bed
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
