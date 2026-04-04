'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Heart, AlertCircle, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await response.json();
      toast({ title: 'Welcome back', description: 'Logged in successfully' });

      // Force password change on first login
      if (data.user.mustChangePassword) {
        router.push('/auth/change-password');
        return;
      }

      const roleRedirects: Record<string, string> = {
        admin: '/admin/dashboard',
        doctor: '/doctor/queue',
        reception: '/reception/dashboard',
        driver: '/driver/dashboard',
      };

      router.push(roleRedirects[data.user.role] || '/');
    } catch (err: any) {
      setError(err.message);
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
          <p className="text-muted-foreground">Hospital Staff Portal</p>
        </div>

        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-secondary" />
              Staff Login
            </CardTitle>
            <CardDescription>Use your 8-digit Staff ID issued by the hospital admin</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="staffId" className="text-sm font-medium text-foreground">
                  Staff ID
                </label>
                <Input
                  id="staffId"
                  type="text"
                  placeholder="e.g. D1234567"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value.toUpperCase().slice(0, 8))}
                  disabled={isLoading}
                  required
                  className="font-mono tracking-widest text-lg bg-secondary/5 border-secondary/20"
                  maxLength={8}
                />
                <p className="text-xs text-muted-foreground">8-character code — starts with a letter (A/D/R/E) followed by 7 digits</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-secondary/5 border-secondary/20"
                />
              </div>

              <Button type="submit" disabled={isLoading || staffId.length !== 8} className="w-full bg-primary hover:bg-primary/90">
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-secondary/10 text-center">
              <p className="text-sm text-muted-foreground mb-3">Are you a patient?</p>
              <Link href="/auth/patient-setup">
                <Button variant="outline" className="w-full border-secondary/30">
                  Patient Login (Use your Patient ID)
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo credentials */}
        <Card className="mt-4 bg-secondary/5 border-secondary/20">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-secondary mb-2">Demo Staff IDs:</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              <p><span className="font-medium">Admin:</span> A1000001 / 123456</p>
              <p><span className="font-medium">Doctor:</span> D1000002 / 123456</p>
              <p><span className="font-medium">Reception:</span> R1000003 / 123456</p>
              <p><span className="font-medium">Driver:</span> E1000004 / 123456</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2 italic">Format: letter prefix + 7 digits (e.g. D1234567)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
