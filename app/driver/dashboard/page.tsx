'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Ambulance,
  Bell,
  Clock3,
  Fuel,
  LogOut,
  MapPin,
  Navigation,
  RefreshCw,
  ShieldAlert,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type ShiftStatus = 'on-duty' | 'break' | 'off-duty';
type AlertType =
  | 'patient-critical'
  | 'route-blocked'
  | 'requires-icu-prep'
  | 'oxygen-support-needed'
  | 'security-support';

type DriverOverview = {
  driver: {
    id: number;
    name: string;
    phone: string;
  };
  ambulance: {
    id: number;
    vehicleCode: string;
    status: 'available' | 'dispatched';
    lat: number;
    lng: number;
    currentRequestId: number | null;
    shiftStatus: ShiftStatus;
    fuelLevelPercent: number;
    standbyZone: string;
    oxygenKitReady: boolean;
    defibrillatorReady: boolean;
    stretcherReady: boolean;
    vehicleNotes: string;
    lastMaintenanceDate: string;
  } | null;
  activeRequest: {
    id: number;
    patientName: string;
    patientId: string;
    emergencyType: string;
    conditionSummary: string;
    status: string;
    etaMinutes: number;
    pickup: { lat: number; lng: number };
    hospital: { name: string; requiredBedType: string; lat: number; lng: number } | null;
    timeline: Array<{ status: string; message: string; time: string }>;
  } | null;
  recentUpdates: Array<{
    requestId: number;
    patientName: string;
    message: string;
    time: string;
  }>;
  emergencyAlerts: Array<{
    id: number | null;
    requestId: number;
    patientName: string;
    message: string;
    time: string;
    category: string;
    target: 'patient' | 'ambulance' | 'hospital';
  }>;
  performance: {
    completedCasesToday: number;
    activeCases: number;
    emergencyAlertsSentToday: number;
  };
};

const STATUS_ACTIONS: Array<{ status: 'ambulance-assigned' | 'en-route' | 'hospital-notified' | 'arriving' | 'arrived'; label: string }> = [
  { status: 'ambulance-assigned', label: 'Acknowledge Dispatch' },
  { status: 'en-route', label: 'Patient Onboard / En Route' },
  { status: 'hospital-notified', label: 'Notify Hospital Team' },
  { status: 'arriving', label: 'Arriving at Hospital' },
  { status: 'arrived', label: 'Handover Completed' },
];

const ALERT_TYPE_OPTIONS: Array<{ value: AlertType; label: string }> = [
  { value: 'patient-critical', label: 'Patient Condition Critical' },
  { value: 'route-blocked', label: 'Route Blocked / Delay Risk' },
  { value: 'requires-icu-prep', label: 'ICU Prep Required' },
  { value: 'oxygen-support-needed', label: 'Oxygen Support Needed' },
  { value: 'security-support', label: 'Security Support Needed' },
];

export default function DriverDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [overview, setOverview] = useState<DriverOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [note, setNote] = useState('');
  const [alertType, setAlertType] = useState<AlertType>('patient-critical');
  const [alertMessage, setAlertMessage] = useState('');
  const [isProfileDirty, setIsProfileDirty] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    lat: '',
    lng: '',
    shiftStatus: 'on-duty' as ShiftStatus,
    fuelLevelPercent: '100',
    standbyZone: '',
    oxygenKitReady: true,
    defibrillatorReady: true,
    stretcherReady: true,
    vehicleNotes: '',
    lastMaintenanceDate: '',
  });

  const loadOverview = async (showLoader = false) => {
    if (showLoader) setIsLoading(true);

    try {
      const res = await fetch('/api/driver/emergency', { credentials: 'include' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load driver dashboard');
      }

      setOverview(data.overview || null);
    } catch (error: any) {
      if (String(error.message || '').toLowerCase().includes('unauthorized')) {
        router.push('/auth/login');
        return;
      }

      toast({
        title: 'Error',
        description: error.message || 'Failed to load dashboard',
        variant: 'destructive',
      });
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOverview(true);
    const interval = setInterval(() => loadOverview(false), 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!overview || isProfileDirty) return;

    setProfileForm({
      name: overview.driver.name || '',
      phone: overview.driver.phone || '',
      lat: String(overview.ambulance?.lat ?? ''),
      lng: String(overview.ambulance?.lng ?? ''),
      shiftStatus: overview.ambulance?.shiftStatus || 'on-duty',
      fuelLevelPercent: String(overview.ambulance?.fuelLevelPercent ?? 100),
      standbyZone: overview.ambulance?.standbyZone || '',
      oxygenKitReady: overview.ambulance?.oxygenKitReady ?? true,
      defibrillatorReady: overview.ambulance?.defibrillatorReady ?? true,
      stretcherReady: overview.ambulance?.stretcherReady ?? true,
      vehicleNotes: overview.ambulance?.vehicleNotes || '',
      lastMaintenanceDate: overview.ambulance?.lastMaintenanceDate
        ? overview.ambulance.lastMaintenanceDate.slice(0, 10)
        : '',
    });
  }, [overview, isProfileDirty]);

  const activeRequest = overview?.activeRequest || null;

  const canSendStatus = useMemo(() => {
    return Boolean(activeRequest?.id) && !isUpdating;
  }, [activeRequest?.id, isUpdating]);

  const canSendEmergencyAlert = useMemo(() => {
    return Boolean(activeRequest?.id) && !isSendingAlert;
  }, [activeRequest?.id, isSendingAlert]);

  const openNavigation = (mode: 'pickup' | 'hospital') => {
    if (!activeRequest) return;

    const hasHospitalTarget = mode === 'hospital' && Boolean(activeRequest.hospital);
    const targetLat = hasHospitalTarget ? activeRequest.hospital!.lat : activeRequest.pickup.lat;
    const targetLng = hasHospitalTarget ? activeRequest.hospital!.lng : activeRequest.pickup.lng;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}&travelmode=driving`;
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleProfileFieldChange = (field: keyof typeof profileForm, value: string | boolean) => {
    setIsProfileDirty(true);
    setProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveDriverDetails = async () => {
    setIsSavingProfile(true);
    try {
      const payload = {
        name: profileForm.name,
        phone: profileForm.phone,
        lat: Number(profileForm.lat),
        lng: Number(profileForm.lng),
        shiftStatus: profileForm.shiftStatus,
        fuelLevelPercent: Number(profileForm.fuelLevelPercent),
        standbyZone: profileForm.standbyZone,
        oxygenKitReady: profileForm.oxygenKitReady,
        defibrillatorReady: profileForm.defibrillatorReady,
        stretcherReady: profileForm.stretcherReady,
        vehicleNotes: profileForm.vehicleNotes,
        lastMaintenanceDate: profileForm.lastMaintenanceDate,
      };

      const res = await fetch('/api/driver/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to update driver details');
      }

      setOverview(data.overview || null);
      setIsProfileDirty(false);
      toast({
        title: 'Profile Updated',
        description: 'Driver and ambulance operational details saved.',
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Could not save driver details',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSendEmergencyAlert = async () => {
    if (!activeRequest) return;

    setIsSendingAlert(true);
    try {
      const res = await fetch('/api/driver/emergency/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          requestId: activeRequest.id,
          alertType,
          message: alertMessage.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to send emergency alert');
      }

      setAlertMessage('');
      toast({
        title: 'Emergency Alert Sent',
        description: 'Hospital teams received your high-priority alert.',
      });

      await loadOverview(false);
    } catch (error: any) {
      toast({
        title: 'Alert Failed',
        description: error.message || 'Could not send emergency alert',
        variant: 'destructive',
      });
    } finally {
      setIsSendingAlert(false);
    }
  };

  const handleStatusUpdate = async (status: 'ambulance-assigned' | 'en-route' | 'hospital-notified' | 'arriving' | 'arrived') => {
    if (!activeRequest) return;

    setIsUpdating(true);
    try {
      const res = await fetch('/api/driver/emergency/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          requestId: activeRequest.id,
          status,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send update');
      }

      setNote('');
      toast({
        title: 'Update Sent',
        description: `Emergency status moved to ${status.replace('-', ' ')}.`,
      });

      await loadOverview(false);
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Unable to send update',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/auth/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-6xl">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">Loading driver workspace...</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary md:text-2xl">Driver Emergency Console</h1>
            <p className="text-sm text-muted-foreground">Manage live ambulance dispatch updates in real time.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => loadOverview(false)}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4" /> Driver</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-semibold">{overview?.driver.name || 'NA'}</p>
              <p className="text-muted-foreground">Phone: {overview?.driver.phone || 'NA'}</p>
              <p className="text-muted-foreground">Shift: {overview?.ambulance?.shiftStatus || 'NA'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Ambulance className="h-4 w-4" /> Ambulance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {overview?.ambulance ? (
                <>
                  <p className="font-semibold">{overview.ambulance.vehicleCode}</p>
                  <Badge variant={overview.ambulance.status === 'available' ? 'secondary' : 'default'}>
                    {overview.ambulance.status}
                  </Badge>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Fuel className="h-4 w-4" />
                    <span>Fuel: {overview.ambulance.fuelLevelPercent}%</span>
                  </div>
                  <p className="text-muted-foreground">Lat/Lng: {overview.ambulance.lat}, {overview.ambulance.lng}</p>
                </>
              ) : (
                <p className="text-muted-foreground">No ambulance assigned yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Clock3 className="h-4 w-4" /> Current ETA</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{activeRequest ? `${activeRequest.etaMinutes} min` : 'No active case'}</p>
              {activeRequest && <p className="mt-1 text-xs text-muted-foreground">Status: {activeRequest.status}</p>}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Completed Today</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{overview?.performance.completedCasesToday ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Active Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{overview?.performance.activeCases ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Emergency Alerts Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{overview?.performance.emergencyAlertsSentToday ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Live Emergency Assignment</CardTitle>
              <CardDescription>Push relevant field updates for hospital and patient teams.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!activeRequest ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  You have no active emergency assignment right now.
                </div>
              ) : (
                <>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Patient</p>
                        <p className="font-semibold">{activeRequest.patientName}</p>
                        <p className="text-xs text-muted-foreground">{activeRequest.patientId}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Emergency Type</p>
                        <p className="font-semibold capitalize">{activeRequest.emergencyType}</p>
                        <p className="text-xs text-muted-foreground">{activeRequest.conditionSummary}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-4 w-4" /> Pickup: {activeRequest.pickup.lat}, {activeRequest.pickup.lng}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1"><Navigation className="h-4 w-4" /> Hospital: {activeRequest.hospital?.name || 'NA'} ({activeRequest.hospital?.requiredBedType || 'NA'} bed)</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" onClick={() => openNavigation('pickup')}>
                        Navigate to Pickup
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => openNavigation('hospital')}>
                        Navigate to Hospital
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Optional Update Note</label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Example: Heavy traffic near junction, reaching in 6 minutes"
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {STATUS_ACTIONS.map((action) => (
                      <Button
                        key={action.status}
                        variant="outline"
                        disabled={!canSendStatus}
                        onClick={() => handleStatusUpdate(action.status)}
                      >
                        {isUpdating ? 'Updating...' : action.label}
                      </Button>
                    ))}
                  </div>

                  <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-red-700">
                        <ShieldAlert className="h-4 w-4" /> Emergency Priority Alert
                      </h3>
                      <p className="text-xs text-red-600">Send immediate high-priority alert to hospital emergency teams.</p>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Alert Type</Label>
                        <Select value={alertType} onValueChange={(value) => setAlertType(value as AlertType)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ALERT_TYPE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Additional Alert Message</Label>
                        <Input
                          placeholder="Optional: Add critical details"
                          value={alertMessage}
                          onChange={(e) => setAlertMessage(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      disabled={!canSendEmergencyAlert}
                      onClick={handleSendEmergencyAlert}
                    >
                      {isSendingAlert ? 'Sending Alert...' : 'Broadcast Emergency Alert'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Recent Driver Updates</CardTitle>
              <CardDescription>Latest ambulance channel notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview?.recentUpdates.length ? (
                overview.recentUpdates.map((item, idx) => (
                  <div key={`${item.requestId}-${idx}`} className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">#{item.requestId} - {new Date(item.time).toLocaleString()}</p>
                    <p className="text-sm font-semibold">{item.patientName}</p>
                    <p className="text-sm text-muted-foreground">{item.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No updates yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Edit Driver & Ambulance Details</CardTitle>
              <CardDescription>Update operational readiness and live field details for dispatch accuracy.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="driver-name">Driver Name</Label>
                  <Input
                    id="driver-name"
                    value={profileForm.name}
                    onChange={(e) => handleProfileFieldChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driver-phone">Phone</Label>
                  <Input
                    id="driver-phone"
                    value={profileForm.phone}
                    onChange={(e) => handleProfileFieldChange('phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="driver-lat">Current Latitude</Label>
                  <Input
                    id="driver-lat"
                    value={profileForm.lat}
                    onChange={(e) => handleProfileFieldChange('lat', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driver-lng">Current Longitude</Label>
                  <Input
                    id="driver-lng"
                    value={profileForm.lng}
                    onChange={(e) => handleProfileFieldChange('lng', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Shift Status</Label>
                  <Select value={profileForm.shiftStatus} onValueChange={(value) => handleProfileFieldChange('shiftStatus', value as ShiftStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on-duty">On Duty</SelectItem>
                      <SelectItem value="break">Break</SelectItem>
                      <SelectItem value="off-duty">Off Duty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuel-level">Fuel Level %</Label>
                  <Input
                    id="fuel-level"
                    type="number"
                    min={0}
                    max={100}
                    value={profileForm.fuelLevelPercent}
                    onChange={(e) => handleProfileFieldChange('fuelLevelPercent', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="standby-zone">Standby Zone</Label>
                  <Input
                    id="standby-zone"
                    value={profileForm.standbyZone}
                    onChange={(e) => handleProfileFieldChange('standbyZone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenance-date">Last Maintenance Date</Label>
                  <Input
                    id="maintenance-date"
                    type="date"
                    value={profileForm.lastMaintenanceDate}
                    onChange={(e) => handleProfileFieldChange('lastMaintenanceDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-lg border p-3">
                <p className="text-sm font-medium">Equipment Readiness</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={profileForm.oxygenKitReady}
                      onCheckedChange={(checked) => handleProfileFieldChange('oxygenKitReady', Boolean(checked))}
                    />
                    Oxygen Kit
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={profileForm.defibrillatorReady}
                      onCheckedChange={(checked) => handleProfileFieldChange('defibrillatorReady', Boolean(checked))}
                    />
                    Defibrillator
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={profileForm.stretcherReady}
                      onCheckedChange={(checked) => handleProfileFieldChange('stretcherReady', Boolean(checked))}
                    />
                    Stretcher
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle-notes">Vehicle Notes</Label>
                <Textarea
                  id="vehicle-notes"
                  rows={3}
                  placeholder="Fuel stop plans, minor maintenance notes, route limitations..."
                  value={profileForm.vehicleNotes}
                  onChange={(e) => handleProfileFieldChange('vehicleNotes', e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveDriverDetails} disabled={isSavingProfile || !overview?.ambulance}>
                  {isSavingProfile ? 'Saving...' : 'Save Driver Details'}
                </Button>
                <Button variant="outline" onClick={() => { setIsProfileDirty(false); loadOverview(false); }}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <ShieldAlert className="h-4 w-4" /> Emergency Alert Log
              </CardTitle>
              <CardDescription>High-priority alerts sent by you to emergency hospital teams.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview?.emergencyAlerts.length ? (
                overview.emergencyAlerts.map((alert, index) => (
                  <div key={`${alert.requestId}-${alert.id || index}`} className="rounded-md border border-red-200 bg-red-50 p-3">
                    <p className="text-xs font-semibold uppercase text-red-700">{alert.category.replace(/-/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">
                      Case #{alert.requestId} - {new Date(alert.time).toLocaleString()}
                    </p>
                    <p className="text-sm font-semibold">{alert.patientName}</p>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No emergency alerts sent yet for active assignments.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
