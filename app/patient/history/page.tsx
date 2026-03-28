'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock } from 'lucide-react';

interface AppointmentHistory {
  id: number;
  date: string;
  time: string;
  doctorName: string;
  specialization: string;
  reason: string;
  status: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<AppointmentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/patient/appointments', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setHistory((data.appointments || []).filter((item: AppointmentHistory) => item.status !== 'scheduled'));
        }
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-primary">Visit History</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-secondary" />
              Visit History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No completed visits yet. Completed appointments will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="rounded-lg border border-secondary/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">{item.doctorName}</p>
                      <span className="rounded bg-secondary/15 px-2 py-1 text-xs font-semibold text-secondary capitalize">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.specialization}</p>
                    <p className="mt-2 text-sm text-foreground">{item.reason}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(item.date).toLocaleDateString()} at {item.time}
                    </p>
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
