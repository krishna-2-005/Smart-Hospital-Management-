'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, AlertTriangle, Clock3, Download, FileText, ShieldAlert, X } from 'lucide-react';
import { exportToCSV, exportToHTML, getReportTitle, formatDate } from '@/lib/export-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EmergencyCase {
  id: number;
  patientName: string;
  patientId: string;
  severity: string;
  description: string;
  status: string;
  assignedDoctorId: number | null;
  assignedDoctor: string;
  assignmentAuditTrail: {
    time: string;
    actorLabel: string;
    previousDoctorName: string;
    newDoctorName: string;
    note: string;
  }[];
  createdAt: string;
}

interface DoctorOption {
  id: number;
  name: string;
  specialization: string;
  isAvailable: boolean;
}

export default function EmergencyPage() {
  const [cases, setCases] = useState<EmergencyCase[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedCaseId, setExpandedCaseId] = useState<number | null>(null);
  const [updatingCaseId, setUpdatingCaseId] = useState<number | null>(null);
  const [overrideByCase, setOverrideByCase] = useState<Record<number, boolean>>({});
  const [assignmentErrors, setAssignmentErrors] = useState<Record<number, string>>({});
  const router = useRouter();

  const fetchCases = async () => {
    try {
      const res = await fetch('/api/admin/emergency', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases || []);
      }
    } catch (error) {
      console.error('Error loading emergency cases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/admin/doctors', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDoctors(data.doctors || []);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  useEffect(() => {
    fetchCases();
    fetchDoctors();
    const interval = setInterval(fetchCases, 15000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (caseId: number, status: string) => {
    setUpdatingCaseId(caseId);
    try {
      await fetch('/api/admin/emergency', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ caseId, status }),
      });
      fetchCases();
    } finally {
      setUpdatingCaseId(null);
    }
  };

  const updateAssignment = async (caseId: number, assignedDoctorId: number | null, forceOverride = false) => {
    setUpdatingCaseId(caseId);
    try {
      const response = await fetch('/api/admin/emergency', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ caseId, assignedDoctorId, forceOverride }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setAssignmentErrors((prev) => ({
          ...prev,
          [caseId]: payload?.error || 'Unable to update assignment right now.',
        }));
        return;
      }

      setAssignmentErrors((prev) => {
        const next = { ...prev };
        delete next[caseId];
        return next;
      });
      fetchCases();
    } finally {
      setUpdatingCaseId(null);
    }
  };

  const isGuardedCase = (item: EmergencyCase) => item.severity === 'critical' && item.status === 'pending';

  const getAssignableDoctors = (item: EmergencyCase) => {
    const overrideEnabled = Boolean(overrideByCase[item.id]);
    if (!isGuardedCase(item) || overrideEnabled) {
      return doctors;
    }
    return doctors.filter((doctor) => doctor.isAvailable || doctor.id === item.assignedDoctorId);
  };

  // Filter cases
  const filteredCases = cases.filter(c => {
    if (severityFilter !== 'all' && c.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  // Get unique values for filters
  const severities = Array.from(new Set(cases.map(c => c.severity)));
  const statuses = Array.from(new Set(cases.map(c => c.status)));

  const severityClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-destructive text-destructive-foreground';
      case 'high':
        return 'bg-amber-500 text-white';
      case 'moderate':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const statusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getElapsedMinutes = (createdAt: string) => {
    const started = new Date(createdAt).getTime();
    const now = Date.now();
    return Math.max(1, Math.floor((now - started) / 60000));
  };

  const getProgressPercent = (status: string) => {
    switch (status) {
      case 'pending':
        return 25;
      case 'in-progress':
        return 65;
      case 'resolved':
        return 100;
      default:
        return 0;
    }
  };

  const getRecommendedAction = (item: EmergencyCase) => {
    const elapsed = getElapsedMinutes(item.createdAt);
    if (item.status === 'resolved') return 'Case closed. Prepare post-incident review.';
    if (item.severity === 'critical' || elapsed > 20) return 'Escalate to rapid response and confirm ICU readiness.';
    if (item.status === 'pending') return 'Start triage immediately and assign available emergency doctor.';
    return 'Monitor treatment progress and update family communication channel.';
  };

  const handleExportCSV = () => {
    const exportData = filteredCases.map(c => ({
      'Case ID': c.id,
      'Patient': c.patientName,
      'Patient ID': c.patientId,
      'Severity': c.severity,
      'Status': c.status,
      'Description': c.description,
      'Assigned Doctor': c.assignedDoctor,
      'Reported': formatDate(c.createdAt)
    }));

    exportToCSV(exportData, `emergency-cases-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportHTML = () => {
    const title = getReportTitle('Emergency Cases Report');
    const summary = `
      <div class="summary">
        <h2>Report Summary</h2>
        <div class="summary-item">
          <div class="summary-label">Total Cases</div>
          <div class="summary-value">${filteredCases.length}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Critical</div>
          <div class="summary-value">${filteredCases.filter(c => c.severity === 'critical').length}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">High Priority</div>
          <div class="summary-value">${filteredCases.filter(c => c.severity === 'high').length}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Resolved</div>
          <div class="summary-value">${filteredCases.filter(c => c.status === 'resolved').length}</div>
        </div>
      </div>
    `;

    const tableHTML = `
      <h1>${title}</h1>
      ${summary}
      <h2>Cases Details</h2>
      <table>
        <thead>
          <tr>
            <th>Case ID</th>
            <th>Patient</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Description</th>
            <th>Doctor</th>
            <th>Reported</th>
          </tr>
        </thead>
        <tbody>
          ${filteredCases.map(c => `
            <tr>
              <td>${c.id}</td>
              <td>${c.patientName} (${c.patientId})</td>
              <td>${c.severity}</td>
              <td>${c.status}</td>
              <td>${c.description}</td>
              <td>${c.assignedDoctor}</td>
              <td>${formatDate(c.createdAt)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    exportToHTML(tableHTML, 'Emergency Cases Report');
  };

  const hasActiveFilters = severityFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">Emergency Cases</h1>
            <p className="text-xs text-muted-foreground">Critical incident management</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card className="border-secondary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Active Emergency Cases ({filteredCases.length})
                </CardTitle>
                <CardDescription>Manage and track emergency incidents</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportHTML}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-amber-300/40 bg-amber-50/60 px-3 py-2">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-amber-700">{cases.filter(c => c.status === 'pending').length}</p>
              </div>
              <div className="rounded-lg border border-blue-300/40 bg-blue-50/60 px-3 py-2">
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-xl font-bold text-blue-700">{cases.filter(c => c.status === 'in-progress').length}</p>
              </div>
              <div className="rounded-lg border border-green-300/40 bg-green-50/60 px-3 py-2">
                <p className="text-xs text-muted-foreground">Resolved</p>
                <p className="text-xl font-bold text-green-700">{cases.filter(c => c.status === 'resolved').length}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filters */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    {severities.map(s => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {statuses.map(s => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {severityFilter !== 'all' && (
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer" 
                      onClick={() => setSeverityFilter('all')}
                    >
                      Severity: {severityFilter} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  )}
                  {statusFilter !== 'all' && (
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer" 
                      onClick={() => setStatusFilter('all')}
                    >
                      Status: {statusFilter} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSeverityFilter('all');
                      setStatusFilter('all');
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>

            {/* Cases List */}
            {isLoading ? (
              <div className="py-10 text-center text-muted-foreground">Loading emergency cases...</div>
            ) : filteredCases.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                {cases.length === 0 ? 'No emergency cases currently.' : 'No cases match your filters.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCases.map((item) => (
                  <div key={item.id} className="rounded-lg border border-secondary/20 p-4 hover:border-secondary/40 transition-colors">
                    {(() => {
                      const guarded = isGuardedCase(item);
                      const overrideEnabled = Boolean(overrideByCase[item.id]);
                      const assignableDoctors = getAssignableDoctors(item);

                      return (
                        <>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">{item.patientName}</p>
                        <p className="text-sm text-muted-foreground">{item.patientId} | Case #{item.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={severityClass(item.severity)}>
                          {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
                        </Badge>
                        <Badge variant="outline" className={`capitalize ${statusClass(item.status)}`}>{item.status.replace('-', ' ')}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      <strong>Assigned:</strong> {item.assignedDoctor} | <strong>Reported:</strong> {formatDate(item.createdAt)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Select
                        value={item.assignedDoctorId ? String(item.assignedDoctorId) : 'unassigned'}
                        onValueChange={(value) =>
                          updateAssignment(
                            item.id,
                            value === 'unassigned' ? null : Number(value),
                            overrideEnabled
                          )
                        }
                        disabled={updatingCaseId === item.id}
                      >
                        <SelectTrigger className="w-56">
                          <SelectValue placeholder="Assign doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {assignableDoctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={String(doctor.id)}>
                              {doctor.name} ({doctor.specialization}){doctor.isAvailable ? '' : ' - Busy'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {guarded && (
                        <Button
                          size="sm"
                          variant={overrideEnabled ? 'default' : 'outline'}
                          onClick={() =>
                            setOverrideByCase((prev) => ({
                              ...prev,
                              [item.id]: !overrideEnabled,
                            }))
                          }
                          disabled={updatingCaseId === item.id}
                        >
                          {overrideEnabled ? 'Override Enabled' : 'Enable Override'}
                        </Button>
                      )}

                      <Select
                        value={item.status}
                        onValueChange={(value) => updateStatus(item.id, value)}
                        disabled={updatingCaseId === item.id}
                      >
                        <SelectTrigger className="w-44">
                          <SelectValue placeholder="Update status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending Triage</SelectItem>
                          <SelectItem value="in-progress">Treatment In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved & Closed</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedCaseId(expandedCaseId === item.id ? null : item.id)}
                      >
                        {expandedCaseId === item.id ? 'Hide Live Tracker' : 'Open Live Tracker'}
                      </Button>

                      <Badge variant="outline" className="bg-secondary/5">
                        <Clock3 className="w-3 h-3 mr-1" />
                        {getElapsedMinutes(item.createdAt)} min active
                      </Badge>
                    </div>

                    {guarded && !overrideEnabled && (
                      <p className="mb-3 text-xs text-amber-700">
                        Guard active: only available doctors are shown for pending critical assignments.
                      </p>
                    )}

                    {assignmentErrors[item.id] && (
                      <p className="mb-3 text-xs text-destructive">{assignmentErrors[item.id]}</p>
                    )}

                    {expandedCaseId === item.id && (
                      <div className="rounded-md border border-secondary/20 bg-secondary/5 p-3 space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Live Case Progress</span>
                            <span className="font-semibold text-foreground">{getProgressPercent(item.status)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-secondary/20">
                            <div className="h-2 rounded-full bg-secondary transition-all" style={{ width: `${getProgressPercent(item.status)}%` }} />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="rounded-md border border-secondary/20 bg-background p-2">
                            <p className="text-xs text-muted-foreground uppercase mb-1">Current Status</p>
                            <p className="font-semibold capitalize">{item.status.replace('-', ' ')}</p>
                          </div>
                          <div className="rounded-md border border-secondary/20 bg-background p-2">
                            <p className="text-xs text-muted-foreground uppercase mb-1">Realtime Recommendation</p>
                            <p className="font-semibold text-foreground">{getRecommendedAction(item)}</p>
                          </div>
                        </div>

                        <div className="rounded-md border border-secondary/20 bg-background p-3 text-sm">
                          <p className="text-xs text-muted-foreground uppercase mb-2 flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Incident Status Timeline
                          </p>
                          <div className="space-y-1 text-muted-foreground">
                            <p>1. Reported at {formatDate(item.createdAt)}</p>
                            {(item.status === 'in-progress' || item.status === 'resolved') && (
                              <p>2. Triage and treatment started</p>
                            )}
                            {item.status === 'resolved' && <p>3. Case resolved and closed</p>}
                            {item.assignmentAuditTrail?.map((event, index) => (
                              <p key={`${event.time}-${index}`}>
                                {index + (item.status === 'resolved' ? 4 : item.status === 'in-progress' ? 3 : 2)}. {formatDate(event.time)} - {event.actorLabel} used override and reassigned from {event.previousDoctorName} to {event.newDoctorName}.
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                        </>
                      );
                    })()}
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
