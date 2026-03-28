'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Search, X, Download } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Patient {
  id: number;
  patientId: string;
  name: string;
  email: string;
  bloodType: string;
  allergies: string;
  lastAppointmentDate: string | null;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('all');
  const [allergiesFilter, setAllergiesFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const router = useRouter();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch('/api/admin/patients', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setPatients(data.patients || []);
        }
      } catch (error) {
        console.error('Error loading patients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Get unique blood types for filter
  const bloodTypes = useMemo(() => {
    const types = new Set(patients.map(p => p.bloodType).filter(Boolean));
    return Array.from(types).sort();
  }, [patients]);

  // Filter and search logic
  const filteredPatients = useMemo(() => {
    let filtered = patients;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.patientId.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query)
      );
    }

    // Blood type filter
    if (bloodTypeFilter !== 'all') {
      filtered = filtered.filter(p => p.bloodType === bloodTypeFilter);
    }

    // Allergies filter
    if (allergiesFilter === 'with-allergies') {
      filtered = filtered.filter(p => p.allergies && p.allergies.toLowerCase() !== 'none');
    } else if (allergiesFilter === 'no-allergies') {
      filtered = filtered.filter(p => !p.allergies || p.allergies.toLowerCase() === 'none');
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return new Date(b.lastAppointmentDate || 0).getTime() - new Date(a.lastAppointmentDate || 0).getTime();
        case 'id':
          return a.patientId.localeCompare(b.patientId);
        default:
          return 0;
      }
    });

    return filtered;
  }, [patients, searchQuery, bloodTypeFilter, allergiesFilter, sortBy]);

  const handleExport = () => {
    const csv = [
      ['ID', 'Name', 'Email', 'Blood Type', 'Allergies', 'Last Appointment'],
      ...filteredPatients.map(p => [
        p.patientId,
        p.name,
        p.email,
        p.bloodType || 'N/A',
        p.allergies || 'None',
        p.lastAppointmentDate ? new Date(p.lastAppointmentDate).toLocaleDateString() : 'No visits'
      ])
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patients_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const hasActiveFilters = searchQuery || bloodTypeFilter !== 'all' || allergiesFilter !== 'all';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-primary">Patient Management</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card className="border-secondary/20 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-secondary" />
                Registered Patients ({filteredPatients.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search and Filters */}
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={bloodTypeFilter} onValueChange={setBloodTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Blood Types</SelectItem>
                    {bloodTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={allergiesFilter} onValueChange={setAllergiesFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by allergies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Patients</SelectItem>
                    <SelectItem value="with-allergies">With Allergies</SelectItem>
                    <SelectItem value="no-allergies">No Allergies</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="recent">Recent Visits</SelectItem>
                    <SelectItem value="id">Patient ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {searchQuery && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchQuery('')}>
                      Search: "{searchQuery}" <X className="w-3 h-3 ml-1" />
                    </Badge>
                  )}
                  {bloodTypeFilter !== 'all' && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setBloodTypeFilter('all')}>
                      Blood: {bloodTypeFilter} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  )}
                  {allergiesFilter !== 'all' && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setAllergiesFilter('all')}>
                      {allergiesFilter === 'with-allergies' ? 'Has Allergies' : 'No Allergies'} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setBloodTypeFilter('all');
                      setAllergiesFilter('all');
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>

            {/* Patient List */}
            {isLoading ? (
              <div className="py-10 text-center text-muted-foreground">Loading patients...</div>
            ) : filteredPatients.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                {patients.length === 0 ? 'No patients found.' : 'No patients match your filters.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPatients.map((patient) => (
                  <div key={patient.id} className="rounded-lg border border-secondary/20 p-4 hover:border-secondary/40 transition-colors">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">{patient.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {patient.bloodType && (
                          <Badge variant="outline">{patient.bloodType}</Badge>
                        )}
                        <p className="text-sm font-medium text-primary whitespace-nowrap">{patient.patientId}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
                      <p>
                        <span className="text-muted-foreground">Allergies:</span>{' '}
                        {patient.allergies && patient.allergies.toLowerCase() !== 'none' ? (
                          <span className="font-medium text-amber-600">{patient.allergies}</span>
                        ) : (
                          <span className="text-muted-foreground">None documented</span>
                        )}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Last Appointment:</span>{' '}
                        {patient.lastAppointmentDate
                          ? new Date(patient.lastAppointmentDate).toLocaleDateString()
                          : 'No visits yet'}
                      </p>
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
