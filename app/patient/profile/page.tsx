'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Heart, Save } from 'lucide-react';

interface PatientProfile {
  firstName: string;
  lastName: string;
  patientId: string;
  age?: number;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  allergies: string;
  medicalHistory: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/patient/profile', { credentials: 'include' });
        if (res.ok) {
          setProfile(await res.json());
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load profile',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [toast]);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);

    try {
      const res = await fetch('/api/patient/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
        credentials: 'include',
      });

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Failed to load profile</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-secondary/10 sticky top-0 bg-background/95 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-primary">My Health Profile</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Personal Information */}
          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-secondary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">First Name</label>
                  <Input value={profile.firstName} disabled className="bg-secondary/5" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Last Name</label>
                  <Input value={profile.lastName} disabled className="bg-secondary/5" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
                  <Input value={profile.email} disabled className="bg-secondary/5" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Phone</label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="bg-secondary/5 border-secondary/20"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Patient ID</label>
                  <Input value={profile.patientId} disabled className="bg-secondary/5" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Age</label>
                  <Input value={profile.age ?? ''} disabled className="bg-secondary/5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Information */}
          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle>Health Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Gender</label>
                  <Input
                    value={profile.gender}
                    placeholder="Male / Female / Other"
                    disabled
                    className="bg-secondary/5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Blood Type</label>
                  <Input
                    value={profile.bloodType}
                    placeholder="A+, B-, O+, etc."
                    disabled
                    className="bg-secondary/5"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Allergies</label>
                <Textarea
                  value={profile.allergies}
                  placeholder="List any known allergies"
                  disabled
                  className="bg-secondary/5"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Medical History</label>
                <Textarea
                  value={profile.medicalHistory}
                  placeholder="Previous conditions, surgeries, medications, etc."
                  disabled
                  className="bg-secondary/5"
                  rows={4}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Medical history can be updated by reception/clinical staff and is visible here as read-only.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Contact Name</label>
                  <Input
                    value={profile.emergencyContactName}
                    onChange={(e) => setProfile({ ...profile, emergencyContactName: e.target.value })}
                    className="bg-secondary/5 border-secondary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Contact Phone</label>
                  <Input
                    value={profile.emergencyContactPhone}
                    onChange={(e) => setProfile({ ...profile, emergencyContactPhone: e.target.value })}
                    className="bg-secondary/5 border-secondary/20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Street Address</label>
                <Input
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="bg-secondary/5 border-secondary/20"
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">City</label>
                  <Input
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    className="bg-secondary/5 border-secondary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">State</label>
                  <Input
                    value={profile.state}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                    className="bg-secondary/5 border-secondary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Zip Code</label>
                  <Input
                    value={profile.zipCode}
                    onChange={(e) => setProfile({ ...profile, zipCode: e.target.value })}
                    className="bg-secondary/5 border-secondary/20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex gap-4">
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              size="lg"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              size="lg"
              onClick={() => router.push('/patient/dashboard')}
            >
              Cancel
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
