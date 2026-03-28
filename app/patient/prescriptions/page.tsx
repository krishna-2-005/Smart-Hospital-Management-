'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pill, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Prescription {
  id: number;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  status: string;
  doctorName: string;
  issuedDate: string;
  instructions?: string;
}

export default function PatientPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
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

  const handleRequestRefill = async (prescriptionId: number) => {
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'refill',
          prescriptionId,
        }),
      });

      if (res.ok) {
        setSuccessMessage('Refill request sent to your doctor!');
        setSelectedRx(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error requesting refill:', error);
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
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-secondary/10 text-secondary';
    }
  };

  const activePrescriptions = prescriptions.filter(p => p.status === 'active');
  const inactivePrescriptions = prescriptions.filter(p => p.status !== 'active');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">My Prescriptions</h1>
            <p className="text-xs text-muted-foreground">View and manage your medications</p>
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
              <p className="text-muted-foreground text-sm mb-1">Total Prescriptions</p>
              <p className="text-3xl font-bold text-primary">{prescriptions.length}</p>
            </CardContent>
          </Card>
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Active</p>
              <p className="text-3xl font-bold text-secondary">{activePrescriptions.length}</p>
            </CardContent>
          </Card>
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Expired/Inactive</p>
              <p className="text-3xl font-bold text-amber-600">{inactivePrescriptions.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Prescriptions */}
        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary" />
              Your Prescriptions
            </CardTitle>
            <CardDescription>Click any prescription for details and refill options</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading prescriptions...</div>
            ) : prescriptions.length === 0 ? (
              <div className="py-12 text-center">
                <Pill className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No prescriptions on file</p>
              </div>
            ) : (
              <Tabs defaultValue="active" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="active">
                    Active ({activePrescriptions.length})
                  </TabsTrigger>
                  <TabsTrigger value="past">
                    Past ({inactivePrescriptions.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-3">
                  {activePrescriptions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No active prescriptions</p>
                  ) : (
                    activePrescriptions.map((rx) => (
                      <div
                        key={rx.id}
                        onClick={() => setSelectedRx(rx)}
                        className="rounded-lg border border-secondary/20 p-4 hover:bg-secondary/5 hover:border-secondary/40 transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-foreground text-lg">{rx.medication}</p>
                            <p className="text-sm text-muted-foreground">Prescribed by: {rx.doctorName}</p>
                          </div>
                          <Badge className={getStatusColor(rx.status)}>
                            {rx.status.charAt(0).toUpperCase() + rx.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs font-medium">DOSAGE</p>
                            <p className="font-medium">{rx.dosage}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs font-medium">FREQUENCY</p>
                            <p className="font-medium">{rx.frequency}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs font-medium">DURATION</p>
                            <p className="font-medium">{rx.duration}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs font-medium">ISSUED</p>
                            <p className="font-medium">{new Date(rx.issuedDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="past" className="space-y-3">
                  {inactivePrescriptions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No past prescriptions</p>
                  ) : (
                    inactivePrescriptions.map((rx) => (
                      <div
                        key={rx.id}
                        onClick={() => setSelectedRx(rx)}
                        className="rounded-lg border border-secondary/20 p-4 hover:bg-secondary/5 hover:border-secondary/40 transition-all cursor-pointer opacity-75"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-foreground">{rx.medication}</p>
                            <p className="text-sm text-muted-foreground">Prescribed by: {rx.doctorName}</p>
                          </div>
                          <Badge className={getStatusColor(rx.status)}>
                            {rx.status.charAt(0).toUpperCase() + rx.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <p className="text-muted-foreground">
                            {rx.dosage} • {rx.frequency} • {rx.duration}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Issued: {new Date(rx.issuedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Prescription Detail Dialog */}
        {selectedRx && (
          <Dialog open={!!selectedRx} onOpenChange={() => setSelectedRx(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-primary" />
                  {selectedRx.medication}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="bg-secondary/5 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Dosage</p>
                    <p className="text-lg font-medium">{selectedRx.dosage}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Frequency</p>
                    <p className="text-lg font-medium">{selectedRx.frequency}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Duration</p>
                    <p className="text-lg font-medium">{selectedRx.duration}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Prescribed By</p>
                    <p className="text-lg font-medium">{selectedRx.doctorName}</p>
                  </div>
                  {selectedRx.instructions && (
                    <div className="pt-2 border-t border-secondary/20">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Special Instructions</p>
                      <p className="text-sm">{selectedRx.instructions}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-secondary/20">
                  <Button variant="outline" className="flex-1" onClick={() => setSelectedRx(null)}>
                    Close
                  </Button>
                  {selectedRx.status === 'active' && (
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={() => handleRequestRefill(selectedRx.id)}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Request Refill
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}
