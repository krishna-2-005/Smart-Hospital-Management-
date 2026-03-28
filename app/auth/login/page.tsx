'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Heart, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const [email, setEmail] = useState('');
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
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await response.json();
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });

      // Redirect based on role
      const roleRedirects: Record<string, string> = {
        admin: '/admin/dashboard',
        doctor: '/doctor/queue',
        reception: '/reception/dashboard',
        driver: '/driver/dashboard',
        patient: '/patient/dashboard',
      };

      const redirectUrl = roleRedirects[data.user.role] || '/';
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/10 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">HealthHub</h1>
          </div>
          <p className="text-muted-foreground">Smart Hospital Management System</p>
        </div>

        {/* Login Card */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-secondary/5 border-secondary/20"
                />
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-secondary/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">Need Access?</span>
                </div>
              </div>
              <Link href="/auth/patient-setup">
                <Button
                  variant="outline"
                  className="w-full border-secondary/30 text-foreground hover:bg-secondary/5"
                >
                  Patient First-Time Login (Reception ID)
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button
                  variant="outline"
                  className="w-full border-secondary/30 text-foreground hover:bg-secondary/5"
                >
                  Register Staff Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="mt-6 bg-secondary/5 border-secondary/20">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-secondary mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><span className="font-medium">Admin:</span> admin@hospital.com / admin123</p>
              <p><span className="font-medium">Doctor:</span> doctor@hospital.com / doctor123</p>
              <p><span className="font-medium">Reception:</span> reception@hospital.com / reception123</p>
              <p><span className="font-medium">Driver:</span> driver@hospital.com / driver123</p>
              <p><span className="font-medium">Patient:</span> patient@hospital.com / patient123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
