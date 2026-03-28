'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, LogOut, ArrowLeft, Download, Search, X, FileText } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { exportToCSV, exportToHTML, getReportTitle, formatDate } from '@/lib/export-utils';

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
}

export default function BedsPage() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [wardFilter, setWardFilter] = useState('all');
  const [bedTypeFilter, setBedTypeFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const router = useRouter();

  const fetchBeds = async () => {
    try {
      const res = await fetch('/api/admin/beds', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBeds(data.beds);
      }
    } catch (error) {
      console.error('Error fetching beds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBeds();
    const interval = setInterval(fetchBeds, 20000);
    return () => clearInterval(interval);
  }, []);

  // Get unique values for filters
  const wards = useMemo(() => Array.from(new Set(beds.map(b => b.ward))), [beds]);
  const bedTypes = useMemo(() => Array.from(new Set(beds.map(b => b.bedType))), [beds]);

  // Filter beds
  const filteredBeds = useMemo(() => {
    let filtered = beds;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.bedNumber.toLowerCase().includes(query) ||
        b.ward.toLowerCase().includes(query)
      );
    }

    if (wardFilter !== 'all') {
      filtered = filtered.filter(b => b.ward === wardFilter);
    }

    if (bedTypeFilter !== 'all') {
      filtered = filtered.filter(b => b.bedType === bedTypeFilter);
    }

    if (availabilityFilter === 'available') {
      filtered = filtered.filter(b => b.isAvailable);
    } else if (availabilityFilter === 'occupied') {
      filtered = filtered.filter(b => !b.isAvailable);
    }

    return filtered;
  }, [beds, searchQuery, wardFilter, bedTypeFilter, availabilityFilter]);

  const toggleBedAllocation = async (bed: Bed) => {
    const payload = bed.isAvailable
      ? { bedId: bed.id, allocatedToPatientId: 1, isAvailable: false }
      : { bedId: bed.id, allocatedToPatientId: null, isAvailable: true };

    await fetch('/api/admin/beds', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    fetchBeds();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/auth/login');
  };

  const handleExportCSV = () => {
    const exportData = filteredBeds.map(b => ({
      'Bed Number': b.bedNumber,
      'Ward': b.ward,
      'Floor': b.floor,
      'Type': b.bedType,
      'Status': b.isAvailable ? 'Available' : 'Occupied',
      'Patient Name': b.allocatedPatient?.name || 'N/A',
      'Patient ID': b.allocatedPatient?.patientId || 'N/A',
    }));

    exportToCSV(exportData, `beds-status-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportHTML = () => {
    const title = getReportTitle('Hospital Bed Status Report');
    const occupancyRate = Math.round(((beds.length - beds.filter(b => b.isAvailable).length) / beds.length) * 100);
    
    const summary = `
      <div class="summary">
        <h2>Report Summary</h2>
        <div class="summary-item">
          <div class="summary-label">Total Beds</div>
          <div class="summary-value">${filteredBeds.length}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Available</div>
          <div class="summary-value">${filteredBeds.filter(b => b.isAvailable).length}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Occupied</div>
          <div class="summary-value">${filteredBeds.filter(b => !b.isAvailable).length}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Occupancy Rate</div>
          <div class="summary-value">${occupancyRate}%</div>
        </div>
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
          </tr>
        </thead>
        <tbody>
          ${filteredBeds.map(b => `
            <tr>
              <td>${b.bedNumber}</td>
              <td>${b.ward}</td>
              <td>${b.floor}</td>
              <td>${b.bedType}</td>
              <td>${b.isAvailable ? 'Available' : 'Occupied'}</td>
              <td>${b.allocatedPatient ? `${b.allocatedPatient.name} (${b.allocatedPatient.patientId})` : '-'}</td>
            </tr>
          `).join('')}
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

  const occupancyPercentage = beds.length > 0 ? Math.round(((beds.length - beds.filter(b => b.isAvailable).length) / beds.length) * 100) : 0;
  const hasActiveFilters = searchQuery || wardFilter !== 'all' || bedTypeFilter !== 'all' || availabilityFilter !== 'all';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-primary">Bed Management</h1>
              <p className="text-xs text-muted-foreground">Real-time bed allocation and status</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Total Beds</p>
              <p className="text-3xl font-bold text-primary">{beds.length}</p>
            </CardContent>
          </Card>
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Available</p>
              <p className="text-3xl font-bold text-secondary">
                {beds.filter((b) => b.isAvailable).length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Occupied</p>
              <p className="text-3xl font-bold text-destructive">
                {beds.filter((b) => !b.isAvailable).length}
              </p>
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

        {/* Occupancy Progress */}
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

        {/* Beds List */}
        <Card className="border-secondary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Hospital Beds ({filteredBeds.length})</CardTitle>
                <CardDescription>View and manage all hospital beds</CardDescription>
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
            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by bed number or ward..."
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={wardFilter} onValueChange={setWardFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by ward" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Wards</SelectItem>
                    {wards.map(w => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={bedTypeFilter} onValueChange={setBedTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by bed type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {bedTypes.map(t => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available Only</SelectItem>
                    <SelectItem value="occupied">Occupied Only</SelectItem>
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

            {/* Beds Grid */}
            {isLoading ? (
              <div className="text-center py-8">Loading beds...</div>
            ) : filteredBeds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {beds.length === 0 ? 'No beds found.' : 'No beds match your filters.'}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBeds.map((bed) => (
                  <div
                    key={bed.id}
                    className="p-4 rounded-lg border border-secondary/20 hover:border-secondary/40 transition-colors"
                  >
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
                      <div className="p-3 rounded bg-secondary/10 border border-secondary/20 mb-3">
                        <p className="text-xs text-muted-foreground mb-1">Occupied by</p>
                        <p className="font-semibold text-foreground text-sm">
                          {bed.allocatedPatient.name}
                        </p>
                        <p className="text-xs text-muted-foreground">ID: {bed.allocatedPatient.patientId}</p>
                      </div>
                    ) : (
                      <div className="p-3 rounded bg-green-500/10 border border-green-500/20 mb-3">
                        <p className="font-semibold text-green-700 text-sm">Available</p>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-secondary/30"
                      onClick={() => toggleBedAllocation(bed)}
                    >
                      {bed.isAvailable ? 'Allocate' : 'Release'}
                    </Button>
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
