'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Heart, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DOCTOR_SPECIALIZATIONS = [
  'General Medicine',
  'Cardiology',
  'Orthopedics',
  'Dermatology',
  'Pediatrics',
  'Neurology',
  'Psychiatry',
  'ENT',
  'Gynecology',
  'Urology',
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          role,
          userType: specialization || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Registration failed');
      }

      toast({
        title: 'Success',
        description: 'Account created successfully!',
      });

      // Redirect based on role
      const roleRedirects: Record<string, string> = {
        admin: '/admin/dashboard',
        doctor: '/doctor/queue',
        reception: '/reception/dashboard',
        driver: '/driver/dashboard',
        patient: '/patient/dashboard',
      };

      const redirectUrl = roleRedirects[role] || '/';
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
          <p className="text-muted-foreground">Create Staff Account</p>
        </div>

        {/* Registration Card */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle>Join HealthHub</CardTitle>
            <CardDescription>
              {step === 1
                ? 'Choose your account type'
                : `Create your ${role} account`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Role Selection */}
            {step === 1 && (
              <div className="space-y-4">
                {['doctor', 'reception', 'driver', 'admin'].map((userRole) => (
                  <Button
                    key={userRole}
                    variant={role === userRole ? 'default' : 'outline'}
                    className="w-full h-12 capitalize text-base"
                    onClick={() => {
                      setRole(userRole);
                      setStep(2);
                    }}
                  >
                    {userRole === 'admin' ? 'Hospital Admin' : `Register as ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}`}
                  </Button>
                ))}
                <p className="text-xs text-muted-foreground text-center pt-1">
                  Patient accounts are created only through reception-issued patient IDs.
                </p>
              </div>
            )}

            {/* Step 2: Registration Form */}
            {step === 2 && (
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-foreground">
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isLoading}
                    required
                    className="bg-secondary/5 border-secondary/20"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-foreground">
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isLoading}
                    required
                    className="bg-secondary/5 border-secondary/20"
                  />
                </div>

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
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    className="bg-secondary/5 border-secondary/20"
                  />
                </div>

                {role === 'doctor' && (
                  <div className="space-y-2">
                    <label htmlFor="specialization" className="text-sm font-medium text-foreground">
                      Specialization
                    </label>
                    <Select value={specialization} onValueChange={setSpecialization} disabled={isLoading}>
                      <SelectTrigger className="bg-secondary/5 border-secondary/20">
                        <SelectValue placeholder="Select your specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCTOR_SPECIALIZATIONS.map((spec) => (
                          <SelectItem key={spec} value={spec}>
                            {spec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setStep(1);
                      setRole('');
                    }}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </div>
              </form>
            )}

            {step === 1 && (
              <div className="mt-6 text-center text-sm">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  Sign In
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
