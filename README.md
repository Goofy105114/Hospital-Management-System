# Going Merry Hospital Management System (HMS)

> **Enterprise Clinical Care, Appointment, Queue, and Hospital Operations Platform**  
> Built strictly adhering to the 78 Business Requirements (BRDs) and 310 Scope of Work (SOW) line items across 16 core clinical, operational, and financial domains.

---

## 🏥 System Overview

The **Going Merry Hospital Management System** is a mission-critical healthcare application engineered with Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, TanStack Table, Recharts, Zod, Zustand, Prisma ORM on PostgreSQL, Upstash Redis (distributed locking & caching), Upstash QStash (event streaming), OpenRouter AI (clinical decision support), and Cloudinary object storage.

The frontend is styled using the **"Clinical Clarity"** design system (`DESIGN.md`), adhering directly to high-density medical workstations, accessible color tokens (Teal `#00685f`, Slate `#006398`, Emerald `#10B981`), and `Plus Jakarta Sans` typography.

---

## 📦 Core Modules Implemented (16 Domains)

| Code    | Domain                     | Key Capabilities & Features                                                                                                       |
| ------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **IAM** | Identity & Access          | RBAC across 10 clinical roles, JWT tokens, consecutive failed login lockout threshold (5 attempts).                               |
| **PAT** | Patient Management         | Patient Master Identity, MRN (`MRN-YYYY-XXXXXX`), emergency contacts, allergies, demographics.                                    |
| **SCH** | Scheduling Engine          | Clinic session management, real-time doctor availability calculator, appointment slot lead times.                                 |
| **APT** | Appointments               | 5-step booking wizard, status lifecycles, concurrency locking (`409` conflict prevention on double-booking).                      |
| **QUE** | Outpatient Queue           | Token sequencing (`#A-24`), dual display mode (waiting room big screen & staff console), Web Audio chimes, emergency triage bump. |
| **EMR** | Electronic Medical Records | Clinical encounters, baseline vitals ribbon with BMI, SOAP notes, ICD-10 search, digital signoff & immutable lock.                |
| **PHA** | Pharmacy Dispensary        | Prescription worklist, safety check integration, batch lot allocation with expiration checks, atomic stock deduction.             |
| **INV** | Inventory Management       | Stock On Hand table, append-only stock movement audit ledger, low-stock reorder alerts, batch receipts.                           |
| **DIA** | Diagnostics & Labs         | Laboratory test catalog, order backlog, specimen tracking, STAT priority flags, and printable PDF report preview.                 |
| **BIL** | Billing & Tariffs          | Automated charge aggregation, insurance co-pay calculation, itemized statements, and payment checkout.                            |
| **IPD** | Inpatient Wards            | Interactive color-coded bed occupancy grid (CCU, ICU, General Wards), patient admission, transfer, and discharge.                 |
| **REP** | Clinical BI & Analytics    | Recharts executive dashboards: daily OPD throughput, bed occupancy by ward, revenue streams, CSAT.                                |
| **ADM** | Administration             | SEC-03 immutable audit trail viewer (actor, role, action, entity, IP, diff), hospital policy configuration.                       |
| **AI**  | Clinical Intelligence      | OpenRouter AI assistant for clinical SOAP synthesis and wait-time estimation with deterministic fallback.                         |
| **SEC** | Security & Compliance      | SHA-256 password hashing, distributed locks via Redis, HIPAA pre-check-in verification, audit logging.                            |
| **DOC** | Developer Tooling          | Swagger UI / OpenAPI 3.0 interactive specification explorer at `/api/docs`.                                                       |

---

## 🛠 Tech Stack

- **Framework**: Next.js 14.2.5 (App Router, Server Components & Route Handlers)
- **Language**: TypeScript 5.5 (Strict type checking)
- **Styling**: Tailwind CSS v3.4 + shadcn/ui components
- **Database & ORM**: PostgreSQL + Prisma ORM 5.22
- **State & Data Fetching**: Zustand 4.5 & TanStack React Query v5
- **Forms & Validation**: React Hook Form + Zod
- **Visualizations**: Recharts 2.12
- **Concurrency & Cache**: Upstash Redis (Distributed locks)
- **Background Jobs**: Upstash QStash (Asynchronous event dispatching)
- **AI Integration**: OpenRouter API (with sub-500ms deterministic rule fallbacks)
- **Unit & Integration Testing**: Vitest 2.1 + JSDOM
- **API Documentation**: OpenAPI 3.0 + Swagger UI

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js 18.17+ or 20+ (Tested on Node.js 24)
- npm or pnpm

### 2. Environment Setup

Copy the environment template:

```bash
cp .env.example .env
```

_(Note: The system features built-in deterministic fallbacks, allowing all pages, queues, AI estimations, and tests to run immediately in offline/local environments without requiring external third-party API keys)._

### 3. Database & Prisma Client

```bash
npx prisma generate
```

### 4. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running Automated Tests & Code Quality

```bash
# Run Vitest test suite (16 tests across 5 suites including React Testing Library)
npm test

# Check code formatting with Prettier
npm run format:check

# Format codebase with Prettier
npm run format

# Run ESLint linter
npm run lint

# Run TypeScript compilation check
npx tsc --noEmit
```

Runs 16 automated unit, integration, and UI component tests across:

- `tests/ui-components.test.tsx`: React Testing Library UI unit tests verifying Button, Badge, Card, and TanStack DataTable.
- `tests/api-envelope.test.ts`: Envelope structure verification (`{ success, data, meta }` / `{ success, error }`).
- `tests/safety-check.test.ts`: Allergy conflicts & severe drug-drug interaction detection.
- `tests/concurrency-lock.test.ts`: Distributed concurrency locks & collision rejection.
- `tests/queue-logic.test.ts`: Queue sequence generation & wait time estimation rules.

### 6. Production Build

```bash
npm run build
```

Compiles and optimizes all 47 routes, sub-pages, dynamic routes, and API endpoints with 0 errors.

---

## 🖥 Complete Application Routes & Sub-Pages

### Patient Portal & Outpatient Care

- `/`: Patient Dashboard & Health Overview (`REP-01`, upcoming visits, active queue token, medication adherence tracker)
- `/appointments`: My Appointments List & Pre-Visit Checklist
- `/appointments/book`: 5-Step Appointment Booking Wizard
- `/appointments/[id]`: Appointment Details with Live Queue Active Banner, Vitals, Milestones, and Facility Map
- `/queue`: Live Outpatient Queue Pass (`QUE-03 Patient View` with position counter, progress bar, audio chime, and big-screen TV switch)
- `/medical-records`: Electronic Health Records (Biomarker panels, ECG report, official PDF modal preview)
- `/prescriptions`: Patient Medication Hub (Active regimens, adherence tracking, pharmacy pickup QR pass)
- `/reports`: Patient Diagnostic Lab & Test Reports Portal (`DIA-05`, analyte findings, reference ranges, pathologist impression)
- `/billing`: Patient Invoices & Co-Pay Payment Hub (`BIL-04`, itemized statement, online checkout, instant receipt)
- `/notifications`: Patient Notification Center (`NOT-01..03`, real-time alerts, channel preferences, consent management)
- `/profile`: Patient Demographics, Emergency Contacts & Health Insurance
- `/help`: 24/7 Clinical Support Hotline & Triage FAQs

### Reception, Queue & Kiosks

- `/patients`: Patient Directory & Active OPD Registry
- `/patients/register`: Walk-in & Reception Patient Intake Form (generates MRN)
- `/patients/[id]`: Patient 360° Comprehensive Chart (Clinical Alerts, Document Vault, Duplicate Merge, Break-Glass Emergency Override)
- `/schedules`: Doctor Clinic Session Rosters, Blackout Dates, Room Conflict Matrix
- `/queue/kiosk`: Touch-Optimized Self-Service Arrival Kiosk with Thermal Token Slip Generator
- `/queue/display`: Waiting Room Big-Screen TV Display Board with Web Audio API Turn Chime

### Clinical Workspaces

- `/doctor`: Clinician Consultation Desk (SOAP editor, AI Assistant, ICD-10, E-Prescribing, Lab orders)
- `/doctor/encounters/[id]`: Signed Clinical Encounter Summary with SHA-256 Digital Certificate

### Pharmacy & Supply Logistics

- `/pharmacy`: Dispensary Console (Safety check overrides, batch allocation, atomic dispense)
- `/pharmacy/medicines`: Hospital Drug Formulary & ATC Classification Catalog
- `/inventory`: Supply Command (Stock on hand table, append-only movement ledger)
- `/inventory/purchase-orders`: Procurement PO Register & Goods Receipt Note (GRN) Intake
- `/inventory/batches`: Batch Lot Expiry & FEFO Quarantine Tracker

### Diagnostics & Inpatient Operations

- `/diagnostics`: Laboratory & Diagnostic Workstation (Sample collection, EHR release)
- `/diagnostics/catalog`: Diagnostic Test & Tariff Master Catalog
- `/diagnostics/orders/[id]`: Specimen Workstation & Analyte Result Entry Gate
- `/inpatient`: Ward & Bed Grid across CCU, ICU, and General Wards (Admit, transfer, discharge)
- `/inpatient/admissions`: Inpatient Admission Register & Discharge Coordination

### Billing & Revenue

- `/billing`: Hospital Billing & Cashier Desk (Statement breakdown, payment checkout)
- `/billing/claims`: Third-Party Insurance & TPA Claims Tracker
- `/billing/invoices/[id]`: Itemized Tax Invoice & Printable Voucher

### Administration, Security & IAM

- `/admin`: SEC-03 Immutable Audit Trail Viewer & Hospital Policy Configuration
- `/admin/users`: Staff User Lifecycle & RBAC Role Management
- `/admin/departments`: Clinical Department & Facility Room Configuration
- `/login`: Unified Authentication Portal with 1-Click Persona Demo Switcher
- `/register`: Patient Self-Registration with OTP Verification
- `/forgot-password`: Self-Service Password Recovery with Complexity Validation & Session Revocation
- `/api/docs`: Interactive Swagger UI / OpenAPI 3.0 Documentation Explorer
- `/api/openapi.json`: Machine-Readable OpenAPI 3.0 Specification
