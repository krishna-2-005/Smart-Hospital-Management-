'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, AlertTriangle, Download, FileText, Filter, X } from 'lucide-react';
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
  assignedDoctor: string;
  createdAt: string;
}

export default function EmergencyPage() {
  const [cases, setCases] = useState<EmergencyCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
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

  useEffect(() => {
    fetchCases();
  }, []);

  const updateStatus = async (caseId: number, status: string) => {
    await fetch('/api/admin/emergency', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ caseId, status }),
    });
    fetchCases();
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
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">{item.patientName}</p>
                        <p className="text-sm text-muted-foreground">{item.patientId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={severityClass(item.severity)}>
                          {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
                        </Badge>
                        <Badge variant="outline" className="capitalize">{item.status}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      <strong>Assigned:</strong> {item.assignedDoctor} | <strong>Reported:</strong> {formatDate(item.createdAt)}
                    </p>
                    <div className="flex gap-2">
                      {item.status !== 'resolved' && (
                        <>
                          {item.status !== 'in-progress' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => updateStatus(item.id, 'in-progress')}
                            >
                              Mark In Progress
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            onClick={() => updateStatus(item.id, 'resolved')}
                          >
                            Mark Resolved
                          </Button>
                        </>
                      )}
                      {item.status === 'resolved' && (
                        <Badge variant="outline" className="bg-green-50">Resolved</Badge>
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
