'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, DollarSign, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BillingRecord {
  id: number;
  appointmentId: number;
  patientName: string;
  doctorName: string;
  serviceType: string;
  amount: number;
  date: string;
  status: string;
  paymentMethod?: string;
}

export default function PatientBillingPage() {
  const [billings, setBillings] = useState<BillingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState<BillingRecord | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('credit_card');
  const [successMessage, setSuccessMessage] = useState('');
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

  const handleRequestPayment = async () => {
    if (!selectedBilling) return;

    try {
      const res = await fetch('/api/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          billingId: selectedBilling.id,
          status: 'payment_requested',
          paymentMethod: selectedPaymentMethod,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPendingBillings(billings.map(b => (b.id === data.id ? data : b)));
        setSuccessMessage('Payment request sent! We will process it shortly.');
        setIsPaymentDialogOpen(false);
        setSelectedBilling(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error requesting payment:', error);
    }
  };

  const setPendingBillings = (updated: BillingRecord[]) => {
    setBillings(updated);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
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
        return <AlertCircle className="w-4 h-4" />;
      case 'payment_requested':
        return <Clock className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const calculateTotals = () => {
    const total = billings.reduce((sum, b) => sum + b.amount, 0);
    const paid = billings
      .filter(b => b.status === 'paid')
      .reduce((sum, b) => sum + b.amount, 0);
    const pending = billings
      .filter(b => b.status === 'pending' || b.status === 'payment_requested')
      .reduce((sum, b) => sum + b.amount, 0);

    return { total, paid, pending };
  };

  const totals = calculateTotals();
  const paidCount = billings.filter(b => b.status === 'paid').length;
  const pendingCount = billings.filter(b => b.status !== 'paid').length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">My Invoices</h1>
            <p className="text-xs text-muted-foreground">View and manage your medical bills</p>
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

        {/* Financial Summary */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Total Amount Due</p>
              <p className="text-3xl font-bold text-primary">${totals.total.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-2">{billings.length} invoices</p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Amount Paid</p>
              <p className="text-3xl font-bold text-green-600">${totals.paid.toLocaleString()}</p>
              <p className="text-xs text-green-600">{paidCount} paid</p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Still Owed</p>
              <p className="text-3xl font-bold text-amber-600">${totals.pending.toLocaleString()}</p>
              <p className="text-xs text-amber-600">{pendingCount} unpaid</p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices List */}
        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Your Invoices
            </CardTitle>
            <CardDescription>Click any invoice to view details and make payment</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading invoices...</div>
            ) : billings.length === 0 ? (
              <div className="py-12 text-center">
                <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No invoices on file</p>
              </div>
            ) : (
              <div className="space-y-3">
                {billings.map((billing) => (
                  <div
                    key={billing.id}
                    onClick={() => setSelectedBilling(billing)}
                    className="rounded-lg border border-secondary/20 p-4 hover:bg-secondary/5 hover:border-secondary/40 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{billing.serviceType}</p>
                        <p className="text-sm text-muted-foreground">
                          Dr. {billing.doctorName} • Date: {new Date(billing.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">${billing.amount}</p>
                        <Badge className={getStatusColor(billing.status)}>
                          <span className="mr-1">{getStatusIcon(billing.status)}</span>
                          {billing.status === 'payment_requested' ? 'Processing' : billing.status.charAt(0).toUpperCase() + billing.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Invoice #{billing.id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Invoice Detail Dialog */}
      {selectedBilling && (
        <Dialog open={!!selectedBilling} onOpenChange={() => setSelectedBilling(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Invoice #{selectedBilling.id}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-secondary/5 rounded-lg p-4 space-y-3 border border-secondary/20">
                <div className="flex justify-between">
                  <p className="text-muted-foreground">Service:</p>
                  <p className="font-medium">{selectedBilling.serviceType}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-muted-foreground">Provided By:</p>
                  <p className="font-medium">Dr. {selectedBilling.doctorName}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-muted-foreground">Date:</p>
                  <p className="font-medium">{new Date(selectedBilling.date).toLocaleDateString()}</p>
                </div>
                <div className="border-t border-secondary/20 pt-3 mt-3 flex justify-between items-baseline">
                  <p className="text-muted-foreground">Amount:</p>
                  <p className="text-2xl font-bold text-primary">${selectedBilling.amount}</p>
                </div>
              </div>

              <div className="bg-secondary/5 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Status</p>
                <Badge className={getStatusColor(selectedBilling.status)}>
                  <span className="mr-1">{getStatusIcon(selectedBilling.status)}</span>
                  {selectedBilling.status === 'payment_requested' 
                    ? 'Payment Processing' 
                    : selectedBilling.status.charAt(0).toUpperCase() + selectedBilling.status.slice(1)}
                </Badge>
              </div>

              <div className="flex gap-2 pt-4 border-t border-secondary/20">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedBilling(null)}>
                  Close
                </Button>
                {selectedBilling.status === 'pending' && (
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={() => {
                      setIsPaymentDialogOpen(true);
                    }}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pay Now
                  </Button>
                )}
              </div>
            </div>

            {/* Payment Method Selection Dialog */}
            {isPaymentDialogOpen && (
              <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Select Payment Method</DialogTitle>
                    <DialogDescription>
                      Choose how you would like to pay this invoice
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="debit_card">Debit Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="insurance">Insurance Claim</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={handleRequestPayment}
                    >
                      Request Payment Processing
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
