'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Heart, Users, LogOut, Stethoscope, AlertTriangle, ChevronDown, FileText, UserCheck, ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface QueuePatient {
  id: number;
  position: number;
  patientName: string;
  patientId: string;
  priority: string;
  status: string;
  estimatedWaitTime: number;
}

interface PatientDetails {
  bloodType?: string;
  allergies?: string;
  medicalHistory?: string;
  chronicConditions?: string[];
}

export default function DoctorQueuePage() {
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPatient, setExpandedPatient] = useState<number | null>(null);
  const [patientDetails, setPatientDetails] = useState<Record<number, PatientDetails>>({});
  const [pendingEmergencyAlerts, setPendingEmergencyAlerts] = useState(0);
  const [latestEmergency, setLatestEmergency] = useState<{
    requestId: number;
    message: string;
    category: string;
    alertId: number | null;
  } | null>(null);
  const [isAckingEmergency, setIsAckingEmergency] = useState(false);
  const router = useRouter();

  // Mock patient health data - in production, this would come from the API
  const getMockPatientDetails = (patientId: string): PatientDetails => {
    const mockData: Record<string, PatientDetails> = {
      'P001': { bloodType: 'O+', allergies: 'Penicillin, Shellfish', medicalHistory: 'Hypertension, Diabetes', chronicConditions: ['Type 2 Diabetes', 'Hypertension'] },
      'P002': { bloodType: 'A-', allergies: 'None documented', medicalHistory: 'Asthma', chronicConditions: ['Asthma'] },
      'P003': { bloodType: 'B+', allergies: 'Aspirin', medicalHistory: 'Heart condition', chronicConditions: ['Cardiac Arrhythmia'] },
      'P004': { bloodType: 'AB+', allergies: 'None documented', medicalHistory: 'No significant history', chronicConditions: [] },
      'P005': { bloodType: 'O-', allergies: 'Ibuprofen', medicalHistory: 'Gastric ulcers', chronicConditions: ['Peptic Ulcer'] },
    };
    return mockData[patientId] || { bloodType: 'Unknown', allergies: 'Not documented', medicalHistory: 'No history available', chronicConditions: [] };
  };

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await fetch('/api/doctor/queue', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setQueue(data.queue);
          
          // Pre-load patient details for all patients
          const details: Record<number, PatientDetails> = {};
          data.queue.forEach((patient: QueuePatient) => {
            details[patient.id] = getMockPatientDetails(patient.patientId);
          });
          setPatientDetails(details);
        }
      } catch (error) {
        console.error('Error fetching queue:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadEmergencyInbox = async () => {
      try {
        const res = await fetch('/api/doctor/emergency-response', { credentials: 'include' });
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
        console.error('Failed to load doctor emergency inbox', error);
      }
    };

    loadEmergencyInbox();
    const interval = setInterval(loadEmergencyInbox, 6000);
    return () => clearInterval(interval);
  }, []);

  const acknowledgeEmergencyAlert = async () => {
    if (!latestEmergency) return;
    setIsAckingEmergency(true);
    try {
      await fetch('/api/doctor/emergency-response', {
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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/auth/login');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return 'bg-destructive text-destructive-foreground';
      case 'high':
        return 'bg-amber-500 text-white';
      case 'normal':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-blue-500/20 text-blue-700';
      case 'in-consultation':
        return 'bg-secondary/20 text-secondary';
      default:
        return 'bg-muted/20 text-muted-foreground';
    }
  };

  const hasAllergyConflict = (allergies: string) => {
    return allergies && allergies !== 'None documented' && allergies.toLowerCase() !== 'none';
  };

  const triageLoad = useMemo(() => {
    const emergencyCount = queue.filter((p) => p.priority === 'emergency').length;
    const highCount = queue.filter((p) => p.priority === 'high').length;
    const score = emergencyCount * 3 + highCount * 2 + queue.length;
    if (score > 16) return 'Critical';
    if (score > 9) return 'Elevated';
    return 'Stable';
  }, [queue]);

  const riskFlags = useMemo(() => {
    return queue.filter((patient) => {
      const details = patientDetails[patient.id];
      return details?.allergies && hasAllergyConflict(details.allergies);
    }).length;
  }, [queue, patientDetails]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-primary">Doctor Queue</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase mb-1">In Queue</p>
                <p className="text-3xl font-bold text-primary">{queue.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Total patients</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase mb-1">Emergency</p>
                <p className="text-3xl font-bold text-destructive">
                  {queue.filter((p) => p.priority === 'emergency').length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">High priority</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase mb-1">Next Up</p>
                <p className="text-3xl font-bold text-secondary">
                  {queue.length > 0 ? `#${queue[0].position}` : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {queue.length > 0 ? `${queue[0].patientName}` : 'No patients'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase mb-1">Wait Time</p>
                <p className="text-3xl font-bold text-amber-600">
                  {queue.length > 0 ? `${Math.floor(Math.random() * 15) + 5}` : '0'} min
                </p>
                <p className="text-xs text-muted-foreground mt-1">Average for next</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-8">
          <Card className="border-secondary/20 lg:col-span-2 bg-gradient-to-br from-secondary/5 to-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Clinical Focus Panel</CardTitle>
              <CardDescription>Quick decisions for safer and faster consultations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <p className="text-xs uppercase text-muted-foreground">Triage Load</p>
                  <p className="text-xl font-bold text-destructive mt-1">{triageLoad}</p>
                </div>
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="text-xs uppercase text-muted-foreground">Risk Flags</p>
                  <p className="text-xl font-bold text-amber-700 mt-1">{riskFlags}</p>
                </div>
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                  <p className="text-xs uppercase text-muted-foreground">Consulting Now</p>
                  <p className="text-xl font-bold text-blue-700 mt-1">
                    {queue.filter((p) => p.status === 'in-consultation').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle className="text-lg">Safety Checklist</CardTitle>
              <CardDescription>Use before prescribing or discharging</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="rounded-md border border-secondary/20 bg-secondary/5 p-2">Confirm allergy history</div>
              <div className="rounded-md border border-secondary/20 bg-secondary/5 p-2">Verify chronic conditions</div>
              <div className="rounded-md border border-secondary/20 bg-secondary/5 p-2">Check latest vitals and notes</div>
              <div className="rounded-md border border-secondary/20 bg-secondary/5 p-2">Set follow-up or discharge plan</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-destructive/20 bg-destructive/5 mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              Emergency Coordination Link
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
                  <Button variant="outline" onClick={() => router.push('/doctor/emergency-response')}>
                    Open Command Center
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No pending emergency alert acknowledgement for hospital team.</p>
            )}
          </CardContent>
        </Card>

        {/* Queue List */}
        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-secondary" />
              Patient Queue
            </CardTitle>
            <CardDescription>Click patient cards to view health summary and start consultation</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading queue...</div>
            ) : queue.length === 0 ? (
              <Empty>
                <EmptyMedia variant="icon">
                  <Users className="size-6" />
                </EmptyMedia>
                <EmptyTitle>No Patients in Queue</EmptyTitle>
                <EmptyDescription>All caught up! No patients waiting at the moment.</EmptyDescription>
              </Empty>
            ) : (
              <div className="space-y-3">
                {queue.map((patient, index) => {
                  const details = patientDetails[patient.id];
                  const hasAllergies = details && hasAllergyConflict(details.allergies || '');

                  return (
                    <div
                      key={patient.id}
                      className={`rounded-lg border transition-all ${
                        expandedPatient === patient.id
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-secondary/20 hover:border-secondary/40'
                      }`}
                    >
                      {/* Main Patient Card */}
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedPatient(expandedPatient === patient.id ? null : patient.id)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Position Badge */}
                          <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                            <span className="text-lg font-bold text-primary">{patient.position}</span>
                          </div>

                          {/* Patient Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-foreground text-lg">{patient.patientName}</p>
                              {hasAllergies && (
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              ID: {patient.patientId}
                              {details?.bloodType && details.bloodType !== 'Unknown' && (
                                <span className="ml-2">• Blood: {details.bloodType}</span>
                              )}
                            </p>
                          </div>

                          {/* Priority & Status */}
                          <div className="flex gap-2 items-center">
                            <Badge className={getPriorityColor(patient.priority)}>
                              {patient.priority}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(patient.status)}>
                              {patient.status === 'in-consultation' ? 'Consulting' : 'Waiting'}
                            </Badge>
                          </div>

                          {/* Expand Indicator */}
                          <ChevronDown
                            className={`w-5 h-5 text-muted-foreground transition-transform ${
                              expandedPatient === patient.id ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Expanded Medical Summary */}
                      {expandedPatient === patient.id && details && (
                        <div className="border-t border-secondary/10 p-4 bg-secondary/5 space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Health Alert Section */}
                            {hasAllergies && (
                              <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <div className="flex gap-2">
                                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-semibold text-amber-900 text-sm">Allergies</p>
                                    <p className="text-sm text-amber-800">{details.allergies}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Blood Type */}
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Blood Type</p>
                              <p className="font-medium text-foreground text-lg">{details.bloodType || 'Not documented'}</p>
                            </div>

                            {/* Medical History */}
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Medical History</p>
                              <p className="font-medium text-foreground">{details.medicalHistory || 'No history available'}</p>
                            </div>

                            {/* Chronic Conditions */}
                            {details.chronicConditions && details.chronicConditions.length > 0 && (
                              <div className="col-span-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Chronic Conditions</p>
                                <div className="flex flex-wrap gap-2">
                                  {details.chronicConditions.map((condition, idx) => (
                                    <Badge key={idx} variant="secondary">{condition}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2 border-t border-secondary/10">
                            {patient.status === 'waiting' && (
                              <Button
                                className="flex-1 bg-primary hover:bg-primary/90"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await fetch('/api/doctor/queue', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ queueId: patient.id, status: 'in-consultation' }),
                                    credentials: 'include',
                                  });
                                  // Refresh queue
                                  const res = await fetch('/api/doctor/queue', { credentials: 'include' });
                                  if (res.ok) {
                                    const data = await res.json();
                                    setQueue(data.queue);
                                  }
                                }}
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Start Consultation
                              </Button>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="flex-1" onClick={(e) => e.stopPropagation()}>
                                  <FileText className="w-4 h-4 mr-2" />
                                  Patient Notes
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{patient.patientName} - Clinical Notes</DialogTitle>
                                  <DialogDescription>View and manage patient consultation notes</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="bg-secondary/5 p-4 rounded-lg border border-secondary/20 min-h-32">
                                    <p className="text-sm text-muted-foreground">
                                      Notes area - Patient history and previous consultation details will appear here
                                    </p>
                                  </div>
                                  <Button className="w-full">Save Notes</Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
