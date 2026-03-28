'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertCircle, ArrowLeft } from 'lucide-react';

interface QueueStatus {
  queuePosition: number | null;
  status: string;
  doctorName: string;
  specialization: string;
  estimatedWaitTime: number;
  priority: string;
  checkInTime: string;
}

export default function QueuePage() {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const router = useRouter();

  useEffect(() => {
    const fetchQueueStatus = async () => {
      try {
        const res = await fetch('/api/patient/queue-status', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setQueueStatus(data);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error('Error fetching queue status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return 'bg-destructive/20 text-destructive';
      case 'high':
        return 'bg-amber-500/20 text-amber-700';
      case 'normal':
        return 'bg-secondary/20 text-secondary';
      case 'low':
        return 'bg-blue-500/20 text-blue-700';
      default:
        return 'bg-muted/20 text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-blue-500/20 text-blue-700';
      case 'in-consultation':
        return 'bg-secondary/20 text-secondary';
      case 'completed':
        return 'bg-green-500/20 text-green-700';
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
          <h1 className="text-2xl font-bold text-primary">Queue Status</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">Loading queue information...</div>
        ) : queueStatus && queueStatus.queuePosition !== null ? (
          <div className="space-y-6">
            {/* Main Queue Card */}
            <Card className="border-secondary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-secondary" />
                  Your Current Position
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Position Display */}
                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-12 text-center border border-primary/20">
                  <p className="text-muted-foreground mb-2 text-sm">Position in Queue</p>
                  <p className="text-7xl font-bold text-primary mb-4">{queueStatus.queuePosition}</p>
                  <div className="flex items-center justify-center gap-4 text-lg font-semibold">
                    <span className="text-foreground">Estimated wait:</span>
                    <span className="text-secondary">{queueStatus.estimatedWaitTime} minutes</span>
                  </div>
                </div>

                {/* Doctor Information */}
                <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-secondary/10">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Consulting Doctor</p>
                    <h3 className="text-xl font-bold text-foreground mb-1">{queueStatus.doctorName}</h3>
                    <p className="text-sm text-muted-foreground">{queueStatus.specialization}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Priority Level</p>
                    <div className="flex gap-2 items-center">
                      <span className={`text-sm font-semibold px-3 py-1 rounded capitalize ${getPriorityColor(queueStatus.priority)}`}>
                        {queueStatus.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-secondary/10">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Current Status</p>
                    <span className={`text-sm font-semibold px-3 py-1 rounded capitalize inline-block ${getStatusColor(queueStatus.status)}`}>
                      {queueStatus.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Check-in Time</p>
                    <p className="font-semibold text-foreground">
                      {new Date(queueStatus.checkInTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="border-secondary/20 bg-secondary/5">
              <CardHeader>
                <CardTitle className="text-base">Waiting Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Keep this page open to see live updates</li>
                  <li>• Estimated wait times may vary</li>
                  <li>• Stay near the reception during your turn</li>
                  <li>• The page refreshes every 5 seconds</li>
                </ul>
              </CardContent>
            </Card>

            {/* Last Updated */}
            <div className="text-center text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <Card className="border-secondary/20">
            <CardContent className="pt-8">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>You are not currently in any queue. Check in with reception to join a queue.</AlertDescription>
              </Alert>
              <Button className="w-full mt-6 bg-primary hover:bg-primary/90" onClick={() => router.push('/patient/dashboard')}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
