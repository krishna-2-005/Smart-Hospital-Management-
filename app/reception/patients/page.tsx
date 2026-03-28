'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Heart, LogOut, Search, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

type ReceptionPatient = {
  id: number;
  patientId: string;
  firstName: string;
  lastName: string;
  age: number | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  medicalHistory: string | null;
  visitCount: number;
  scansDone: number;
  lastVisitDate: string | null;
};

export default function ReceptionPatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<ReceptionPatient[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<ReceptionPatient | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadPatients = async (search = '') => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      const res = await fetch(`/api/reception/patients?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load patients');
      }

      setPatients(data.patients || []);
      if (selected) {
        const refreshed = (data.patients || []).find((p: ReceptionPatient) => p.patientId === selected.patientId);
        setSelected(refreshed || null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load patients');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const selectedTitle = useMemo(() => {
    if (!selected) return 'Select a patient to edit details';
    return `${selected.firstName} ${selected.lastName} (${selected.patientId})`;
  }, [selected]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await loadPatients(query);
  };

  const handleSave = async () => {
    if (!selected) return;
    setIsSaving(true);

    try {
      const res = await fetch('/api/reception/patients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(selected),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update patient');
      }

      toast.success('Patient details updated');
      await loadPatients(query);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update patient');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-primary">HealthHub - Patient Records</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/reception/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-6">
        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle>Search Patients</CardTitle>
            <CardDescription>Search by patient ID, name, or mobile number</CardDescription>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="DC2025001 / John / 98765..."
              />
              <Button type="submit" variant="outline">
                <Search className="w-4 h-4" />
              </Button>
            </form>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground py-6">Loading patients...</div>
            ) : patients.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6">No patients found for this search.</div>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => setSelected(patient)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      selected?.patientId === patient.patientId
                        ? 'border-primary bg-primary/5'
                        : 'border-secondary/20 hover:bg-secondary/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{patient.patientId}</p>
                        <p className="text-xs text-muted-foreground mt-1">Phone: {patient.phone || 'Not set'}</p>
                      </div>
                      <Badge variant="outline">{patient.visitCount} visits</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Scans: {patient.scansDone}</span>
                      <span>
                        Last Visit:{' '}
                        {patient.lastVisitDate ? new Date(patient.lastVisitDate).toLocaleDateString() : 'No visits'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle>Edit Patient Details</CardTitle>
            <CardDescription>{selectedTitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selected ? (
              <div className="text-sm text-muted-foreground">Select a patient from the left panel.</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Age</Label>
                    <Input
                      type="number"
                      value={selected.age ?? ''}
                      onChange={(e) =>
                        setSelected({ ...selected, age: e.target.value ? Number(e.target.value) : null })
                      }
                    />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Input
                      value={selected.gender ?? ''}
                      onChange={(e) => setSelected({ ...selected, gender: e.target.value || null })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Mobile Number</Label>
                  <Input
                    value={selected.phone ?? ''}
                    onChange={(e) => setSelected({ ...selected, phone: e.target.value || null })}
                  />
                </div>

                <div>
                  <Label>Address</Label>
                  <Input
                    value={selected.address ?? ''}
                    onChange={(e) => setSelected({ ...selected, address: e.target.value || null })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={selected.city ?? ''}
                      onChange={(e) => setSelected({ ...selected, city: e.target.value || null })}
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      value={selected.state ?? ''}
                      onChange={(e) => setSelected({ ...selected, state: e.target.value || null })}
                    />
                  </div>
                  <div>
                    <Label>Zip Code</Label>
                    <Input
                      value={selected.zipCode ?? ''}
                      onChange={(e) => setSelected({ ...selected, zipCode: e.target.value || null })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Medical History (Reception editable, patient read-only)</Label>
                  <Textarea
                    rows={5}
                    value={selected.medicalHistory ?? ''}
                    onChange={(e) => setSelected({ ...selected, medicalHistory: e.target.value || null })}
                    placeholder="Previous conditions, scans, notes, and follow-up details"
                  />
                </div>

                <div className="rounded-md border border-secondary/20 bg-secondary/5 p-3 text-xs text-muted-foreground">
                  Visit summary: {selected.visitCount} visits, {selected.scansDone} scan-related records
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Patient Record'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
