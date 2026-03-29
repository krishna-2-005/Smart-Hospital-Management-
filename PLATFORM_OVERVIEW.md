# HealthHub - Complete Platform Overview

## Platform Identity
- Name: HealthHub - Smart Hospital Management System
- Stack: Next.js 16 (App Router), React 19, TypeScript, PostgreSQL (pg), bcryptjs, jsonwebtoken, Tailwind CSS, Radix UI, Recharts
- Auth: JWT stored in HTTP-only cookies, bcryptjs password hashing
- Demo fallback: In-memory store (lib/demo-store.ts) used when DB is unavailable
- Vercel Analytics integrated in layout.tsx

---

## Architecture Overview

### Dual-Mode Data Layer
Every API route tries PostgreSQL first. On failure it falls back to the in-memory demo store (lib/demo-store.ts). This means the app works without a database for demos.

### lib/db.ts
- PostgreSQL pool via `pg`
- Exports: `query(sql, params)`, `getClient()`, `initializePool()`, `closePool()`
- Pool initialized from DATABASE_URL env var

### lib/auth.ts
- `hashPassword(password)` - bcryptjs, 12 rounds
- `comparePassword(plain, hash)` - bcryptjs compare
- `generateToken(userId, role)` - JWT, 7d expiry
- `verifyToken(token)` - JWT verify
- `setAuthCookie(token)` - sets `auth-token` HTTP-only cookie
- `getAuthToken()` - reads cookie from request
- `clearAuthCookie()` - clears cookie on logout
- `getCurrentUser()` - reads + verifies JWT from cookie, returns `{userId, role}`

### lib/utils.ts
- `cn(...classes)` - clsx + tailwind-merge utility

### lib/export-utils.ts
- `exportToCSV(data, filename)` - downloads CSV
- `exportToHTML(html, title)` - opens print dialog for PDF
- `getReportTitle(title)` - timestamped title
- `formatCurrency(amount)` - USD format
- `formatDate(dateStr)` - locale date string

### middleware.ts
- Protects all routes under /admin, /doctor, /reception, /driver, /patient
- Reads JWT from auth-token cookie
- Role-based redirect: wrong role → /auth/login
- Public routes: /, /auth/*, /emergency, /api/emergency/*, /api/auth/*

---

## Database Schema (PostgreSQL)

### Table: users
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| email | VARCHAR(255) UNIQUE | |
| password_hash | VARCHAR(255) | bcryptjs |
| first_name | VARCHAR(100) | |
| last_name | VARCHAR(100) | |
| phone | VARCHAR(20) | added via ALTER |
| role | VARCHAR(50) | admin/doctor/reception/driver/patient |
| is_active | BOOLEAN | default true |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### Table: patients
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| user_id | INTEGER FK→users | UNIQUE |
| patient_id_unique | VARCHAR(20) UNIQUE | DC{YEAR}{SEQ} format |
| blood_type | VARCHAR(10) | |
| allergies | TEXT | |
| medical_history | TEXT | appended by bed alloc events |
| emergency_contact_name | VARCHAR(120) | |
| emergency_contact_phone | VARCHAR(30) | |
| age | INTEGER | added via ALTER |
| gender | VARCHAR(20) | added via ALTER |
| address | TEXT | |
| city | VARCHAR | |
| state | VARCHAR | |
| zip_code | VARCHAR | |
| date_of_birth | DATE | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### Table: patient_pre_registration
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| patient_id_unique | VARCHAR UNIQUE | DC{YEAR}{SEQ} |
| first_name | VARCHAR(100) | |
| last_name | VARCHAR(100) | |
| phone | VARCHAR(20) | |
| email | VARCHAR(255) | optional |
| age | INTEGER | added via ALTER |
| gender | VARCHAR(20) | added via ALTER |
| address | TEXT | added via ALTER |
| created_by_receptionist_id | INTEGER FK→users | |
| is_activated | BOOLEAN | false until password set |
| user_id | INTEGER FK→users | set after activation |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### Table: doctors
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| user_id | INTEGER FK→users | UNIQUE |
| specialization | VARCHAR(100) | |
| license_number | VARCHAR(50) | |
| is_available | BOOLEAN | default true |
| created_at | TIMESTAMP | |

### Table: appointments
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| patient_id | INTEGER FK→patients | |
| doctor_id | INTEGER FK→doctors | |
| appointment_date | DATE | |
| appointment_time | TIME | |
| reason_for_visit | TEXT | |
| status | VARCHAR(50) | scheduled/completed/cancelled |
| notes | TEXT | |
| created_at | TIMESTAMP | |

### Table: beds
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| bed_number | VARCHAR(20) UNIQUE | |
| ward | VARCHAR(100) | |
| bed_type | VARCHAR(50) | icu/general/pediatric/maternity/isolation |
| floor_number | INTEGER | |
| is_available | BOOLEAN | default true |
| allocated_to_patient_id | INTEGER FK→patients | nullable |
| allocated_at | TIMESTAMP | nullable |
| notes | TEXT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### Table: bed_allocations
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| bed_id | INTEGER FK→beds CASCADE | |
| patient_id | INTEGER FK→patients CASCADE | |
| allocated_by_user_id | INTEGER FK→users SET NULL | |
| admission_reason | TEXT | |
| admission_diagnosis | TEXT | |
| admitting_doctor_name | VARCHAR(150) | |
| expected_stay_days | INTEGER | |
| insurance_provider | VARCHAR(120) | |
| insurance_policy_number | VARCHAR(120) | |
| emergency_contact_name | VARCHAR(120) | |
| emergency_contact_phone | VARCHAR(30) | |
| clinical_notes | TEXT | |
| requires_ventilator | BOOLEAN | default false |
| requires_isolation | BOOLEAN | default false |
| diet_type | VARCHAR(60) | |
| allergies_confirmed | BOOLEAN | default false |
| status | VARCHAR(30) | active/released |
| allocated_at | TIMESTAMP | |
| released_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### Table: visits
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| patient_id | INTEGER FK→patients | |
| doctor_id | INTEGER FK→doctors | |
| visit_date | DATE | |
| visit_type | VARCHAR(50) | |
| reason | TEXT | |
| duration_minutes | INTEGER | |
| diagnosis | TEXT | used for scan detection |
| treatment_plan | TEXT | |
| symptoms | TEXT | |
| notes | TEXT | |
| created_at | TIMESTAMP | |

### Table: emergency_requests
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| patient_id | INTEGER FK→patients | |
| severity | VARCHAR(50) | |
| description | TEXT | |
| status | VARCHAR(50) | pending/in-progress/resolved |
| assigned_doctor_id | INTEGER FK→doctors | nullable |
| assigned_bed_id | INTEGER FK→beds | nullable |
| created_at | TIMESTAMP | |

### Table: queues (referenced in API, not in init)
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| doctor_id | INTEGER FK→doctors | |
| patient_id | INTEGER FK→patients | |
| queue_position | INTEGER | |
| priority | VARCHAR | emergency/high/normal/low |
| status | VARCHAR | waiting/in-consultation/completed |
| check_in_time | TIMESTAMP | |
| estimated_wait_time_minutes | INTEGER | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### Table: prescriptions (referenced in API)
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| doctor_id | INTEGER FK→doctors | |
| patient_id | INTEGER FK→patients | |
| medication | VARCHAR | |
| dosage | VARCHAR | |
| frequency | VARCHAR | |
| duration | VARCHAR | |
| instructions | TEXT | |
| status | VARCHAR | active/inactive/expired |
| issued_date | TIMESTAMP | |

### Table: prescription_refills (referenced in API)
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| prescription_id | INTEGER FK→prescriptions | |
| request_date | TIMESTAMP | |
| approved_date | TIMESTAMP | nullable |
| status | VARCHAR | pending/approved |

### DB Indexes
- idx_users_email ON users(email)
- idx_patients_user_id ON patients(user_id)
- idx_doctors_user_id ON doctors(user_id)
- idx_appointments_patient ON appointments(patient_id)
- idx_visits_patient ON visits(patient_id)
- idx_bed_allocations_patient_id ON bed_allocations(patient_id)
- idx_bed_allocations_status ON bed_allocations(status)

---

## In-Memory Demo Store (lib/demo-store.ts)

The demo store is a global singleton (`globalThis.__demoStore`) that mirrors the DB schema in memory. It is used as a fallback when PostgreSQL is unavailable.

### Demo Store Types
- DemoUser: id, email, passwordHash, firstName, lastName, phone, role
- DemoPatient: id, userId, patientId (DC format), bloodType, allergies, medicalHistory, dateOfBirth, emergencyContact fields
- DemoDoctor: id, userId, specialization, licenseNumber, isAvailable
- DemoAppointment: id, patientId, doctorId, appointmentDate, appointmentTime, reasonForVisit, status
- DemoBed: id, bedNumber, ward, bedType, floorNumber, isAvailable, allocatedToPatientId, allocatedAt
- DemoBedAllocation: id, bedId, patientId, allocatedByUserId, all admission detail fields, status (active/released), allocatedAt, releasedAt
- DemoQueue: id, doctorId, patientId, queuePosition, priority, status, checkInTime, estimatedWaitTimeMinutes
- DemoPrescription: id, doctorId, patientId, medication, dosage, frequency, duration, instructions, status, issuedDate
- DemoPrescriptionRefill: id, prescriptionId, requestedAt, status
- DemoEmergency: id, patientId, severity, description, status, assignedDoctorId, assignmentAuditTrail[], createdAt
- DemoSmartEmergencyRequest: full ambulance dispatch object with timeline[], notifications[], ETA, GPS coords
- DemoAmbulance: id, vehicleCode, driverName, driverPhone, driverUserId, lat, lng, status, currentRequestId, shiftStatus, fuelLevelPercent, standbyZone, equipment flags, vehicleNotes, lastMaintenanceDate
- DemoHospital: id, name, lat, lng, availableIcuBeds, availableGeneralBeds, hasOxygenSupport
- EmergencyType: accident | cardiac | stroke | breathing | trauma | other
- EmergencyStatus: requested | ambulance-assigned | en-route | hospital-notified | arriving | arrived

### Demo Store Exported Functions
| Function | Purpose |
|----------|---------|
| getStore() | Returns singleton store |
| validateDemoCredentials(email, password) | Login check |
| registerDemoUser({email,password,firstName,lastName,role,userType}) | Register new user |
| getDemoAuthProfile(userId) | Get profile for JWT user |
| getPatientProfile(userId) | Full patient profile with bed info |
| updatePatientProfile(userId, data) | Update contact/address fields |
| getPatientQueueStatus(userId) | Current queue position |
| joinQueueForPatient(userId, doctorId, priority) | Add to queue |
| getPatientAppointments(userId) | List appointments |
| createPatientAppointment(userId, input) | Book appointment |
| getReceptionQueues() | All active queues |
| addQueueByReception(patientId, doctorId, priority) | Reception adds to queue |
| getDoctorQueue(userId) | Doctor's queue |
| updateDoctorQueue(queueId, status) | Update queue item status |
| getBeds() | All beds with allocation details |
| updateBedAllocation(bedId, patientId, isAvailable, details) | Allocate/release bed |
| getPatientBedHistory(userId) | Patient's bed history |
| getDashboardStats() | Admin stats object |
| getAdminDoctors() | Doctors with queue load |
| getAdminPatients() | Patients list |
| getAdminPatientData(filters) | Appointment records with masked PII |
| getEmergencyCases() | All emergency cases |
| getPrescriptions(userId, role) | Role-filtered prescriptions |
| issuePrescription(patientId, medication, dosage, frequency, duration) | Issue prescription |
| requestRefill(prescriptionId) | Request refill |
| updateEmergencyStatus(caseId, status) | Update emergency status |
| updateEmergencyAssignment(caseId, doctorId, options) | Assign doctor with audit trail |
| createSmartEmergencyRequest(userId, input) | Patient emergency dispatch |
| getPatientSmartEmergencyStatus(userId) | Patient's active emergency |
| createPublicSmartEmergencyRequest(input) | Public (no-login) emergency |
| getSmartEmergencyStatusById(requestId) | Get by ID |
| getSmartEmergencyAdminOverview() | Admin overview of all active |
| getHospitalEmergencyInbox(userId) | Hospital team inbox |
| acknowledgeHospitalEmergencyAlert(userId, input) | Acknowledge alert |
| getDriverEmergencyOverview(userId) | Driver dashboard data |
| updateDriverOperationalProfile(userId, input) | Update driver/ambulance details |
| sendDriverEmergencyAlert(userId, input) | Driver sends emergency alert |
| updateDriverEmergencyStatus(userId, input) | Driver updates status |

### Smart Emergency Algorithm
1. Find nearest available ambulance (Haversine distance)
2. Score hospitals: distance × 6, bed availability bonus/penalty, oxygen support penalty for cardiac/breathing
3. Select lowest-score hospital
4. Calculate ETA: (pickup leg + hospital leg) / 40 km/h × 60, min 3 min
5. Mark ambulance as dispatched
6. Create timeline and notifications for patient/ambulance/hospital
7. Auto-progress simulation via updateSmartEmergencyProgress()

---

## API Routes - Complete Reference

### Auth Routes

#### POST /api/auth/login
- DB READ: SELECT from users WHERE email AND is_active=true
- Compares bcrypt password
- On DB fail: falls back to validateDemoCredentials()
- Sets auth-token cookie on success
- Returns: user object (id, email, firstName, lastName, role)

#### POST /api/auth/logout
- Clears auth-token cookie

#### POST /api/auth/register
- Validates role (admin/doctor/reception/driver only - no patient self-register)
- DB WRITE: INSERT into users
- If doctor: INSERT into doctors (specialization, license_number)
- On DB fail: falls back to registerDemoUser()
- Sets auth-token cookie

#### POST /api/auth/patient-login
- DB READ: SELECT from patient_pre_registration WHERE patient_id_unique
- If not activated: returns requiresPasswordSetup=true
- If activated: verifies password against users table
- Sets auth-token cookie on success

#### POST /api/auth/patient-setup-password
- DB READ: SELECT from patient_pre_registration WHERE patient_id_unique
- Validates not already activated
- DB WRITE: INSERT into users (email, password_hash, first_name, last_name, phone, role='patient')
- DB WRITE: INSERT into patients (user_id, patient_id_unique, age, gender, address)
- DB WRITE: UPDATE patient_pre_registration SET is_activated=true, user_id
- Sets auth-token cookie

#### GET /api/auth/profile
- DB READ: SELECT from users WHERE id
- DB READ: SELECT from patients or doctors WHERE user_id (role-specific)
- On DB fail: falls back to getDemoAuthProfile()

---

### Init Route

#### GET /api/init
- DB READ: SELECT from information_schema.tables WHERE table_name='users'
- If tables missing: CREATE TABLE for users, patients, doctors, appointments, beds, bed_allocations, visits, emergency_requests
- Creates indexes
- DB READ: SELECT COUNT from users
- If empty: seeds 4 demo users (admin, doctor, reception, patient) with hashed passwords
- Also creates doctor and patient records for seeded users

---

### Admin Routes (all require role=admin)

#### GET /api/admin/stats
- DB READ: COUNT from visits WHERE today
- DB READ: COUNT from appointments WHERE today AND scheduled
- DB READ: COUNT from emergency_requests WHERE today
- DB READ: COUNT + SUM(available) from beds
- DB READ: COUNT from appointments WHERE in-progress/scheduled
- DB READ: COUNT from doctors WHERE available
- DB READ: COUNT from patients
- On fail: getDashboardStats() from demo store

#### GET /api/admin/beds
- Ensures bed_allocations table exists
- DB READ: SELECT beds LEFT JOIN patients LEFT JOIN users LEFT JOIN bed_allocations (active) ORDER BY floor, bed_number
- On fail: getBeds() from demo store

#### PATCH /api/admin/beds
- action='allocate': 
  - DB WRITE: UPDATE beds SET allocated_to_patient_id, is_available=false, allocated_at
  - DB WRITE: INSERT into bed_allocations with all admission details
  - DB WRITE: UPDATE patients SET medical_history (appends allocation note)
- action='release':
  - DB WRITE: UPDATE beds SET allocated_to_patient_id=NULL, is_available=true
  - DB WRITE: UPDATE bed_allocations SET status='released', released_at
  - DB WRITE: UPDATE patients SET medical_history (appends release note)
- Uses transaction (BEGIN/COMMIT/ROLLBACK)
- On fail: updateBedAllocation() from demo store

#### GET /api/admin/doctors
- Returns getAdminDoctors() from demo store (demo-only, no DB query)

#### GET /api/admin/emergency
- Returns getEmergencyCases() from demo store

#### PATCH /api/admin/emergency
- Updates status and/or doctor assignment
- Guard: critical+pending cases require available doctor unless forceOverride=true
- Audit trail recorded on override
- Uses demo store: updateEmergencyStatus(), updateEmergencyAssignment()

#### GET /api/admin/emergency-response
- Returns getHospitalEmergencyInbox(userId) from demo store

#### POST /api/admin/emergency-response
- Calls acknowledgeHospitalEmergencyAlert(userId, {requestId, alertId, note})

#### GET /api/admin/patient-data
- DB READ: Complex JOIN query - appointments + patients + users + doctors + bed_allocations (lateral)
- Filters by ward and intakeType
- Masks email (first 2 chars + ***@domain) and phone (last 4 digits)
- On fail: getAdminPatientData(filters) from demo store

#### GET /api/admin/patients
- DB READ: SELECT patients JOIN users ORDER BY created_at DESC
- On fail: getAdminPatients() from demo store

---

### Doctor Routes (all require role=doctor)

#### GET /api/doctor/queue
- DB READ: SELECT queues JOIN patients JOIN users WHERE doctor_id AND status IN (waiting, in-consultation)
- On fail: getDoctorQueue(userId) from demo store

#### PATCH /api/doctor/queue
- DB WRITE: UPDATE queues SET status WHERE id
- On fail: updateDoctorQueue(queueId, status) from demo store

#### GET /api/doctor/emergency-response
- Returns getHospitalEmergencyInbox(userId) from demo store

#### POST /api/doctor/emergency-response
- Calls acknowledgeHospitalEmergencyAlert(userId, {requestId, alertId, note})

---

### Driver Routes (all require role=driver)

#### GET /api/driver/emergency
- Returns getDriverEmergencyOverview(userId) from demo store

#### GET /api/driver/profile
- Returns getDriverEmergencyOverview(userId) from demo store

#### PUT /api/driver/profile
- Calls updateDriverOperationalProfile(userId, input)
- Validates: name (min 3 chars), phone (min 10 digits), lat (-90 to 90), lng (-180 to 180), shiftStatus, fuelLevel (0-100), standbyZone (min 3 chars), dates

#### POST /api/driver/emergency/alert
- Validates alertType (patient-critical/route-blocked/requires-icu-prep/oxygen-support-needed/security-support)
- Calls sendDriverEmergencyAlert(userId, {requestId, alertType, message})
- Broadcasts EMERGENCY priority notification to hospital channel

#### POST /api/driver/emergency/update
- Validates status (ambulance-assigned/en-route/hospital-notified/arriving/arrived)
- Calls updateDriverEmergencyStatus(userId, {requestId, status, note})
- On 'arrived': resets ambulance to available, sets ETA to 0

---

### Emergency Routes (public, no auth)

#### POST /api/emergency/request
- Validates: callerName (min 2), emergencyType, lat/lng (finite), conditionSummary (min 6)
- Calls createPublicSmartEmergencyRequest(input)
- Returns: requestId, status

#### GET /api/emergency/status?requestId=N
- Calls getSmartEmergencyStatusById(requestId)
- Returns full status with ambulance GPS, hospital, timeline, notifications

---

### Patient Routes (all require role=patient)

#### GET /api/patient/appointments
- DB READ: SELECT appointments JOIN doctors JOIN users WHERE patient_id ORDER BY date DESC
- On fail: getPatientAppointments(userId) from demo store

#### POST /api/patient/appointments
- DB READ: SELECT patients WHERE user_id
- DB WRITE: INSERT into appointments (patient_id, doctor_id, date, time, reason, status='scheduled')
- On fail: createPatientAppointment(userId, input) from demo store

#### GET /api/patient/bed-history
- Ensures bed_allocations table exists
- DB READ: SELECT bed_allocations JOIN beds WHERE patient_id ORDER BY allocated_at DESC
- On fail: getPatientBedHistory(userId) from demo store

#### POST /api/patient/emergency/request
- Validates emergencyType, lat/lng, conditionSummary
- Calls createSmartEmergencyRequest(userId, input)

#### GET /api/patient/emergency/status
- Calls getPatientSmartEmergencyStatus(userId)

#### GET /api/patient/profile
- Ensures bed_allocations table exists
- DB READ: SELECT patients JOIN users WHERE user_id
- DB READ: SELECT bed_allocations JOIN beds WHERE patient_id AND status='active' (current bed)
- DB READ: SELECT bed_allocations JOIN beds WHERE patient_id ORDER BY allocated_at DESC LIMIT 10 (history)
- On fail: getPatientProfile(userId) from demo store

#### PUT /api/patient/profile
- DB WRITE: UPDATE patients SET emergency_contact_name, emergency_contact_phone, address, city, state, zip_code
- DB WRITE: UPDATE users SET phone
- On fail: updatePatientProfile(userId, data) from demo store

#### GET /api/patient/queue-status
- DB READ: SELECT queues JOIN doctors JOIN users WHERE patient_id AND status != completed ORDER BY created_at DESC LIMIT 1
- On fail: getPatientQueueStatus(userId) from demo store

#### POST /api/patient/queue-status
- DB READ: SELECT patients WHERE user_id
- DB READ: SELECT MAX(queue_position) from queues WHERE doctor_id
- DB WRITE: INSERT into queues (doctor_id, patient_id, queue_position, priority, status='waiting')
- On fail: joinQueueForPatient(userId, doctorId, priority) from demo store

---

### Prescriptions Route

#### GET /api/prescriptions
- patient: DB READ: SELECT prescriptions JOIN doctors JOIN users WHERE patient_id
- doctor: DB READ: SELECT prescriptions JOIN patients JOIN users WHERE doctor_id
- admin: DB READ: SELECT all prescriptions with joins
- On fail: getPrescriptions(userId, role) from demo store

#### POST /api/prescriptions
- action='issue' (doctor): DB WRITE: INSERT into prescriptions
- action='refill' (patient): DB WRITE: INSERT into prescription_refills
- On fail: issuePrescription() or requestRefill() from demo store

#### PATCH /api/prescriptions
- action='update-status': DB WRITE: UPDATE prescriptions SET status
- action='approve-refill': DB WRITE: UPDATE prescription_refills SET status='approved', approved_date

---

### Billing Route (mock data only, no DB)

#### GET /api/billing
- Returns hardcoded mockBillings array filtered by role/status
- patient: filters by userId cookie
- doctor: filters by doctor name
- admin: all

#### POST /api/billing
- action='create': pushes to mockBillings array

#### PATCH /api/billing
- Updates status/paymentMethod on mockBillings

---

### Discharge Route (mock data only, no DB)

#### GET /api/discharge
- Returns mockDischarges filtered by role/status

#### POST /api/discharge
- action='initiate': pushes to mockDischarges

#### PATCH /api/discharge
- Updates discharge fields; sets dischargeDate on status='completed'

---

### Notifications Route (mock data only, no DB)

#### GET /api/notifications
- action='preferences': returns mockPreferences[userId]
- default: returns mockNotifications filtered by userId, optionally unread only

#### PATCH /api/notifications
- action='markRead': toggles read on single notification
- action='markAllRead': marks all for userId as read

#### POST /api/notifications
- action='updatePreferences': updates mockPreferences[userId]

---

### Reception Routes (require role=reception or admin)

#### POST /api/reception/add-patient
- Generates patient ID in DC{YEAR}{SEQ} format (e.g., DC2025001)
- Validates uniqueness with up to 5 attempts
- DB WRITE: INSERT into patient_pre_registration (patient_id_unique, first_name, last_name, phone, email, age, gender, address, created_by_receptionist_id, is_activated=false)

#### GET /api/reception/patients
- DB READ: Complex query - patients JOIN users LEFT JOIN visits (aggregated: count, last_date, scans)
- Supports search by name/phone/patient_id
- Returns: id, patientId, firstName, lastName, age, gender, phone, address, visitCount, scansDone, lastVisitDate

#### PUT /api/reception/patients
- DB WRITE: UPDATE users SET phone
- DB WRITE: UPDATE patients SET age, gender, address, city, state, zip_code, medical_history

#### GET /api/reception/queue
- DB READ: SELECT queues JOIN patients JOIN users JOIN doctors WHERE status IN (waiting, in-consultation)
- On fail: getReceptionQueues() from demo store

#### POST /api/reception/queue
- DB WRITE: INSERT into queues
- On fail: addQueueByReception() from demo store

#### GET /api/reception/emergency-response
- Returns getHospitalEmergencyInbox(userId) from demo store

#### POST /api/reception/emergency-response
- Calls acknowledgeHospitalEmergencyAlert(userId, {requestId, alertId, note})

---

## User Roles & Access Control

### Roles
- admin - Full system access
- doctor - Queue, prescriptions, discharge, emergency-response
- reception - Patient registration, queue management, emergency-response
- driver - Emergency dispatch console
- patient - Self-service portal

### Route Protection (middleware.ts)
| Path Prefix | Required Role |
|-------------|--------------|
| /admin/* | admin |
| /doctor/* | doctor |
| /reception/* | reception |
| /driver/* | driver |
| /patient/* | patient |
| /emergency | public |
| /auth/* | public |
| / | public |

---

## Pages - Complete Reference

### app/page.tsx (Home)
- Landing page with feature cards and demo credentials
- Calls GET /api/init on mount to initialize DB
- Links to /auth/login, /auth/register, /emergency

### app/layout.tsx
- Root layout with Geist fonts, Vercel Analytics
- Metadata: "Smart Hospital Management System"
- Viewport: theme-color for light/dark

### app/globals.css
- Tailwind base styles

---

### Auth Pages

#### /auth/login
- Email + password form
- POST /api/auth/login
- Role-based redirect after login: admin→/admin/dashboard, doctor→/doctor/queue, reception→/reception/dashboard, driver→/driver/dashboard, patient→/patient/dashboard
- Links to /auth/patient-setup and /auth/register

#### /auth/patient-setup
- Step 1: Enter patient ID (DC format) + optional password
- POST /api/auth/patient-login
- If requiresPasswordSetup=true → Step 2
- Step 2: Set new password + confirm
- POST /api/auth/patient-setup-password
- Redirects to /patient/dashboard

#### /auth/register
- Step 1: Choose role (doctor/reception/driver/admin)
- Step 2: Fill name, email, password, specialization (if doctor)
- POST /api/auth/register
- Role-based redirect after registration

---

### Admin Pages

#### /admin/dashboard
- Fetches GET /api/admin/stats every 30s
- Shows: visitsTodayCount, appointmentsTodayCount, emergencyCasesToday, totalBeds, availableBeds, patientsInQueue, doctorsOnDuty, totalPatients
- MetricCard components for 4 key stats
- Bed occupancy % and queue pressure % progress bars
- ActionTile grid linking to all admin sub-pages
- Logout: POST /api/auth/logout

#### /admin/analytics
- Fetches GET /api/admin/stats every 30s
- Fetches GET /api/admin/patient-data with ward/intakeType filters
- Time range selector (today/week/month) with multipliers
- Charts: AreaChart (hourly visits vs queue), RadialBarChart (bed occupancy), PieChart (department mix), BarChart (intake types)
- Clickable chart segments filter the patient data table
- Response timing benchmarks
- Uses Recharts via shadcn ChartContainer

#### /admin/beds
- Fetches GET /api/admin/beds every 20s
- Fetches GET /api/admin/patients for patient selector
- Filters: search, ward, bed type, availability
- PATCH /api/admin/beds for allocate/release
- Allocation dialog with full admission form (14 fields)
- Export: CSV and HTML/PDF via lib/export-utils

#### /admin/billing/dashboard
- Fetches GET /api/billing
- Shows total/paid/outstanding metrics
- Filter by status, sort by date/amount
- Export CSV

#### /admin/doctors
- Fetches GET /api/admin/doctors
- Filters: search, availability, specialization
- Sort: name, queue load, specialization
- Export CSV

#### /admin/emergency
- Fetches GET /api/admin/emergency every 15s
- Fetches GET /api/admin/doctors
- Filters: severity, status
- PATCH /api/admin/emergency for status update and doctor assignment
- Guard logic: critical+pending cases show only available doctors unless override enabled
- Expandable live tracker with progress bar and audit trail
- Export CSV and HTML/PDF

#### /admin/emergency-response
- Fetches GET /api/admin/emergency-response every 6s
- Shows: active requests, available ambulances, hospitals on network, average ETA
- Live request cards with ambulance, hospital, latest alert
- POST /api/admin/emergency-response to acknowledge alerts
- Ambulance fleet grid

#### /admin/patient-data
- Fetches GET /api/admin/patient-data with ward/intakeType filters
- Table with masked email/phone
- Filter by ward and intake type

#### /admin/patients
- Fetches GET /api/admin/patients
- Filters: search, blood type, allergies
- Sort: name, recent visits, patient ID
- Export CSV

---

### Doctor Pages

#### /doctor/queue
- Fetches GET /api/doctor/queue every 10s
- Fetches GET /api/doctor/emergency-response every 6s
- Expandable patient cards with mock health data (blood type, allergies, chronic conditions)
- Allergy warning alerts
- PATCH /api/doctor/queue to start consultation
- Inline emergency alert acknowledgement
- Clinical focus panel: triage load, risk flags, consulting now
- Safety checklist

#### /doctor/prescriptions
- Fetches GET /api/prescriptions
- POST /api/prescriptions (action='issue')
- PATCH /api/prescriptions (action='update-status')
- Issue prescription dialog with medication, dosage, frequency, duration, instructions

#### /doctor/discharge
- Fetches GET /api/discharge
- PATCH /api/discharge (action='complete')
- Discharge form: reason, procedures (one per line), follow-up instructions

#### /doctor/emergency-response
- Fetches GET /api/doctor/emergency-response every 6s
- POST /api/doctor/emergency-response to acknowledge alerts

---

### Driver Pages

#### /driver/dashboard
- Fetches GET /api/driver/emergency every 8s
- Live location sharing via navigator.geolocation.watchPosition
- PUT /api/driver/profile to push GPS coordinates (throttled to 25s)
- Status update buttons: acknowledge/en-route/hospital-notified/arriving/arrived
- POST /api/driver/emergency/update
- Emergency alert panel: POST /api/driver/emergency/alert
- Profile edit form: name, phone, shift status, fuel level, standby zone, equipment flags
- Navigation links to Google Maps for pickup/hospital
- Recent updates and hospital acknowledgements panels
- Performance stats: completed today, active cases, alerts sent today

---

### Emergency Page (Public)

#### /emergency
- No login required
- Stores requestId in localStorage
- POST /api/emergency/request to dispatch
- GET /api/emergency/status?requestId=N every 5s for tracking
- Shows: ambulance GPS, hospital selection, timeline, notifications
- Response readiness score
- Emergency guide tips

---

### Patient Pages

#### /patient/dashboard
- Fetches GET /api/patient/profile and GET /api/patient/queue-status every 10s
- Shows queue position, estimated wait, doctor info
- Quick actions: appointments, profile, history, emergency
- Care readiness score
- Health reminders

#### /patient/appointments
- Fetches GET /api/patient/appointments
- POST /api/patient/appointments to book
- Table of appointment history

#### /patient/billing
- Fetches GET /api/billing
- PATCH /api/billing to request payment
- Payment method selection dialog

#### /patient/discharge
- Fetches GET /api/discharge
- Shows completed discharge summaries
- Print discharge summary (opens print window)

#### /patient/emergency
- Fetches GET /api/patient/emergency/status every 5s
- POST /api/patient/emergency/request
- GPS location capture
- Full tracking view: ambulance, hospital, timeline, notifications

#### /patient/history
- Fetches GET /api/patient/appointments (completed only)
- Fetches GET /api/patient/bed-history
- Shows visit history and bed allocation history

#### /patient/notifications
- Fetches GET /api/notifications and GET /api/notifications?action=preferences
- PATCH /api/notifications (markRead/markAllRead)
- POST /api/notifications (updatePreferences)
- Tabs: unread/read
- Preferences dialog

#### /patient/prescriptions
- Fetches GET /api/prescriptions
- POST /api/prescriptions (action='refill')
- Tabs: active/past
- Prescription detail dialog with refill button

#### /patient/profile
- Fetches GET /api/patient/profile
- PUT /api/patient/profile to save contact/address fields
- Shows current bed allocation and bed history (read-only)
- Medical history is read-only (set by reception)

#### /patient/queue
- Fetches GET /api/patient/queue-status every 5s
- Shows position, estimated wait, doctor, priority, status, check-in time

---

### Reception Pages

#### /reception/dashboard
- Fetches GET /api/reception/queue every 15s
- Fetches GET /api/reception/emergency-response every 7s
- Stats: total, emergency, in-consultation, waiting, avg wait time
- Criticality level badge (High/Moderate/Normal)
- Emergency alert acknowledgement inline
- AddPatientForm component in header
- Consultation occupancy progress bar
- Front desk task board

#### /reception/patients
- Fetches GET /api/reception/patients with search
- PUT /api/reception/patients to update patient details
- Split view: search list + edit form
- Editable: age, gender, phone, address, city, state, zip, medical history

#### /reception/queue
- Fetches GET /api/reception/queue every 10s
- Shows all active queues with position, patient, doctor, priority, status, check-in time

#### /reception/emergency-response
- Fetches GET /api/reception/emergency-response every 6s
- POST /api/reception/emergency-response to acknowledge alerts

---

## Components

### components/admin/action-tile.tsx
- ActionTile: icon, title, description, onClick
- Used in admin dashboard control room grid

### components/admin/metric-card.tsx
- MetricCard: label, value, helper, tone (primary/secondary/critical/info), icon, onClick
- Gradient background based on tone
- Hover scale animation

### components/reception/add-patient-form.tsx
- Dialog with patient registration form
- POST /api/reception/add-patient
- Shows generated patient ID in large format
- Copy to clipboard and print card buttons
- Fields: firstName, lastName, phone, email (optional), age, gender, address

### components/theme-provider.tsx
- Wraps next-themes ThemeProvider

---

## Patient ID System (DC Format)

- Format: DC{YEAR}{SEQ} e.g., DC2025001
- Generated by reception via /api/reception/add-patient
- Stored in patient_pre_registration.patient_id_unique
- Patient uses this ID to login at /auth/patient-setup
- First login: no password needed → redirects to password setup
- After setup: user account created, patient record created, pre_registration marked activated
- Subsequent logins: ID + password

---

## Emergency Response System (Smart ER Engine)

### Flow
1. Patient/public submits emergency request with type, condition, GPS
2. System finds nearest available ambulance (Haversine distance)
3. Scores all hospitals (distance, bed availability, oxygen support)
4. Selects best hospital, calculates ETA
5. Creates DemoSmartEmergencyRequest with timeline and notifications
6. Ambulance marked as dispatched
7. Auto-progress simulation updates status over time
8. Driver can update status: ambulance-assigned → en-route → hospital-notified → arriving → arrived
9. Driver can send emergency alerts (patient-critical, route-blocked, requires-icu-prep, etc.)
10. Hospital team (admin/doctor/reception) acknowledges alerts
11. On 'arrived': ambulance freed, ETA set to 0

### Emergency Types
accident | cardiac | stroke | breathing | trauma | other

### Required Bed Types
- cardiac/stroke/breathing → ICU
- accident/trauma/other → general

### Alert Priority Levels
- normal: status updates
- emergency: driver alerts requiring hospital acknowledgement

---

## File Interaction Map

```
app/page.tsx
  → GET /api/init → lib/db.ts (CREATE tables, seed users)

app/auth/login/page.tsx
  → POST /api/auth/login → lib/db.ts + lib/auth.ts + lib/demo-store.ts

app/auth/patient-setup/page.tsx
  → POST /api/auth/patient-login → lib/db.ts
  → POST /api/auth/patient-setup-password → lib/db.ts + lib/auth.ts

app/admin/dashboard/page.tsx
  → GET /api/admin/stats → lib/db.ts + lib/demo-store.ts

app/admin/beds/page.tsx
  → GET /api/admin/beds → lib/db.ts + lib/demo-store.ts
  → GET /api/admin/patients → lib/demo-store.ts
  → PATCH /api/admin/beds → lib/db.ts (transaction) + lib/demo-store.ts

app/admin/analytics/page.tsx
  → GET /api/admin/stats → lib/db.ts + lib/demo-store.ts
  → GET /api/admin/patient-data → lib/db.ts + lib/demo-store.ts

app/admin/emergency/page.tsx
  → GET /api/admin/emergency → lib/demo-store.ts
  → GET /api/admin/doctors → lib/demo-store.ts
  → PATCH /api/admin/emergency → lib/demo-store.ts

app/admin/emergency-response/page.tsx
  → GET /api/admin/emergency-response → lib/demo-store.ts
  → POST /api/admin/emergency-response → lib/demo-store.ts

app/doctor/queue/page.tsx
  → GET /api/doctor/queue → lib/db.ts + lib/demo-store.ts
  → GET /api/doctor/emergency-response → lib/demo-store.ts
  → PATCH /api/doctor/queue → lib/db.ts + lib/demo-store.ts
  → POST /api/doctor/emergency-response → lib/demo-store.ts

app/driver/dashboard/page.tsx
  → GET /api/driver/emergency → lib/demo-store.ts
  → PUT /api/driver/profile → lib/demo-store.ts
  → POST /api/driver/emergency/alert → lib/demo-store.ts
  → POST /api/driver/emergency/update → lib/demo-store.ts

app/emergency/page.tsx
  → POST /api/emergency/request → lib/demo-store.ts
  → GET /api/emergency/status → lib/demo-store.ts

app/patient/emergency/page.tsx
  → POST /api/patient/emergency/request → lib/demo-store.ts
  → GET /api/patient/emergency/status → lib/demo-store.ts

app/patient/profile/page.tsx
  → GET /api/patient/profile → lib/db.ts + lib/demo-store.ts
  → PUT /api/patient/profile → lib/db.ts + lib/demo-store.ts

app/reception/dashboard/page.tsx
  → GET /api/reception/queue → lib/db.ts + lib/demo-store.ts
  → GET /api/reception/emergency-response → lib/demo-store.ts
  → POST /api/reception/emergency-response → lib/demo-store.ts
  → AddPatientForm → POST /api/reception/add-patient → lib/db.ts

app/reception/patients/page.tsx
  → GET /api/reception/patients → lib/db.ts
  → PUT /api/reception/patients → lib/db.ts

middleware.ts
  → lib/auth.ts (verifyToken, getAuthToken)
```

---

## Key Design Decisions

1. Demo fallback: Every API route catches DB errors and falls back to in-memory store, making the app fully functional without PostgreSQL
2. Patient ID format: DC{YEAR}{SEQ} (e.g., DC2025001) - reception-generated, not self-registered
3. Medical history: append-only text field, updated automatically on bed allocation/release events
4. Billing/Discharge/Notifications: mock data only (no DB persistence), suitable for demo
5. Smart ER: fully in-memory simulation with real algorithm (Haversine, hospital scoring, ETA calculation)
6. Driver location: GPS via browser geolocation API, pushed to demo store via PUT /api/driver/profile
7. PII masking: admin patient-data view masks email (first 2 chars) and phone (last 4 digits)
8. Emergency guard: critical+pending cases require available doctor unless admin enables override (with audit trail)
9. Transactions: bed allocation uses PostgreSQL transactions for atomicity
10. Auto-refresh: most pages poll their APIs every 5-30 seconds for live updates
