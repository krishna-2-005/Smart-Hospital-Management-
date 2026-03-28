'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, DollarSign, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BillingRecord {
  id: number;
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorName: string;
  serviceType: string;
  amount: number;
  date: string;
  status: string;
  paymentMethod?: string;
}

export default function BillingDashboardPage() {
  const [billings, setBillings] = useState<BillingRecord[]>([]);
  const [filteredBillings, setFilteredBillings] = useState<BillingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [selectedBilling, setSelectedBilling] = useState<BillingRecord | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchBillings = async () => {
      try {
        const res = await fetch('/api/billing', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setBillings(data.billings || []);
        }
      } catch (error) {
        console.error('Error fetching billings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillings();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = billings;

    if (statusFilter) {
      if (statusFilter === 'outstanding') {
        filtered = filtered.filter(b => b.status === 'pending' || b.status === 'payment_requested');
      } else {
        filtered = filtered.filter(b => b.status === statusFilter);
      }
    }

    if (sortBy === 'amount') {
      filtered.sort((a, b) => b.amount - a.amount);
    } else if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    setFilteredBillings(filtered);
  }, [billings, statusFilter, sortBy]);

  const calculateMetrics = () => {
    const total = billings.reduce((sum, b) => sum + b.amount, 0);
    const paid = billings
      .filter(b => b.status === 'paid')
      .reduce((sum, b) => sum + b.amount, 0);
    const pending = billings
      .filter(b => b.status === 'pending' || b.status === 'payment_requested')
      .reduce((sum, b) => sum + b.amount, 0);
    const count = billings.length;
    const paidCount = billings.filter(b => b.status === 'paid').length;

    return { total, paid, pending, count, paidCount };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'payment_requested':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-secondary/10 text-secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const metrics = calculateMetrics();
  const collectionRate = metrics.count > 0 ? ((metrics.paidCount / metrics.count) * 100).toFixed(1) : 0;

  const exportToCSV = () => {
    const headers = ['ID', 'Patient', 'Doctor', 'Service', 'Amount', 'Date', 'Status'];
    const rows = filteredBillings.map(b => [
      b.id,
      b.patientName,
      b.doctorName,
      b.serviceType,
      b.amount,
      b.date,
      b.status,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary">Billing Dashboard</h1>
              <p className="text-xs text-muted-foreground">Revenue tracking and payment management</p>
            </div>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            📥 Export CSV
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-primary">${metrics.total.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-2">{metrics.count} invoices</p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Paid</p>
              <p className="text-3xl font-bold text-green-600">${metrics.paid.toLocaleString()}</p>
              <p className="text-xs text-green-600">{metrics.paidCount} payments received</p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Outstanding</p>
              <p className="text-3xl font-bold text-amber-600">${metrics.pending.toLocaleString()}</p>
              <p className="text-xs text-amber-600">{metrics.count - metrics.paidCount} pending</p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Collection Rate</p>
              <p className="text-3xl font-bold text-secondary">{collectionRate}%</p>
              <p className="text-xs text-muted-foreground">of invoices paid</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle>Filters & Sorting</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="outstanding">Outstanding</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="amount">Amount (Highest)</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('');
                setSortBy('date');
              }}
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>

        {/* Billing Records */}
        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Billing Records
            </CardTitle>
            <CardDescription>
              Showing {filteredBillings.length} of {billings.length} invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading billing data...</div>
            ) : filteredBillings.length === 0 ? (
              <div className="py-12 text-center">
                <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No billing records found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBillings.map((billing) => (
                  <div
                    key={billing.id}
                    onClick={() => setSelectedBilling(billing)}
                    className="rounded-lg border border-secondary/20 p-4 hover:bg-secondary/5 hover:border-secondary/40 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{billing.patientName}</p>
                        <p className="text-sm text-muted-foreground">
                          Dr. {billing.doctorName} • {billing.serviceType}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">${billing.amount}</p>
                        <Badge className={getStatusColor(billing.status)}>
                          <span className="mr-1">{getStatusIcon(billing.status)}</span>
                          {billing.status === 'payment_requested' ? 'Payment Requested' : billing.status.charAt(0).toUpperCase() + billing.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Invoice #{billing.id}</span>
                      <span>{new Date(billing.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status Breakdown */}
        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle>Payment Status Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                <p className="text-sm font-medium text-green-900 mb-2">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {billings.filter(b => b.status === 'paid').length}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  ${billings
                    .filter(b => b.status === 'paid')
                    .reduce((sum, b) => sum + b.amount, 0)
                    .toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                <p className="text-sm font-medium text-yellow-900 mb-2">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {billings.filter(b => b.status === 'pending').length}
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  ${billings
                    .filter(b => b.status === 'pending')
                    .reduce((sum, b) => sum + b.amount, 0)
                    .toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">Payment Requested</p>
                <p className="text-2xl font-bold text-blue-600">
                  {billings.filter(b => b.status === 'payment_requested').length}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  ${billings
                    .filter(b => b.status === 'payment_requested')
                    .reduce((sum, b) => sum + b.amount, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
