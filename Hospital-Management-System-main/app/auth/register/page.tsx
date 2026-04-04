'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Public staff registration is disabled.
// Staff accounts are created by the admin via /admin/users.
export default function RegisterPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/auth/login'); }, [router]);
  return null;
}
