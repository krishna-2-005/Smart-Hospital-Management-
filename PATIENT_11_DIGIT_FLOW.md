# Patient Registration & Login Flow - 11-Digit ID System

## Overview
Patients receive an 11-digit unique code from the receptionist on first arrival at the hospital. They use this code to login and set their password, then gain full access to patient services.

## Complete Workflow

### 1. **Receptionist: Generate Patient Code**
- Receptionist clicks "Add New Patient" button in their dashboard
- Fills in: First Name, Last Name, Phone (optional)
- System generates unique 11-digit code (format: `PXXXXXXXXXX`)
- Display shows the code in large format
- Receptionist can:
  - **Copy ID** to clipboard
  - **Print Card** with formatted code for patient

### 2. **Patient: First Login & Password Setup**
- Patient receives 11-digit code from receptionist
- Patient navigates to: `/auth/patient-setup`
- Enters:
  - **Patient ID**: The 11-digit code (e.g., `P1234567890`)
  - **Password**: Any password (used as temporary verification)
- System detects first-time login and shows password setup screen
- Patient must:
  - Enter desired password (min 6 chars)
  - Confirm password
  - Click "Setup Password & Login"
- System creates full user account and patient record
- Patient is automatically logged in and redirected to dashboard

### 3. **Patient: Subsequent Logins**
- Same login page: `/auth/patient-setup`
- Use Patient ID + password credentials
- Direct access to full patient module

## Database Schema

### New Table: `patient_pre_registration`
```sql
CREATE TABLE IF NOT EXISTS patient_pre_registration (
  id SERIAL PRIMARY KEY,
  patient_id_unique VARCHAR(11) UNIQUE NOT NULL,  -- 11-digit code
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  created_by_receptionist_id INTEGER REFERENCES users(id),
  is_activated BOOLEAN DEFAULT false,  -- Becomes true after password setup
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### 1. **Generate Patient Code**
- **Endpoint**: `POST /api/reception/add-patient`
- **Auth**: Receptionist only
- **Request**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1-555-1234"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Patient pre-registration created successfully",
    "patient": {
      "patientId": "P1234567890",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
  ```

### 2. **Patient Login**
- **Endpoint**: `POST /api/auth/patient-login`
- **Request**:
  ```json
  {
    "patientId": "P1234567890",
    "password": "anypassword"
  }
  ```
- **Response** (First time):
  ```json
  {
    "message": "First login detected",
    "requiresPasswordSetup": true,
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Response** (Activated):
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": 123,
      "patientId": "P1234567890",
      "firstName": "John",
      "role": "patient"
    }
  }
  ```

### 3. **Setup Password (First Time)**
- **Endpoint**: `POST /api/auth/patient-setup-password`
- **Request**:
  ```json
  {
    "patientId": "P1234567890",
    "password": "NewPassword123",
    "confirmPassword": "NewPassword123"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Account setup successful",
    "user": {
      "id": 123,
      "patientId": "P1234567890",
      "firstName": "John",
      "role": "patient"
    }
  }
  ```

## Frontend Components

### 1. **Receptionist Add Patient Form**
- **Location**: `components/reception/add-patient-form.tsx`
- **Features**:
  - Simplified form (just name and phone)
  - Displays generated 11-digit ID in large format
  - Copy to clipboard button
  - Print card for patient
  - Can generate multiple codes

### 2. **Patient Setup Page**
- **Location**: `app/auth/patient-setup/page.tsx`
- **Features**:
  - Two-step flow:
    1. Login with Patient ID + temporary password
    2. Password setup screen (if first time)
  - Validates password strength
  - Auto-login after setup
  - Back button to switch steps

## User Flow Diagram

```
Receptionist Dashboard
         ↓
   Click "Add New Patient"
         ↓
   Enter: First Name, Last Name, Phone
         ↓
   System Generates 11-Digit Code
         ↓
   Display Code + Copy/Print Options
         ↓
   Receptionist Gives Code to Patient
         ↓
Patient Goes to /auth/patient-setup
         ↓
   Enter: Patient ID + Password
         ↓
   System Detects First Login
         ↓
   Password Setup Screen Appears
         ↓
   Enter: New Password + Confirm
         ↓
   System Creates User & Patient Record
         ↓
   Auto-login to Dashboard
         ↓
Access Full Patient Module
```

## Security Considerations

1. **Unique ID Generation**: Validates uniqueness before creating record
2. **Two-Step Activation**: Code generated → Password set on arrival
3. **Password Requirements**: Min 6 characters
4. **Role-Based Access**: Only receptionists can generate codes
5. **Email Generation**: Uses `{patientId}@patient.local` as dummy email (ID is primary)
6. **Pre-registration Table**: Tracks non-activated patients

## File Changes Summary

### New Files
- `app/api/reception/add-patient/route.ts` - Generate codes
- `app/api/auth/patient-login/route.ts` - Patient login with ID
- `app/api/auth/patient-setup-password/route.ts` - First-time password setup
- `components/reception/add-patient-form.tsx` - Updated form component
- `app/auth/patient-setup/page.tsx` - Patient login/setup page

### Modified Files
- `scripts/init-db.sql` - Added `patient_pre_registration` table
- `app/reception/dashboard/page.tsx` - Added "Add New Patient" button

## Testing the Flow

1. **As Receptionist**:
   - Go to Reception Dashboard
   - Click "Add New Patient"
   - Enter: John, Doe, +1-555-1234
   - Copy or print the generated ID

2. **As Patient**:
   - Visit `/auth/patient-setup`
   - Enter Patient ID and any password
   - System shows password setup screen
   - Enter new password twice
   - Click "Setup Password & Login"
   - Redirected to patient dashboard

3. **Subsequent Login**:
   - Visit `/auth/patient-setup`
   - Enter Patient ID and actual password
   - Direct login to dashboard
