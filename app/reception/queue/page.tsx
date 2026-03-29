'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, LogOut, BarChart3 } from 'lucide-react';

interface QueueItem {
  id: number;
  position: number;
  patientName: string;
  patientId: string;
  doctorName: string;
  priority: string;
  status: string;
  checkInTime: string;
}

export default function ReceptionQueuePage() {
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const res = await fetch('/api/reception/queue', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setQueues(data.queues);
        }
      } catch (error) {
        console.error('Error fetching queues:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueues();
    const interval = setInterval(fetchQueues, 10000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-primary">Queue</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Total in Queue</p>
              <p className="text-3xl font-bold text-primary">{queues.length}</p>
            </CardContent>
          </Card>
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Emergency Cases</p>
              <p className="text-3xl font-bold text-destructive">
                {queues.filter((q) => q.priority === 'emergency').length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">In Consultation</p>
              <p className="text-3xl font-bold text-secondary">
                {queues.filter((q) => q.status === 'in-consultation').length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-secondary/20">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm mb-1">Waiting</p>
              <p className="text-3xl font-bold text-blue-600">
                {queues.filter((q) => q.status === 'waiting').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Queue List */}
        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle>Hospital Queue Overview</CardTitle>
            <CardDescription>All patients currently in queue across all departments</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading queues...</div>
            ) : queues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No patients in queue</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {queues.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-secondary/20 hover:bg-secondary/5 transition-colors"
                  >
                    {/* Position */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">{item.position}</span>
                    </div>

                    {/* Patient & Doctor Info */}
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{item.patientName}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {item.patientId} • Dr. {item.doctorName}
                      </p>
                    </div>

                    {/* Priority & Status */}
                    <div className="flex gap-2">
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status === 'in-consultation' ? 'In Consultation' : 'Waiting'}
                      </Badge>
                    </div>

                    {/* Check-in Time */}
                    <div className="text-sm text-muted-foreground">
                      {new Date(item.checkInTime).toLocaleTimeString()}
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
