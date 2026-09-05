# Going Merry Hospital Management System (HMS)

An enterprise-grade, NABH-compliant Hospital Information and Clinical Management System (HIMS) built with **Next.js (App Router), React, Prisma ORM, PostgreSQL (Neon DB / Azure), Upstash Redis, Upstash QStash, Tailwind CSS + shadcn/ui, TanStack Query/Table, and Vitest**.

---

## 1. System Architecture

Going Merry HMS provides a unified full-stack architecture running seamlessly on Next.js 14 App Router:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Clinical User Experience (Web Layer)                 │
│  Next.js App Router + React + Tailwind CSS + shadcn/ui Design Tokens   │
│  - Professional Clinical Light Palette (Slate / Hospital Teal / Navy)  │
│  - Role-Tailored Workspaces (Physician, Reception, Pharmacy, Admin)    │
│  - TanStack React Query + React Hook Form + Zod Validation             │
│  - TanStack Table & Recharts Security Analytics                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Axios / REST API (JWT Bearer)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Hospital API & Backend Core Services                 │
│  Next.js Server API Routes (/api/v1/*) + Node.js 20+ Runtime           │
│  - IAM-01 Authentication & Session Management                          │
│  - Stateless Access Tokens (15m) + Cryptographic Refresh Rotation (7d) │
│  - Brute-Force Lockout Defense (5 attempts / 30 mins)                  │
│  - OpenAPI / Swagger Interactive Documentation (/api/docs)             │
│  - OpenRouter AI Integration Hook & Cloudinary Object Storage Hook     │
└───────────────────┬───────────────────┬────────────────────────────────┘
                    │                   │
                    ▼                   ▼
┌───────────────────────────┐ ┌──────────────────────────────────────────┐
│   Caching & Messaging     │ │           Database Layer                 │
│  - Upstash Redis (Cache)  │ │  PostgreSQL (Neon DB / Azure) via Prisma │
│  - Upstash QStash (Queue) │ │  - Users, RefreshTokens, SecurityEvents, │
│  - In-Memory Fallback     │ │    AuditLogs (Enums: Role, Status)       │
└───────────────────────────┘ └──────────────────────────────────────────┘
```

---

## 2. Sprint & Module Roadmap (PRD Traceability)

In accordance with the **Going Merry HMS Master Engineering PRD**:

| Module | Feature Scope | Owner / Status | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **IAM** | **IAM-01 Authentication** | **✅ Completed (Current)** | Multi-role login, JWT pair, family token rotation, 5-attempt lockout, audit logs |
| **IAM** | IAM-02..05 Identity & Roles | Planned (Sprint 1) | Self-registration, MFA/step-up, granular permission matrices |
| **PAT** | PAT-01..04 Patient Management | Teammate Scope (Sprint 1) | Master Patient Index, MRN assignment, demographics, alerts |
| **SCH** | SCH-01..04 Doctor Scheduling | Teammate Scope (Sprint 1) | Clinic session schedules, consultation room assignment |
| **APT** | APT-01..06 Appointments | Teammate Scope (Sprint 1-2) | Slot discovery, booking engine, rescheduling, waitlists |
| **QUE** | QUE-01..05 Queue & Triage | Teammate Scope (Sprint 2) | Patient check-in, token generation, live doctor calling |
| **EMR** | EMR-01..06 Clinical Records | Teammate Scope (Sprint 2-3) | Encounter documentation, vitals, diagnosis, e-prescriptions |
| **PHA** | PHA-01..04 Pharmacy | Teammate Scope (Sprint 3) | Formulary dispensing, barcode verification, order fulfillment |
| **INV** | INV-01..04 Inventory | Teammate Scope (Sprint 3) | Stock ledger, reorder thresholds, batch expiry tracking |
| **BIL** | BIL-01..05 Billing & Claims | Teammate Scope (Sprint 4) | Invoicing, fee schedules, payments, insurance claims |
| **SEC** | SEC-01..03 Governance & Audit | Baseline Active | Centralized audit log hooks, tamper-evident security telemetry |

---

## 3. Technology Stack

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/) + React 18
- **Styling**: Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/) component primitives
- **State Management & Caching**: [Zustand](https://zustand-demo.pmnd.rs/) (session persistence) & [TanStack React Query](https://tanstack.com/query)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Data Tables & Charts**: [TanStack Table](https://tanstack.com/table) + [Recharts](https://recharts.org/)
- **API Client**: [Axios](https://axios-http.com/) with automatic 401 refresh interceptor
- **Database & ORM**: [Prisma ORM](https://www.prisma.io/) with [PostgreSQL (Neon DB / Azure PostgreSQL)](https://neon.tech/)
- **Redis & Queues**: [Upstash Redis](https://upstash.com/docs/redis) (caching) & [Upstash QStash](https://upstash.com/docs/qstash) (background message queues)
- **AI Integration**: [OpenRouter API](https://openrouter.ai/) for clinical decision support hooks
- **Object Storage**: [Cloudinary](https://cloudinary.com/) for medical documents and scan storage
- **API Documentation**: OpenAPI / Swagger 3.0 via `/api/docs`
- **Testing**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/)
- **Code Quality**: ESLint + Prettier + TypeScript strict mode + GitHub Actions CI

---

## 4. Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Goofy105114/Hospital-Management-System.git
   cd Hospital-Management-System
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your connection credentials:
   ```bash
   cp .env.example .env
   ```

4. **Initialize Prisma (Optional for local PostgreSQL)**:
   ```bash
   npx prisma generate
   # If connected to live Neon DB/Azure:
   npx prisma db push
   ```
   *(Note: The system contains an automatic high-resilience in-memory fallback for all 10 clinical personas so development and testing can proceed seamlessly even when offline).*

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Test Accounts & Clinical Personas

The system includes pre-configured clinical personas across all key hospital workflows:

| Role | Default Identifier | Default Password | Workspace Capabilities |
| :--- | :--- | :--- | :--- |
| **Doctor** | `doctor.sharma@goingmerry.com` | `Doctor@123` | OPD queue call, active encounter notes, appointment overview |
| **Patient** | `patient.john@goingmerry.com` | `Patient@123` | Personal health portal, upcoming consultations, MRN GM-2026-88194 |
| **Receptionist** | `reception@goingmerry.com` | `Reception@123` | Patient check-in, triage desk, walk-in token issuance |
| **Pharmacist** | `pharmacy@goingmerry.com` | `Pharmacy@123` | Medication verification, e-prescriptions, stock status |
| **Nurse** | `nurse.mary@goingmerry.com` | `Nurse@123` | Inpatient care, vitals observation desk |
| **Administrator** | `admin@goingmerry.com` | `Admin@123` | User directory table, security event audit log, access governance |
| **Locked User** | `locked.user@goingmerry.com` | `Locked@123` | Verifies 5-attempt brute force lockout protection |
| **Suspended User**| `suspended.user@goingmerry.com` | `Suspended@123` | Verifies account suspension handling |
| **Unverified User**| `unverified.user@goingmerry.com` | `Pending@123` | Verifies unverified account gating |

---

## 6. Verification & Quality Assurance

Run the automated test suite:
```bash
npm test
```

Run code formatting and lint verification:
```bash
npm run lint
```

Execute production build:
```bash
npm run build
```

---

## 7. Integration Guidelines for Teammates

This repository provides the core authentication, RBAC, session management, and UI component foundation. Teammates building subsequent modules (e.g., PAT, SCH, APT, QUE, EMR, PHA, BIL) should follow these patterns:

1. **API Endpoints**: Place new route handlers in `app/api/v1/<module>/route.ts`. Use standard response envelopes via `lib/envelope.ts` (`apiSuccess`, `apiError`).
2. **Database Models**: Add entity definitions to `prisma/schema.prisma` and run `npx prisma generate`.
3. **Data Fetching**: Use TanStack React Query (`useQuery`, `useMutation`) with the configured Axios client in `lib/api.ts`.
4. **UI Components**: Use the shared shadcn/ui primitives in `components/ui/` (`Button`, `Card`, `Badge`, `Input`, `FormField`).
5. **Session & Auth Context**: Access current user identity and tokens from `useAuthStore()` (`store/auth.store.ts`).
