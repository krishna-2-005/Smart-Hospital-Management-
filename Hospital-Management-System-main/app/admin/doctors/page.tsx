'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Stethoscope, Search, X, Download } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Doctor {
  id: number;
  name: string;
  email: string;
  specialization: string;
  licenseNumber: string;
  isAvailable: boolean;
  queueLoad: number;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const router = useRouter();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch('/api/admin/doctors', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setDoctors(data.doctors || []);
        }
      } catch (error) {
        console.error('Error loading doctors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Get unique specializations for filter
  const specializations = useMemo(() => {
    const specs = new Set(doctors.map(d => d.specialization).filter(Boolean));
    return Array.from(specs).sort();
  }, [doctors]);

  // Filter and search logic
  const filteredDoctors = useMemo(() => {
    let filtered = doctors;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(query) ||
        d.email.toLowerCase().includes(query) ||
        d.licenseNumber.toLowerCase().includes(query)
      );
    }

    // Availability filter
    if (availabilityFilter === 'available') {
      filtered = filtered.filter(d => d.isAvailable);
    } else if (availabilityFilter === 'offline') {
      filtered = filtered.filter(d => !d.isAvailable);
    }

    // Specialization filter
    if (specializationFilter !== 'all') {
      filtered = filtered.filter(d => d.specialization === specializationFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'queue':
          return a.queueLoad - b.queueLoad;
        case 'spec':
          return a.specialization.localeCompare(b.specialization);
        default:
          return 0;
      }
    });

    return filtered;
  }, [doctors, searchQuery, availabilityFilter, specializationFilter, sortBy]);

  const handleExport = () => {
    const csv = [
      ['Name', 'Email', 'Specialization', 'License Number', 'Status', 'Queue Load'],
      ...filteredDoctors.map(d => [
        d.name,
        d.email,
        d.specialization,
        d.licenseNumber,
        d.isAvailable ? 'On Duty' : 'Offline',
        d.queueLoad.toString()
      ])
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doctors_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const hasActiveFilters = searchQuery || availabilityFilter !== 'all' || specializationFilter !== 'all';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <h1 className="text-2xl font-bold text-primary">Doctor Management</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card className="border-secondary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-secondary" />
                Active Doctors ({filteredDoctors.length})
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
                  placeholder="Search by name, email, or license..."
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
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Doctors</SelectItem>
                    <SelectItem value="available">On Duty</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specializations</SelectItem>
                    {specializations.map(spec => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="queue">Queue Load (Low First)</SelectItem>
                    <SelectItem value="spec">Specialization</SelectItem>
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
                  {availabilityFilter !== 'all' && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setAvailabilityFilter('all')}>
                      {availabilityFilter === 'available' ? 'On Duty' : 'Offline'} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  )}
                  {specializationFilter !== 'all' && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setSpecializationFilter('all')}>
                      {specializationFilter} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setAvailabilityFilter('all');
                      setSpecializationFilter('all');
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>

            {/* Doctor List */}
            {isLoading ? (
              <div className="py-10 text-center text-muted-foreground">Loading doctors...</div>
            ) : filteredDoctors.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                {doctors.length === 0 ? 'No doctors found.' : 'No doctors match your filters.'}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredDoctors.map((doctor) => (
                  <div key={doctor.id} className="rounded-lg border border-secondary/20 p-4 hover:border-secondary/40 transition-colors">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{doctor.name}</p>
                        <p className="text-sm text-muted-foreground">{doctor.email}</p>
                      </div>
                      <Badge className={doctor.isAvailable ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}>
                        {doctor.isAvailable ? 'On Duty' : 'Offline'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm border-t border-secondary/10 pt-3">
                      <div>
                        <p className="text-muted-foreground text-xs">Specialization</p>
                        <p className="font-medium text-foreground">{doctor.specialization}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">License</p>
                        <p className="font-medium text-foreground">{doctor.licenseNumber}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Queue Load</p>
                        <p className={`font-medium ${doctor.queueLoad > 5 ? 'text-amber-600' : 'text-secondary'}`}>
                          {doctor.queueLoad} patients
                        </p>
                      </div>
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
