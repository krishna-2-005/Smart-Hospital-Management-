'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetch('/api/auth/profile', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (d.firstName) setUserName(`${d.firstName} ${d.lastName}`); })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="driver" userName={userName} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
