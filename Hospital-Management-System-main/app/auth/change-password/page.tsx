'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (form.newPassword === '123456') {
      setError('Please choose a different password than the default one');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to change password'); return; }

      // Fetch profile to get role for redirect
      const profileRes = await fetch('/api/auth/profile', { credentials: 'include' });
      const profile = await profileRes.json();
      const roleRedirects: Record<string, string> = {
        admin: '/admin/dashboard',
        doctor: '/doctor/queue',
        reception: '/reception/dashboard',
        driver: '/driver/dashboard',
      };
      router.push(roleRedirects[profile.role] || '/');
    } catch {
      setError('Unexpected error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/10 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">HealthHub</h1>
          </div>
        </div>

        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-secondary" />
              Set Your Password
            </CardTitle>
            <CardDescription>
              Your account was created with a default password. You must set a new password before continuing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-5 border-amber-300 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 ml-2">
                Default password is <span className="font-mono font-bold">123456</span>. Enter it as your current password, then choose a new one.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Current Password</label>
                <Input
                  type="password"
                  placeholder="Enter 123456"
                  value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input
                  type="password"
                  placeholder="Min 6 characters"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm New Password</label>
                <Input
                  type="password"
                  placeholder="Repeat new password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving...' : 'Set Password & Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
