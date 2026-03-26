'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Heart, Stethoscope, Users, Zap } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isInitializing, setIsInitializing] = React.useState(true);

  useEffect(() => {
    // Initialize database first
    const initializeApp = async () => {
      try {
        await fetch('/api/init', { method: 'GET' });
      } catch (error) {
        console.error('Database initialization skipped:', error);
        // Continue anyway - database might be already initialized
      }

      // Check if user is authenticated
      try {
        const response = await fetch('/api/auth/profile', {
          credentials: 'include',
        });

        if (response.ok) {
          try {
            const data = await response.json();
            const roleRedirects: Record<string, string> = {
              admin: '/admin/dashboard',
              doctor: '/doctor/queue',
              reception: '/reception/queue',
              patient: '/patient/dashboard',
            };
            router.push(roleRedirects[data.role] || '/');
            return;
          } catch {
            // JSON parse error, show landing page
          }
        }
      } catch (error) {
        // Not authenticated, show landing page
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-background">
      {/* Header */}
      <header className="border-b border-secondary/10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">HealthHub</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/auth/login" className="cursor-pointer">
              <Button variant="outline" className="hover:scale-105 transition-transform duration-200">Sign In</Button>
            </Link>
            <Link href="/auth/register" className="cursor-pointer">
              <Button className="hover:scale-105 transition-transform duration-200">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
          Smart Hospital Management &
          <span className="text-primary"> Emergency Response</span>
        </h2>
        <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
          Streamline patient care, manage queues efficiently, allocate beds intelligently, and respond to emergencies with precision.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/auth/register" className="cursor-pointer">
            <Button size="lg" className="bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-200">
              Start Free Trial
            </Button>
          </Link>
          <Link href="/emergency" className="cursor-pointer">
            <Button size="lg" variant="destructive" className="hover:scale-105 transition-all duration-200">
              Emergency Without Login
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="hover:scale-105 transition-all duration-200 cursor-pointer">
            Watch Demo
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center text-foreground mb-12">Powerful Features</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Users,
              title: 'Patient Portal',
              description: 'Book appointments, track queue status, and manage health records',
            },
            {
              icon: Stethoscope,
              title: 'Doctor Workflows',
              description: 'Efficient consultation management and prescription handling',
            },
            {
              icon: Zap,
              title: 'Emergency Response',
              description: 'Instant emergency handling with automatic bed allocation',
            },
            {
              icon: Heart,
              title: 'Analytics Dashboard',
              description: 'Real-time insights and hospital activity heatmaps',
            },
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-lg bg-card border border-secondary/10 hover:border-secondary/30 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group"
              >
                <Icon className="w-10 h-10 text-secondary mb-4 group-hover:text-primary transition-colors duration-300" />
                <h4 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Demo Credentials */}
      <section className="max-w-6xl mx-auto px-4 py-20 bg-secondary/5 rounded-lg my-12 border border-secondary/20">
        <h3 className="text-2xl font-bold text-foreground mb-8 text-center">Try Demo Accounts</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { role: 'Admin', email: 'admin@hospital.com', password: 'admin123' },
            { role: 'Doctor', email: 'doctor@hospital.com', password: 'doctor123' },
            { role: 'Reception', email: 'reception@hospital.com', password: 'reception123' },
            { role: 'Patient', email: 'patient@hospital.com', password: 'patient123' },
          ].map((demo, idx) => (
            <div key={idx} className="p-4 bg-card rounded border border-secondary/20 hover:border-secondary/40 hover:shadow-md hover:scale-105 transition-all duration-300 cursor-pointer group">
              <p className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">{demo.role}</p>
              <p className="text-xs text-muted-foreground mb-1">
                <span className="font-mono bg-secondary/10 px-2 py-1 rounded hover:bg-secondary/20 transition-colors duration-200 cursor-text">{demo.email}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-mono bg-secondary/10 px-2 py-1 rounded hover:bg-secondary/20 transition-colors duration-200 cursor-text">{demo.password}</span>
              </p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/auth/login" className="cursor-pointer">
            <Button className="bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-200">Try Demo Now</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-secondary/10 py-12 text-center text-muted-foreground">
        <p>&copy; 2024 HealthHub. Smart Hospital Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}
