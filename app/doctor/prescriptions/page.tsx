'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Pill, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface IssuedPrescription {
  id: number;
  patientName: string;
  patientId: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  status: string;
  issuedDate: string;
}

export default function DoctorPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<IssuedPrescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    patientId: '',
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  });
  const router = useRouter();

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const res = await fetch('/api/prescriptions', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setPrescriptions(data.prescriptions || []);
        }
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  const handleIssuePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'issue',
          ...formData,
        }),
      });

      if (res.ok) {
        setSuccessMessage('Prescription issued successfully!');
        setFormData({
          patientId: '',
          medication: '',
          dosage: '',
          frequency: '',
          duration: '',
          instructions: '',
        });
        setDialogOpen(false);

        // Refresh prescriptions
        const fetchRes = await fetch('/api/prescriptions', { credentials: 'include' });
        if (fetchRes.ok) {
          const data = await fetchRes.json();
          setPrescriptions(data.prescriptions || []);
        }

        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error issuing prescription:', error);
    }
  };

  const handleStatusChange = async (prescriptionId: number, newStatus: string) => {
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prescriptionId,
          status: newStatus,
          action: 'update-status',
        }),
      });

      if (res.ok) {
        // Refresh
        const fetchRes = await fetch('/api/prescriptions', { credentials: 'include' });
        if (fetchRes.ok) {
          const data = await fetchRes.json();
          setPrescriptions(data.prescriptions || []);
        }
      }
    } catch (error) {
      console.error('Error updating prescription:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const frequencyOptions = ['Once daily', 'Twice daily', 'Three times daily', 'Every 4 hours', 'Every 6 hours', 'As needed', 'Weekly', 'Monthly'];
  const durationOptions = ['3 days', '5 days', '7 days', '10 days', '14 days', '30 days', '60 days', '90 days'];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary">Prescription Management</h1>
              <p className="text-xs text-muted-foreground">Issue and manage patient prescriptions</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Issue Prescription
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-primary" />
                  Issue New Prescription
                </DialogTitle>
                <DialogDescription>Fill out the form to issue a prescription to a patient</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleIssuePrescription} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Patient ID</label>
                  <Input
                    placeholder="P001"
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Medication</label>
                  <Input
                    placeholder="e.g., Amoxicillin"
                    value={formData.medication}
                    onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Dosage</label>
                    <Input
                      placeholder="e.g., 500mg"
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Frequency</label>
                    <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map(freq => (
                          <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Duration</label>
                  <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map(dur => (
                        <SelectItem key={dur} value={dur}>{dur}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Special Instructions</label>
                  <Textarea
                    placeholder="e.g., Take with food, Do not take with..."
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    rows={2}
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  Issue Prescription
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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
              <p className="text-muted-foreground text-sm mb-1">Total Issued</p>
              <p className="text-3xl font-bold text-primary">{prescriptions.length}</p>
            </CardContent>
          </Card>
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Active</p>
              <p className="text-3xl font-bold text-secondary">
                {prescriptions.filter(p => p.status === 'active').length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Inactive/Expired</p>
              <p className="text-3xl font-bold text-amber-600">
                {prescriptions.filter(p => p.status !== 'active').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Prescriptions List */}
        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary" />
              Issued Prescriptions
            </CardTitle>
            <CardDescription>Manage prescriptions you've issued to patients</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading prescriptions...</div>
            ) : prescriptions.length === 0 ? (
              <div className="py-12 text-center">
                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No prescriptions issued yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="rounded-lg border border-secondary/20 p-4 hover:border-secondary/40 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{rx.medication}</p>
                        <p className="text-sm text-muted-foreground">
                          {rx.patientName} • {rx.patientId}
                        </p>
                      </div>
                      <Badge className={getStatusColor(rx.status)}>
                        {rx.status.charAt(0).toUpperCase() + rx.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3 pb-3 border-b border-secondary/10">
                      <div>
                        <p className="text-muted-foreground text-xs">Dosage</p>
                        <p className="font-medium">{rx.dosage}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Frequency</p>
                        <p className="font-medium">{rx.frequency}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Duration</p>
                        <p className="font-medium">{rx.duration}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Issued</p>
                        <p className="font-medium">{new Date(rx.issuedDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {rx.status === 'active' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(rx.id, 'inactive')}
                          >
                            Mark Inactive
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusChange(rx.id, 'expired')}
                          >
                            Mark Expired
                          </Button>
                        </>
                      )}
                      {rx.status !== 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(rx.id, 'active')}
                        >
                          Restore
                        </Button>
                      )}
                    </div>
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
