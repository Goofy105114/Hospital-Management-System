# Going Merry Hospital Management System (HMS)

A modular, high-reliability enterprise clinical platform built for modern hospital operations, outpatient department (OPD) queueing, electronic medical records (EMR), and administrative governance.

---

## 1. System Architecture

Going Merry HMS follows a decoupled client-server architecture with an integrated SQLite WAL database and role-based access control (RBAC).

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer (SPA)                     │
│  React 18 + Vite + Tailwind CSS + Design Tokens             │
│  - Clinical Light Theme & Approachable Rounded Geometry     │
│  - Role-gated Clinical Workspaces (Physician, Patient, etc) │
│  - Shared UI Primitives (Button, FormField, Badge, Card)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON / REST API (JWT Bearer)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Server Layer (API)                     │
│  Node.js + Express + TypeScript (ESM)                       │
│  - IAM-01 Authentication & Session Management               │
│  - Cryptographic Refresh Token Rotation & Family Tracking   │
│  - SEC-03 Immutable Security & Audit Logging Engine         │
│  - Concurrency & 5-Attempt Lockout Security Policy          │
└──────────────────────────────┬──────────────────────────────┘
                               │ SQLite DatabaseSync
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
│  SQLite (WAL Mode + Foreign Keys ON)                        │
│  - users, refresh_tokens, security_events, audit_logs       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Sprint & Module Roadmap (PRD & SOW Traceability)

The master project roadmap conforms to the **Going Merry HMS Master Engineering PRD**:

| Module | Feature Scope | Owner / Status | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **IAM** | **IAM-01 Authentication** | **✅ Completed (Current)** | Multi-role login, JWT pair, token rotation, 5-attempt account lockout, audit trail |
| **IAM** | IAM-02..05 Identity & Roles | Planned (Sprint 1) | Self-registration, MFA/step-up, permission management |
| **PAT** | PAT-01..04 Patient Management | Teammate Scope (Sprint 1) | Master Patient Index, MRN assignment, demographics, alerts |
| **SCH** | SCH-01..04 Doctor Scheduling | Teammate Scope (Sprint 1) | Clinic session schedules, room assignment, leave management |
| **APT** | APT-01..06 Appointments | Teammate Scope (Sprint 1-2) | Slot discovery, booking engine, rescheduling, waitlists |
| **QUE** | QUE-01..05 Queue & Triage | Teammate Scope (Sprint 2) | Patient check-in, token generation, live doctor calling |
| **EMR** | EMR-01..06 Clinical Records | Teammate Scope (Sprint 2-3) | Encounter documentation, vitals, diagnosis, e-prescriptions |
| **PHA** | PHA-01..04 Pharmacy | Teammate Scope (Sprint 3) | Formulary dispensing, barcode check, prescription queue |
| **INV** | INV-01..04 Inventory | Teammate Scope (Sprint 3) | Stock ledger, reorder levels, batch expiry tracking |
| **BIL** | BIL-01..05 Billing & Claims | Teammate Scope (Sprint 4) | Invoicing, fee schedules, payments, insurance claims |
| **SEC** | SEC-01..03 Governance & Audit | Baseline Active | Centralized audit log hooks, tamper-evident security events |

---

## 3. Getting Started

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **npm**: `v10.x` or higher

### Quickstart Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Goofy105114/Hospital-Management-System.git
   cd Hospital-Management-System
   ```

2. **Install all dependencies** (workspace root installs both client and server packages):
   ```bash
   npm install
   ```

3. **Start Development Environment**:
   ```bash
   npm run dev
   ```
   This concurrently boots:
   - **Backend API**: `http://localhost:5001`
   - **Frontend Clinical Portal**: `http://localhost:5173`

---

## 4. Test Accounts & Pre-Seeded Clinical Personas

The database automatically seeds with 10 demo clinical accounts across all roles:

| Role | Default Identifier | Default Password | Workspace Dashboard |
| :--- | :--- | :--- | :--- |
| **Physician** | `doctor.sharma@goingmerry.com` | `Doctor@123` | Doctor Consultation Desk & OPD Queue |
| **Patient** | `patient.john@goingmerry.com` | `Patient@123` | Patient Health Portal & Appointments |
| **Receptionist** | `reception@goingmerry.com` | `Reception@123` | Front Desk Triage & Walk-in Tokens |
| **Pharmacist** | `pharmacy@goingmerry.com` | `Pharmacy@123` | Pharmacy Dispensing & Formulary |
| **Nurse** | `nurse.mary@goingmerry.com` | `Nurse@123` | Clinical Inpatient Care Desk |
| **Administrator** | `admin@goingmerry.com` | `Admin@123` | Security Telemetry & User Governance |
| **Locked Account** | `locked.user@goingmerry.com` | `Locked@123` | Verifies lockout protection (IAM-01-S05) |
| **Suspended Account**| `suspended.user@goingmerry.com`| `Suspended@123` | Verifies suspension check (IAM-01-S03) |

> 💡 **Tip**: On the login screen, click the **"Test Accounts"** button in the top right to open the slide-over directory and auto-fill credentials with one click.

---

## 5. Development Guidelines for Teammates

### Design System & Shared Components
Per **PRD Section A.4.11**, all UI development must use the standardized tokens and components rather than hardcoded styles:

- **Design Tokens**: `client/src/tokens.ts` (colors, radii, typography)
- **UI Primitives**:
  - `<Button variant="primary|secondary|outline|danger|ghost">`
  - `<FormField label="..." hint="..." error="...">`
  - `<Input leftIcon={<Mail />} />`
  - `<Badge variant="success|warning|danger|doctor|patient|admin">`
  - `<Card>` / `<CardHeader>` / `<CardTitle>` / `<CardContent>`
  - `<RequireRole roles={['DOCTOR', 'ADMIN']}>`

### API Response Envelope Standard
Every backend response must conform to **PRD Section A.4.2**:

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-09-05T12:00:00.000Z"
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid identifier or password",
    "details": { ... }
  }
}
```

### Module Integration Slots
Pre-wired role landing pages in `client/src/workspaces/` contain clearly designated integration slots:
- `DoctorWorkspace.tsx`: Hook in `QUE-02` live token queue and `EMR-01` consultation notes.
- `PatientWorkspace.tsx`: Hook in `APT-03` appointment booking and `PAT-02` records.
- `ReceptionWorkspace.tsx`: Hook in `QUE-01` check-in validation and walk-in token printer.
- `PharmacyWorkspace.tsx`: Hook in `PHA-02` prescription dispensing and `INV-01` inventory.

---

## 6. Testing & Quality Assurance

Run the automated integration test suite:
```bash
npm test
```
The test suite validates:
- Credential validation by Email and E.164 phone
- JWT access token issue & cryptographically hashed refresh token rotation
- Account status enforcement (`ACTIVE`, `SUSPENDED`, `LOCKED`, `PENDING_VERIFICATION`)
- 5-attempt consecutive failed login lockout policy (IAM-01-S05)
- Full logout and refresh token invalidation
- Security event and audit trail logging (SEC-03)

### Production Build
Build all workspaces for deployment:
```bash
npm run build
```

---

## 7. License & Compliance
Proprietary — Developed for Going Merry Health System in conformance with PRD specifications, DISHA standards, and HIPAA electronic access controls.
