'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Discharge {
  id: number;
  admissionId: number;
  patientId: number;
  patientName: string;
  admissionDate: string;
  dischargeDate?: string;
  status: string;
  reason?: string;
  principalDiagnosis: string;
  procedures: string[];
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  followUpInstructions?: string;
  doctorName: string;
}

export default function DoctorDischargesPage() {
  const [discharges, setDischarges] = useState<Discharge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDischarge, setSelectedDischarge] = useState<Discharge | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    reason: '',
    procedures: '',
    followUpInstructions: '',
  });
  const router = useRouter();

  useEffect(() => {
    const fetchDischarges = async () => {
      try {
        const res = await fetch('/api/discharge', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setDischarges(data.discharges || []);
        }
      } catch (error) {
        console.error('Error fetching discharges:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDischarges();
  }, []);

  const handleCompleteDischarge = async () => {
    if (!selectedDischarge) return;

    try {
      const res = await fetch('/api/discharge', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          dischargeId: selectedDischarge.id,
          status: 'completed',
          reason: formData.reason,
          procedures: formData.procedures.split('\n').filter(p => p.trim()),
          followUpInstructions: formData.followUpInstructions,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDischarges(discharges.map(d => (d.id === data.id ? data : d)));
        setSuccessMessage('Patient discharged successfully!');
        setIsFormOpen(false);
        setSelectedDischarge(null);
        setFormData({ reason: '', procedures: '', followUpInstructions: '' });
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error completing discharge:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-secondary/10 text-secondary';
    }
  };

  const pendingDischarges = discharges.filter(d => d.status === 'pending');
  const completedDischarges = discharges.filter(d => d.status === 'completed');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">Discharge Management</h1>
            <p className="text-xs text-muted-foreground">Manage patient discharges and follow-up care</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Total Discharges</p>
              <p className="text-3xl font-bold text-primary">{discharges.length}</p>
            </CardContent>
          </Card>
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingDischarges.length}</p>
            </CardContent>
          </Card>
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-600">{completedDischarges.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Discharges */}
        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Pending Discharges
            </CardTitle>
            <CardDescription>Patients ready for or in discharge process</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading discharge records...</div>
            ) : pendingDischarges.length === 0 ? (
              <div className="py-12 text-center">
                <LogOut className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No pending discharges</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingDischarges.map((discharge) => (
                  <div
                    key={discharge.id}
                    className="rounded-lg border border-secondary/20 p-4 hover:bg-secondary/5 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-foreground">{discharge.patientName}</p>
                        <p className="text-sm text-muted-foreground">
                          Admitted: {new Date(discharge.admissionDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(discharge.status)}>
                        {discharge.status.charAt(0).toUpperCase() + discharge.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-muted-foreground">
                        <strong>Diagnosis:</strong> {discharge.principalDiagnosis}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedDischarge(discharge);
                        setIsFormOpen(true);
                      }}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Complete Discharge
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Discharges */}
        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Completed Discharges
            </CardTitle>
            <CardDescription>Previously discharged patients</CardDescription>
          </CardHeader>
          <CardContent>
            {completedDischarges.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No completed discharges</div>
            ) : (
              <div className="space-y-3">
                {completedDischarges.map((discharge) => (
                  <div
                    key={discharge.id}
                    onClick={() => setSelectedDischarge(discharge)}
                    className="rounded-lg border border-secondary/20 p-4 hover:bg-secondary/5 transition-all cursor-pointer opacity-75"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{discharge.patientName}</p>
                        <p className="text-sm text-muted-foreground">
                          Admitted: {new Date(discharge.admissionDate).toLocaleDateString()} •
                          Discharged: {discharge.dischargeDate ? new Date(discharge.dischargeDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <Badge className={getStatusColor(discharge.status)}>
                        {discharge.status.charAt(0).toUpperCase() + discharge.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Discharge Form Dialog */}
      {isFormOpen && selectedDischarge && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Complete Discharge: {selectedDischarge.patientName}</DialogTitle>
              <DialogDescription>
                Fill in the discharge summary and post-discharge instructions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Admission Summary */}
              <div className="bg-secondary/5 rounded-lg p-4 border border-secondary/20">
                <p className="text-sm font-semibold mb-2">Admission Details</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Admitted</p>
                    <p>{new Date(selectedDischarge.admissionDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Length of Stay</p>
                    <p>
                      {Math.ceil(
                        (new Date().getTime() - new Date(selectedDischarge.admissionDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{' '}
                      days
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Principal Diagnosis</p>
                    <p>{selectedDischarge.principalDiagnosis}</p>
                  </div>
                </div>
              </div>

              {/* Discharge Reason */}
              <div>
                <Label htmlFor="reason">Discharge Reason</Label>
                <Input
                  id="reason"
                  placeholder="e.g., Recovered, Transferred to another facility"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  className="border-secondary/20"
                />
              </div>

              {/* Procedures/Treatments */}
              <div>
                <Label htmlFor="procedures">Procedures & Treatments (one per line)</Label>
                <Textarea
                  id="procedures"
                  placeholder="List procedures performed during admission..."
                  value={formData.procedures}
                  onChange={(e) =>
                    setFormData({ ...formData, procedures: e.target.value })
                  }
                  className="border-secondary/20 min-h-24"
                />
              </div>

              {/* Follow-up Instructions */}
              <div>
                <Label htmlFor="followUp">Follow-up Care Instructions</Label>
                <Textarea
                  id="followUp"
                  placeholder="Post-discharge care instructions, activity restrictions, diet recommendations, etc."
                  value={formData.followUpInstructions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      followUpInstructions: e.target.value,
                    })
                  }
                  className="border-secondary/20 min-h-24"
                />
              </div>

              {/* Medications Summary */}
              {selectedDischarge.medications.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm font-semibold mb-2 text-blue-900">
                    Discharge Medications
                  </p>
                  <div className="space-y-2">
                    {selectedDischarge.medications.map((med, idx) => (
                      <div key={idx} className="text-sm text-blue-800">
                        <p className="font-medium">
                          {med.name} - {med.dosage}
                        </p>
                        <p className="text-xs">
                          {med.frequency} for {med.duration}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-secondary/20">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={handleCompleteDischarge}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm & Discharge Patient
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      )}
    </div>
  );
}
