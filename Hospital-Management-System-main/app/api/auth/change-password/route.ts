import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db-server';
import { hashPassword, comparePassword } from '@/lib/auth';
import { changeStaffPassword } from '@/lib/demo-store';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { currentPassword, newPassword, confirmPassword } = await request.json();

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }
  if (newPassword === '123456') {
    return NextResponse.json({ error: 'Please choose a different password than the default' }, { status: 400 });
  }

  try {
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false`);

    const result = await query('SELECT password_hash FROM users WHERE id = $1', [user.userId]);
    if (result.rows.length === 0) throw new Error('User not found');

    const valid = await comparePassword(currentPassword, result.rows[0].password_hash);
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

    const newHash = await hashPassword(newPassword);
    await query(
      `UPDATE users SET password_hash = $1, must_change_password = false, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newHash, user.userId]
    );

    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    // Demo fallback
    const changed = changeStaffPassword(user.userId, newPassword);
    if (changed) return NextResponse.json({ message: 'Password changed successfully' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
