'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty } from '@/components/ui/empty';
import { Calendar, ArrowLeft } from 'lucide-react';

interface Appointment {
  id: number;
  date: string;
  time: string;
  doctorName: string;
  specialization: string;
  reason: string;
  status: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch('/api/patient/appointments', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setAppointments(data.appointments);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const refreshAppointments = async () => {
    const res = await fetch('/api/patient/appointments', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setAppointments(data.appointments || []);
    }
  };

  const bookAppointment = async () => {
    if (!appointmentDate || !appointmentTime || !reasonForVisit) return;
    setIsBooking(true);
    try {
      const res = await fetch('/api/patient/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          doctorId: 1,
          appointmentDate,
          appointmentTime,
          reasonForVisit,
        }),
      });

      if (res.ok) {
        setAppointmentDate('');
        setAppointmentTime('');
        setReasonForVisit('');
        await refreshAppointments();
      }
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setIsBooking(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-secondary/20 text-secondary';
      case 'completed':
        return 'bg-secondary/20 text-secondary';
      case 'cancelled':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-muted/20 text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-primary">My Appointments</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Card className="mb-6 border-secondary/20">
          <CardHeader>
            <CardTitle>Book New Appointment</CardTitle>
            <CardDescription>Create a new appointment and it will appear below instantly.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} />
            <Input type="time" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} />
            <Button className="bg-primary hover:bg-primary/90" onClick={bookAppointment} disabled={isBooking}>
              {isBooking ? 'Booking...' : 'Book Appointment'}
            </Button>
            <div className="md:col-span-3">
              <Textarea
                rows={3}
                placeholder="Reason for visit"
                value={reasonForVisit}
                onChange={(e) => setReasonForVisit(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" />
              Appointment History
            </CardTitle>
            <CardDescription>View and manage your appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : appointments.length === 0 ? (
              <Empty
                icon={Calendar}
                title="No Appointments"
                description="You haven't booked any appointments yet. Schedule one to get started."
              >
                <Button className="mt-4 bg-primary hover:bg-primary/90" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  Book an Appointment
                </Button>
              </Empty>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-secondary/10">
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((apt) => (
                      <TableRow key={apt.id} className="border-secondary/10">
                        <TableCell className="font-medium">
                          {new Date(apt.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{apt.time}</TableCell>
                        <TableCell>{apt.doctorName}</TableCell>
                        <TableCell className="text-muted-foreground">{apt.specialization}</TableCell>
                        <TableCell className="max-w-xs truncate">{apt.reason}</TableCell>
                        <TableCell>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded capitalize ${getStatusColor(
                              apt.status
                            )}`}
                          >
                            {apt.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
