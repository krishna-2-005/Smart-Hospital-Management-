'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Bell, Building2, Clock, MapPin, Navigation, Send, ShieldCheck, Siren } from 'lucide-react';
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
    name: string;
    distanceKm: number;
    score: number;
    requiredBedType: string;
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

const STORAGE_KEY = 'publicEmergencyRequestId';

export default function PublicEmergencyPage() {
  const [callerName, setCallerName] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [age, setAge] = useState('');
  const [emergencyType, setEmergencyType] = useState<EmergencyType>('accident');
  const [conditionSummary, setConditionSummary] = useState('');
  const [lat, setLat] = useState('28.6139');
  const [lng, setLng] = useState('77.2090');

  const [requestId, setRequestId] = useState<number | null>(null);
  const [status, setStatus] = useState<EmergencyStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadStatus = async (id: number) => {
    try {
      const res = await fetch(`/api/emergency/status?requestId=${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          localStorage.removeItem(STORAGE_KEY);
          setRequestId(null);
          setStatus(null);
          return;
        }
        const data = await res.json();
        throw new Error(data.error || 'Unable to load emergency status');
      }
      const data = await res.json();
      setStatus(data.status);
    } catch (loadError: any) {
      setError(loadError?.message || 'Unable to load emergency status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (savedId && Number.isFinite(Number(savedId))) {
      const id = Number(savedId);
      setRequestId(id);
      loadStatus(id);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!requestId) return;
    const interval = setInterval(() => {
      loadStatus(requestId);
    }, 5000);
    return () => clearInterval(interval);
  }, [requestId]);

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

  const submitEmergency = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/emergency/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerName,
          callerPhone,
          age: age ? Number(age) : null,
          emergencyType,
          conditionSummary,
          lat: Number(lat),
          lng: Number(lng),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Emergency dispatch failed');
      }

      localStorage.setItem(STORAGE_KEY, String(data.requestId));
      setRequestId(Number(data.requestId));
      await loadStatus(Number(data.requestId));
    } catch (submitError: any) {
      setError(submitError?.message || 'Failed to submit emergency');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetRequest = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRequestId(null);
    setStatus(null);
    setError('');
  };

  const timeline = useMemo(() => status?.timeline || [], [status]);
  const readinessScore = status
    ? Math.max(55, 100 - status.etaMinutes * 2 - (status.hospital?.distanceKm || 0))
    : 92;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary">Public Ambulance Module</h1>
            <p className="text-xs text-muted-foreground">No login required. 1-click emergency dispatch.</p>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">Back to Home</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Smart Emergency Response Engine
            </CardTitle>
            <CardDescription>
              We do not just send ambulances. We prepare the hospital before the patient arrives.
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
            <CardContent className="py-12 text-center text-muted-foreground">Loading module...</CardContent>
          </Card>
        ) : !requestId || (status && status.status === 'arrived') ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="border-secondary/20 lg:col-span-2">
              <CardHeader>
                <CardTitle>Emergency Request Form</CardTitle>
                <CardDescription>Submit once and track live ambulance movement without sign-in.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
              <div className="grid md:grid-cols-3 gap-3">
                <Input value={callerName} onChange={(event) => setCallerName(event.target.value)} placeholder="Caller name" />
                <Input value={callerPhone} onChange={(event) => setCallerPhone(event.target.value)} placeholder="Caller phone (optional)" />
                <Input value={age} onChange={(event) => setAge(event.target.value)} placeholder="Age (optional)" type="number" />
              </div>

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

              <Textarea
                value={conditionSummary}
                onChange={(event) => setConditionSummary(event.target.value)}
                placeholder="Condition summary (e.g. severe chest pain, difficulty breathing)"
                rows={4}
              />

              <Button
                disabled={isSubmitting || callerName.trim().length < 2 || conditionSummary.trim().length < 6}
                onClick={submitEmergency}
                className="w-full bg-destructive hover:bg-destructive/90"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Dispatching Ambulance...' : 'Emergency: Dispatch Ambulance'}
              </Button>
              </CardContent>
            </Card>

            <Card className="border-secondary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="w-5 h-5 text-secondary" />
                  Emergency Guide
                </CardTitle>
                <CardDescription>Critical steps while ambulance is being dispatched</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-md border border-destructive/20 bg-destructive/5 p-2">Keep patient breathing path clear and monitor consciousness.</div>
                <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-2">Do not give food/water during severe chest pain or stroke signs.</div>
                <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-2">Share current medicines and allergy history with responders.</div>
                <div className="rounded-md border border-secondary/20 bg-secondary/5 p-2">Keep one contact person ready near pickup location.</div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Request ID</CardTitle></CardHeader>
                <CardContent className="text-xl font-bold">#{status?.id}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Current Status</CardTitle></CardHeader>
                <CardContent><Badge className="capitalize">{status?.status.replace('-', ' ')}</Badge></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">ETA</CardTitle></CardHeader>
                <CardContent className="text-2xl font-bold text-secondary flex items-center gap-2"><Clock className="w-5 h-5" />{status?.etaMinutes} min</CardContent>
              </Card>
            </div>

            <Card className="border-secondary/20 bg-secondary/5">
              <CardContent className="pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Response readiness</p>
                  <p className="text-3xl font-bold text-primary">{readinessScore}%</p>
                </div>
                <div className="w-full sm:w-2/3">
                  <div className="h-3 rounded-full bg-secondary/20">
                    <div className="h-3 rounded-full bg-secondary" style={{ width: `${readinessScore}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Calculated from ETA, hospital distance, and dispatch stage.</p>
                </div>
                <Badge variant="outline" className="w-fit">
                  <Siren className="w-3 h-3 mr-1" />
                  Active Dispatch
                </Badge>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Navigation className="w-5 h-5 text-secondary" />Live Ambulance Tracking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><span className="font-semibold">Vehicle:</span> {status?.ambulance?.vehicleCode}</p>
                  <p><span className="font-semibold">Driver:</span> {status?.ambulance?.driverName}</p>
                  <p><span className="font-semibold">Contact:</span> {status?.ambulance?.driverPhone}</p>
                  <p><span className="font-semibold">GPS:</span> {status?.ambulance?.lat}, {status?.ambulance?.lng}</p>
                  <p><span className="font-semibold">Route distance:</span> {status?.route.distanceKm.toFixed(2)} km</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" />Smart Hospital Coordination</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><span className="font-semibold">Hospital:</span> {status?.hospital?.name}</p>
                  <p><span className="font-semibold">Distance:</span> {status?.hospital?.distanceKm} km</p>
                  <p><span className="font-semibold">Score:</span> {status?.hospital?.score}</p>
                  <p><span className="font-semibold">Prepared bed:</span> {status?.hospital?.requiredBedType?.toUpperCase()}</p>
                  <p><span className="font-semibold">Oxygen support:</span> {status?.hospital?.hasOxygenSupport ? 'Available' : 'Limited'}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Response Timeline</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {timeline.map((event, index) => (
                    <div key={`${event.time}-${index}`} className="rounded-md border border-secondary/10 p-3">
                      <p className="text-sm font-semibold capitalize">{event.status.replace('-', ' ')}</p>
                      <p className="text-sm text-muted-foreground">{event.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(event.time).toLocaleTimeString()}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" />Real-Time Alerts</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {status?.notifications.slice().reverse().map((alert, index) => (
                    <div key={`${alert.time}-${index}`} className="rounded-md border border-secondary/10 p-3">
                      <p className="text-sm font-semibold capitalize">{alert.target} alert</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(alert.time).toLocaleTimeString()}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Button variant="outline" className="w-full" onClick={resetRequest}>Start New Emergency Request</Button>
          </div>
        )}
      </main>
    </div>
  );
}
