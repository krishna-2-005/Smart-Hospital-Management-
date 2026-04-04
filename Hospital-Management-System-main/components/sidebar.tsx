'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Heart,
  LayoutDashboard,
  BedDouble,
  Stethoscope,
  Users,
  AlertTriangle,
  Activity,
  BarChart3,
  UserCog,
  DollarSign,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Pill,
  FileText,
  Bell,
  Calendar,
  Clock,
  User,
  Ambulance,
  Navigation,
  ShieldAlert,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Role = 'admin' | 'doctor' | 'reception' | 'driver' | 'patient';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  admin: [
    { label: 'Dashboard',         href: '/admin/dashboard',          icon: LayoutDashboard },
    { label: 'Staff',             href: '/admin/users',              icon: UserCog },
    { label: 'Patients',          href: '/admin/patients',           icon: Users },
    { label: 'Beds',              href: '/admin/beds',               icon: BedDouble },
    { label: 'Doctors',           href: '/admin/doctors',            icon: Stethoscope },
    { label: 'Emergency Desk',    href: '/admin/emergency',          icon: AlertTriangle },
    { label: 'ER Engine',         href: '/admin/emergency-response', icon: Activity },
    { label: 'Analytics',         href: '/admin/analytics',          icon: BarChart3 },
    { label: 'Patient Data',      href: '/admin/patient-data',       icon: ClipboardList },
    { label: 'Billing',           href: '/admin/billing/dashboard',  icon: DollarSign },
  ],
  doctor: [
    { label: 'Queue',             href: '/doctor/queue',             icon: Clock },
    { label: 'Prescriptions',     href: '/doctor/prescriptions',     icon: Pill },
    { label: 'Discharge',         href: '/doctor/discharge',         icon: FileText },
    { label: 'ER Response',       href: '/doctor/emergency-response',icon: ShieldAlert },
  ],
  reception: [
    { label: 'Dashboard',         href: '/reception/dashboard',      icon: LayoutDashboard },
    { label: 'Queue',             href: '/reception/queue',          icon: Clock },
    { label: 'Patients',          href: '/reception/patients',       icon: Users },
    { label: 'ER Response',       href: '/reception/emergency-response', icon: ShieldAlert },
  ],
  driver: [
    { label: 'Dashboard',         href: '/driver/dashboard',         icon: Ambulance },
  ],
  patient: [
    { label: 'Dashboard',         href: '/patient/dashboard',        icon: LayoutDashboard },
    { label: 'Appointments',      href: '/patient/appointments',     icon: Calendar },
    { label: 'Queue Status',      href: '/patient/queue',            icon: Clock },
    { label: 'Prescriptions',     href: '/patient/prescriptions',    icon: Pill },
    { label: 'Billing',           href: '/patient/billing',          icon: DollarSign },
    { label: 'Discharge',         href: '/patient/discharge',        icon: FileText },
    { label: 'Emergency',         href: '/patient/emergency',        icon: AlertTriangle },
    { label: 'History',           href: '/patient/history',          icon: Navigation },
    { label: 'Notifications',     href: '/patient/notifications',    icon: Bell },
    { label: 'Profile',           href: '/patient/profile',          icon: User },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrator',
  doctor: 'Doctor',
  reception: 'Receptionist',
  driver: 'Driver',
  patient: 'Patient',
};

interface SidebarProps {
  role: Role;
  userName?: string;
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = NAV_ITEMS[role] ?? [];

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/auth/login');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-white/10', collapsed && 'justify-center px-2')}>
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
          <Heart className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-base leading-tight">HealthHub</p>
            <p className="text-white/50 text-xs">{ROLE_LABEL[role]}</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-primary' : 'text-white/70 group-hover:text-white')} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className={cn('border-t border-white/10 p-3 space-y-1', collapsed && 'px-2')}>
        {!collapsed && userName && (
          <div className="px-3 py-2 rounded-lg bg-white/5">
            <p className="text-white/50 text-xs">Signed in as</p>
            <p className="text-white text-sm font-medium truncate">{userName}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all duration-150',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-primary text-white p-2 rounded-lg shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full z-40 w-64 bg-primary transition-transform duration-300 md:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <NavContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden md:flex flex-col fixed top-0 left-0 h-full bg-primary transition-all duration-300 z-30',
        collapsed ? 'w-16' : 'w-60'
      )}>
        <NavContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-primary border-2 border-white/20 flex items-center justify-center text-white hover:bg-primary/80 transition-colors shadow-md"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Spacer so content doesn't go under sidebar */}
      <div className={cn('hidden md:block flex-shrink-0 transition-all duration-300', collapsed ? 'w-16' : 'w-60')} />
    </>
  );
}
