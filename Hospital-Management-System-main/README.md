# Hospital Management System

A full-stack, role-based Hospital Management System built with Next.js and TypeScript to streamline front-desk operations, doctor workflows, patient services, emergency handling, and admin analytics.

## Overview

This project provides a unified platform for hospital staff and patients with dedicated modules for:

- Admin management and analytics
- Doctor queue and prescription workflows
- Reception operations and patient onboarding
- Patient self-service portal
- Emergency intake and response

The current implementation primarily runs on Next.js API routes with PostgreSQL. A separate Express + MongoDB backend is also included under `backend/` as a legacy/alternate service layer.

## Key Features

## Role-Based Access and Authentication

- JWT-based authentication with role-aware redirects
- Route protection via middleware
- Isolated route scopes for `admin`, `doctor`, `reception`, and `patient`

## Reception Module

- Add and pre-register patients
- 11-digit patient ID workflow for first-time patient activation
- Queue and dashboard visibility for daily operations

## Doctor Module

- Doctor queue management
- Patient medical summary view
- Prescription and discharge related flows

## Patient Module

- Dashboard and profile views
- Appointment, queue, billing, discharge, and notification pages
- Patient login/setup flow with unique ID

## Admin Module

- Dashboards for patients, doctors, beds, billing, emergency, and analytics
- Search/filter enhancements
- Export utilities (CSV and printable HTML/PDF-style reports)

## Emergency Module

- Emergency request intake
- Priority/severity tracking
- Emergency response handling

## Tech Stack

- Frontend: Next.js 16 (App Router), React 19, TypeScript
- Styling/UI: Tailwind CSS, Radix UI-based component system
- Data layer (primary): PostgreSQL (`pg`)
- Auth/Security: `jsonwebtoken`, `bcryptjs`
- Optional legacy backend: Express + Mongoose (MongoDB)

## Project Structure

```text
app/                    Next.js app routes and API routes
components/             Shared UI and feature components
lib/                    Core utilities (db, auth, export helpers)
scripts/init-db.sql     PostgreSQL schema
backend/                Legacy/alternate Express backend
middleware.ts           Auth and role-based route protection
```

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 14+ (for primary app flow)
- (Optional) MongoDB for `backend/` services

## Getting Started

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

Create `.env.local` in the project root (or copy from `.env.example`):

```env
DATABASE_URL=postgresql://user:password@localhost:5432/hospital_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 3. Initialize PostgreSQL schema

Run the SQL script located at `scripts/init-db.sql` using your PostgreSQL client, for example:

```bash
psql "postgresql://user:password@localhost:5432/hospital_db" -f scripts/init-db.sql
```

## 4. Start development server

```bash
npm run dev
```

Open `http://localhost:3000`.

## 5. Seed demo users (optional)

Call:

- `GET /api/init`

This will create core tables (if missing) and seed demo accounts when the users table is empty.

## Demo Credentials

When seeded through `/api/init`, these demo accounts are created:

- Admin: `admin@hospital.com` / `admin123`
- Doctor: `doctor@hospital.com` / `doctor123`
- Reception: `reception@hospital.com` / `reception123`
- Patient: `patient@hospital.com` / `patient123`

## Available Scripts

- `npm run dev` - Run Next.js in development mode
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## API Highlights

Representative API groups include:

- `app/api/auth/*`
- `app/api/admin/*`
- `app/api/doctor/*`
- `app/api/reception/*`
- `app/api/patient/*`
- `app/api/emergency/*`
- `app/api/init`

See `PATIENT_11_DIGIT_FLOW.md` for detailed patient onboarding flow and endpoint examples.

## Optional Legacy Backend

A separate Express server exists in `backend/server.js` with Mongoose models and routes. If you plan to use it, define `MONGO_URI` in `backend/.env` and run it independently (for example, `node backend/server.js`).

## Notes and Known Warnings

With the current Next.js version, startup may show warnings related to deprecated config keys in `next.config.mjs` and middleware convention updates. These warnings do not necessarily prevent local development from running.

## Security Notes

- Use a strong `JWT_SECRET` in non-dev environments
- Never commit real secrets
- Replace demo accounts before production deployment
- Review auth middleware and API authorization boundaries before go-live

## Roadmap Ideas

- Remove deprecated Next.js config options for clean startup
- Consolidate data layer strategy (PostgreSQL vs MongoDB split)
- Add automated tests for auth, role guards, and critical API flows
- Add CI checks for lint, build, and migration validation

## License

No license file is currently defined in this repository.

If you want, I can also generate a shorter README variant focused on internship/final-year project submission format.
