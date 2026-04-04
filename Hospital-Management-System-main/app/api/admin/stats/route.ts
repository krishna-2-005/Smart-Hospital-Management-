import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db-server';
import { getDashboardStats } from '@/lib/demo-store';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get various statistics
    const [
      visitStats,
      appointmentStats,
      emergencyStats,
      bedStats,
      queueStats,
      doctorStats,
      patientStats,
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM visits WHERE DATE(visit_date) = CURRENT_DATE'),
      query("SELECT COUNT(*) as count FROM appointments WHERE DATE(appointment_date) = CURRENT_DATE AND status = 'scheduled'"),
      query('SELECT COUNT(*) as count FROM emergency_requests WHERE DATE(created_at) = CURRENT_DATE'),
      query('SELECT COUNT(*) as total, SUM(CASE WHEN is_available = true THEN 1 ELSE 0 END) as available FROM beds'),
      query("SELECT COUNT(*) as count FROM appointments WHERE status IN ('scheduled', 'in-progress')"),
      query('SELECT COUNT(*) as count FROM doctors WHERE is_available = true'),
      query('SELECT COUNT(*) as count FROM patients'),
    ]);

    return NextResponse.json({
      stats: {
        visitsTodayCount: visitStats.rows[0]?.count || 0,
        appointmentsTodayCount: appointmentStats.rows[0]?.count || 0,
        emergencyCasesToday: emergencyStats.rows[0]?.count || 0,
        totalBeds: bedStats.rows[0]?.total || 0,
        availableBeds: bedStats.rows[0]?.available || 0,
        patientsInQueue: queueStats.rows[0]?.count || 0,
        doctorsOnDuty: doctorStats.rows[0]?.count || 0,
        totalPatients: patientStats.rows[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ stats: getDashboardStats() }, { status: 200 });
  }
}
