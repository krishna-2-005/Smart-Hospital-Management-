'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, AlertCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function PatientSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'login' | 'setup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [loginData, setLoginData] = useState({
    patientId: '',
    password: '',
  });

  const [setupData, setSetupData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [patientInfo, setPatientInfo] = useState<any>(null);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSetupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSetupData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!loginData.patientId) {
      setError('Please enter your Patient ID');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/patient-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      if (data.requiresPasswordSetup) {
        // First login - setup password
        setPatientInfo({
          firstName: data.firstName,
          lastName: data.lastName,
          patientId: data.patientId,
        });
        setStep('setup');
        setLoginData({ patientId: '', password: '' });
      } else {
        // Already activated - login successful
        toast.success('Login successful!');
        router.push('/patient/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!setupData.password || !setupData.confirmPassword) {
      setError('Please enter and confirm your password');
      setIsLoading(false);
      return;
    }

    if (setupData.password !== setupData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (setupData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/patient-setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientInfo.patientId,
          password: setupData.password,
          confirmPassword: setupData.confirmPassword,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Password setup failed');
        setIsLoading(false);
        return;
      }

      toast.success('Password set successfully! Welcome aboard.');
      router.push('/patient/dashboard');
    } catch (err) {
      console.error('Setup error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-t-lg">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-6 h-6" />
            <span className="text-sm font-semibold">HealthHub</span>
          </div>
          <CardTitle>
            {step === 'login' ? 'Patient Login' : 'Set Your Password'}
          </CardTitle>
          <CardDescription className="text-white/90">
            {step === 'login'
              ? 'Use your 11-digit patient ID to login'
              : `Welcome, ${patientInfo?.firstName}! Create your password to access your account`}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {step === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="patientId">Patient ID *</Label>
                <Input
                  id="patientId"
                  name="patientId"
                  value={loginData.patientId}
                  onChange={handleLoginChange}
                  placeholder="e.g., P1234567890"
                  className="font-mono tracking-widest"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  11-digit code provided by receptionist
                </p>
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  placeholder="Leave blank for first-time setup"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Existing patients enter password. First-time patients can leave this blank.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                First time? Your password will be set on first login.
              </p>
            </form>
          ) : (
            <form onSubmit={handleSetupPassword} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-700 ml-2">
                  Create a strong password to protect your account
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="setup-password">New Password *</Label>
                <Input
                  id="setup-password"
                  name="password"
                  type="password"
                  value={setupData.password}
                  onChange={handleSetupChange}
                  placeholder="Enter password (min 6 characters)"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="confirm-password">Confirm Password *</Label>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={setupData.confirmPassword}
                  onChange={handleSetupChange}
                  placeholder="Confirm password"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isLoading ? 'Setting password...' : 'Setup Password & Login'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep('login');
                  setSetupData({ password: '', confirmPassword: '' });
                  setError('');
                }}
                disabled={isLoading}
                className="w-full"
              >
                Back
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
