import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if database tables exist
    const tablesResult = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);

    if (tablesResult.rows.length === 0) {
      // Initialize database - create tables
      try {
        await query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            staff_id VARCHAR(8) UNIQUE,
            email VARCHAR(255) UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'patient',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await query(`
          CREATE TABLE IF NOT EXISTS patients (
            id SERIAL PRIMARY KEY,
            user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
            patient_id VARCHAR(20) UNIQUE,
            blood_type VARCHAR(10),
            allergies TEXT,
            medical_history TEXT,
            emergency_contact VARCHAR(100),
            emergency_phone VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await query(`
          CREATE TABLE IF NOT EXISTS doctors (
            id SERIAL PRIMARY KEY,
            user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
            specialization VARCHAR(100),
            license_number VARCHAR(50),
            is_available BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await query(`
          CREATE TABLE IF NOT EXISTS appointments (
            id SERIAL PRIMARY KEY,
            patient_id INTEGER NOT NULL REFERENCES patients(id),
            doctor_id INTEGER NOT NULL REFERENCES doctors(id),
            appointment_date DATE NOT NULL,
            appointment_time TIME NOT NULL,
            reason_for_visit TEXT,
            status VARCHAR(50) DEFAULT 'scheduled',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await query(`
          CREATE TABLE IF NOT EXISTS beds (
            id SERIAL PRIMARY KEY,
            bed_number VARCHAR(20) UNIQUE NOT NULL,
            ward VARCHAR(100),
            bed_type VARCHAR(50),
            floor_number INTEGER,
            is_available BOOLEAN DEFAULT true,
            allocated_to_patient_id INTEGER REFERENCES patients(id),
            allocated_at TIMESTAMP,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await query('ALTER TABLE beds ADD COLUMN IF NOT EXISTS ward VARCHAR(100)');
        await query('ALTER TABLE beds ADD COLUMN IF NOT EXISTS bed_type VARCHAR(50)');
        await query('ALTER TABLE beds ADD COLUMN IF NOT EXISTS allocated_to_patient_id INTEGER REFERENCES patients(id)');
        await query('ALTER TABLE beds ADD COLUMN IF NOT EXISTS allocated_at TIMESTAMP');
        await query('ALTER TABLE beds ADD COLUMN IF NOT EXISTS notes TEXT');

        await query(`
          CREATE TABLE IF NOT EXISTS bed_allocations (
            id SERIAL PRIMARY KEY,
            bed_id INTEGER NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
            patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
            allocated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            admission_reason TEXT,
            admission_diagnosis TEXT,
            admitting_doctor_name VARCHAR(150),
            expected_stay_days INTEGER,
            insurance_provider VARCHAR(120),
            insurance_policy_number VARCHAR(120),
            emergency_contact_name VARCHAR(120),
            emergency_contact_phone VARCHAR(30),
            clinical_notes TEXT,
            requires_ventilator BOOLEAN DEFAULT false,
            requires_isolation BOOLEAN DEFAULT false,
            diet_type VARCHAR(60),
            allergies_confirmed BOOLEAN DEFAULT false,
            status VARCHAR(30) DEFAULT 'active',
            allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            released_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await query(`
          CREATE TABLE IF NOT EXISTS visits (
            id SERIAL PRIMARY KEY,
            patient_id INTEGER NOT NULL REFERENCES patients(id),
            doctor_id INTEGER NOT NULL REFERENCES doctors(id),
            visit_date DATE NOT NULL,
            visit_type VARCHAR(50),
            reason TEXT,
            duration_minutes INTEGER,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await query(`
          CREATE TABLE IF NOT EXISTS emergency_requests (
            id SERIAL PRIMARY KEY,
            patient_id INTEGER NOT NULL REFERENCES patients(id),
            severity VARCHAR(50),
            description TEXT,
            status VARCHAR(50) DEFAULT 'pending',
            assigned_doctor_id INTEGER REFERENCES doctors(id),
            assigned_bed_id INTEGER REFERENCES beds(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create indexes
        try {
          await query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
          await query('CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id)');
          await query('CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id)');
          await query('CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id)');
          await query('CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id)');
        } catch (e) {
          // Indexes might already exist
        }
      } catch (error) {
        console.error('Error creating tables:', error);
        // Tables might already exist
      }
    }

    // Seed demo data if users table is empty
    const usersCount = await query('SELECT COUNT(*) as count FROM users');
    if (parseInt(usersCount.rows[0].count) === 0) {
      const demoUsers = [
        { staffId: 'A1000001', email: 'admin@staff.local',     password: '123456', firstName: 'System', lastName: 'Admin',  role: 'admin' },
        { staffId: 'D1000002', email: 'doctor@staff.local',    password: '123456', firstName: 'Sarah',  lastName: 'Wilson', role: 'doctor' },
        { staffId: 'R1000003', email: 'reception@staff.local', password: '123456', firstName: 'Emma',   lastName: 'Davis',  role: 'reception' },
        { staffId: 'E1000004', email: 'driver@staff.local',    password: '123456', firstName: 'Rahul',  lastName: 'Singh',  role: 'driver' },
      ];

      for (const demoUser of demoUsers) {
        const passwordHash = await hashPassword(demoUser.password);
        const userInsertResult = await query(
          `INSERT INTO users (staff_id, email, password_hash, first_name, last_name, role, is_active, must_change_password)
           VALUES ($1, $2, $3, $4, $5, $6, true, false)
           RETURNING id, role`,
          [demoUser.staffId, demoUser.email, passwordHash, demoUser.firstName, demoUser.lastName, demoUser.role]
        );

        const createdUser = userInsertResult.rows[0];

        if (createdUser.role === 'doctor') {
          await query(
            `INSERT INTO doctors (user_id, specialization, license_number, is_available) VALUES ($1, $2, $3, true)`,
            [createdUser.id, 'General Medicine', 'DOC-001']
          );
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Database initialized and demo accounts seeded.' 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database already initialized.' 
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : JSON.stringify(error);

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage || 'Failed to initialize database',
        hint: 'Make sure DATABASE_URL is set correctly'
      },
      { status: 500 }
    );
  }
}
