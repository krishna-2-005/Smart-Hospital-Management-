'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Bell, Building2, Clock, MapPin, Navigation, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type EmergencyType = 'accident' | 'cardiac' | 'stroke' | 'breathing' | 'trauma' | 'other';

interface EmergencyStatusResponse {
  id: number;
  status: string;
  emergencyType: EmergencyType;
  conditionSummary: string;
  requestedAt: string;
  etaMinutes: number;
  patient: {
    name: string;
    patientId: string;
    age: number | null;
  };
  ambulance: {
    vehicleCode: string;
    driverName: string;
    driverPhone: string;
    lat: number;
    lng: number;
  } | null;
  route: {
    pickup: { lat: number; lng: number };
    distanceKm: number;
    optimized: boolean;
  };
  hospital: {
    id: number;
    name: string;
    distanceKm: number;
    score: number;
    requiredBedType: 'icu' | 'general';
    hasOxygenSupport: boolean;
  } | null;
  timeline: Array<{ status: string; message: string; time: string }>;
  notifications: Array<{ target: string; message: string; time: string }>;
}

const EMERGENCY_OPTIONS: Array<{ value: EmergencyType; label: string }> = [
  { value: 'accident', label: 'Accident / Road Trauma' },
  { value: 'cardiac', label: 'Cardiac / Chest Pain' },
  { value: 'stroke', label: 'Stroke Symptoms' },
  { value: 'breathing', label: 'Breathing Distress' },
  { value: 'trauma', label: 'Physical Trauma' },
  { value: 'other', label: 'Other Emergency' },
];

export default function PatientEmergencyPage() {
  const router = useRouter();
  const [emergencyType, setEmergencyType] = useState<EmergencyType>('accident');
  const [conditionSummary, setConditionSummary] = useState('');
  const [lat, setLat] = useState('28.6139');
  const [lng, setLng] = useState('77.2090');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<EmergencyStatusResponse | null>(null);
  const [error, setError] = useState('');

  const loadStatus = async () => {
    try {
      const res = await fetch('/api/patient/emergency/status', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRequestStatus(data.status || null);
      }
    } catch (loadError) {
      setError('Unable to fetch emergency status right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Location is not available in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
        setError('');
      },
      () => {
        setError('Could not read GPS. Enter location manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleEmergencyRequest = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/patient/emergency/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          emergencyType,
          conditionSummary,
          lat: Number(lat),
          lng: Number(lng),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Emergency request failed');
      }

      await loadStatus();
    } catch (submitError: any) {
      setError(submitError?.message || 'Could not send emergency request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeline = useMemo(() => requestStatus?.timeline || [], [requestStatus]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">Smart Emergency Response</h1>
            <p className="text-xs text-muted-foreground">Real-time ambulance to hospital coordination</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              USP: Hospital Prepared Before Arrival
            </CardTitle>
            <CardDescription>
              We do not just send ambulances. We notify and prepare the hospital with patient condition and ETA before arrival.
            </CardDescription>
          </CardHeader>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">Loading emergency panel...</CardContent>
          </Card>
        ) : !requestStatus || requestStatus.status === 'arrived' ? (
          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle>1-Click Emergency Request</CardTitle>
              <CardDescription>
                Send request with emergency type, condition, and location to assign nearest ambulance instantly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Emergency Type</p>
                  <Select value={emergencyType} onValueChange={(value) => setEmergencyType(value as EmergencyType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose emergency type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMERGENCY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Live Location (GPS)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={lat} onChange={(event) => setLat(event.target.value)} placeholder="Latitude" />
                    <Input value={lng} onChange={(event) => setLng(event.target.value)} placeholder="Longitude" />
                  </div>
                  <Button type="button" variant="outline" onClick={useCurrentLocation} className="w-full">
                    <MapPin className="w-4 h-4 mr-2" />
                    Use Current Location
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Condition Summary</p>
                <Textarea
                  value={conditionSummary}
                  onChange={(event) => setConditionSummary(event.target.value)}
                  placeholder="Example: severe chest pain with sweating and shortness of breath"
                  rows={4}
                />
              </div>

              <Button
                disabled={isSubmitting || conditionSummary.trim().length < 6}
                onClick={handleEmergencyRequest}
                className="w-full bg-destructive hover:bg-destructive/90"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Dispatching Ambulance...' : 'Emergency: Dispatch Now'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-secondary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Current Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="capitalize">{requestStatus.status.replace('-', ' ')}</Badge>
                </CardContent>
              </Card>
              <Card className="border-secondary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">ETA</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold text-secondary flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {requestStatus.etaMinutes} min
                </CardContent>
              </Card>
              <Card className="border-secondary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Emergency Type</CardTitle>
                </CardHeader>
                <CardContent className="text-lg font-semibold capitalize">
                  {requestStatus.emergencyType}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-secondary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-secondary" />
                    Live Ambulance Tracking
                  </CardTitle>
                  <CardDescription>Uber-like tracking with dynamic coordinates and ETA</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Route optimized: {requestStatus.route.optimized ? 'Yes, fastest path selected' : 'No'}
                  </p>
                  <p className="text-sm">Distance: {requestStatus.route.distanceKm.toFixed(2)} km</p>
                  {requestStatus.ambulance && (
                    <div className="rounded-md border border-secondary/20 p-3 text-sm space-y-1">
                      <p><span className="font-semibold">Vehicle:</span> {requestStatus.ambulance.vehicleCode}</p>
                      <p><span className="font-semibold">Driver:</span> {requestStatus.ambulance.driverName}</p>
                      <p><span className="font-semibold">Contact:</span> {requestStatus.ambulance.driverPhone}</p>
                      <p><span className="font-semibold">Live GPS:</span> {requestStatus.ambulance.lat}, {requestStatus.ambulance.lng}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-secondary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Smart Hospital Selection
                  </CardTitle>
                  <CardDescription>Selection based on distance, bed availability, and emergency type</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {requestStatus.hospital ? (
                    <>
                      <p><span className="font-semibold">Hospital:</span> {requestStatus.hospital.name}</p>
                      <p><span className="font-semibold">Distance:</span> {requestStatus.hospital.distanceKm} km</p>
                      <p><span className="font-semibold">Selection Score:</span> {requestStatus.hospital.score}</p>
                      <p>
                        <span className="font-semibold">Prepared Bed:</span> {requestStatus.hospital.requiredBedType.toUpperCase()}
                      </p>
                      <p>
                        <span className="font-semibold">Oxygen Support:</span> {requestStatus.hospital.hasOxygenSupport ? 'Available' : 'Limited'}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Hospital assignment in progress.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border-secondary/20">
              <CardHeader>
                <CardTitle>Advance Patient Data Sharing</CardTitle>
                <CardDescription>
                  Hospital has your case summary, emergency type, and ETA so emergency staff are ready before arrival.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 md:grid-cols-2 text-sm">
                <p><span className="font-semibold">Patient:</span> {requestStatus.patient.name} ({requestStatus.patient.patientId})</p>
                <p><span className="font-semibold">Age:</span> {requestStatus.patient.age ?? 'NA'}</p>
                <p><span className="font-semibold">Condition:</span> {requestStatus.conditionSummary}</p>
                <p><span className="font-semibold">ETA shared:</span> {requestStatus.etaMinutes} min</p>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-secondary/20">
                <CardHeader>
                  <CardTitle>Response Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {timeline.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Timeline will appear after dispatch.</p>
                  ) : (
                    timeline.map((event, index) => (
                      <div key={`${event.time}-${index}`} className="rounded-md border border-secondary/10 p-3">
                        <p className="text-sm font-semibold capitalize">{event.status.replace('-', ' ')}</p>
                        <p className="text-sm text-muted-foreground">{event.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(event.time).toLocaleTimeString()}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-secondary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Real-Time Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {requestStatus.notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No alerts yet.</p>
                  ) : (
                    requestStatus.notifications
                      .slice()
                      .reverse()
                      .map((alert, index) => (
                        <div key={`${alert.time}-${index}`} className="rounded-md border border-secondary/10 p-3">
                          <p className="text-sm font-semibold capitalize">{alert.target} alert</p>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(alert.time).toLocaleTimeString()}</p>
                        </div>
                      ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
