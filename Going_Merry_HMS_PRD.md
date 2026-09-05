# Going Merry HMS — Master Engineering PRD Pack

**Project:** Going Merry Hospital Management System (HMS)
**Scope Basis:** 78 BRD Features → 310 SOW/SRS Delivery Items → 16 Modules
**Purpose of this document:** This is the single source of truth for *how to build* the System. It is split into two layers:

1. **PART A — Super PRD**: shared architecture, conventions, data model rules, API rules, and the module map. **Every engineer reads this before touching any feature PRD.** This is what makes work done by different people on different features actually fit together without an integration nightmare.
2. **PART B — Feature PRDs**: one standalone, fully-specced PRD per BRD Feature (78 total, grouped into 16 modules). Each feature PRD is self-contained: objective, user stories, functional requirements, API contract, data model, business rules, edge cases, and acceptance criteria — so a person can be handed *just their feature's PRD* and build against it, and it will interoperate with everyone else's.

> How to use this file: find your assigned Feature ID (e.g. `APT-03`) using Ctrl+F, read PART A once, then build strictly against your Feature PRD's contract. If your feature depends on another (see "Depends On" in each PRD), read that feature's **Data Model** and **API Contract** sections only — not its full PRD — to integrate correctly.

---

# PART A — SUPER PRD (Shared Foundation)

## A.1 Product Summary

A complete, non-MVP hospital management platform covering: patient registration → appointment booking → check-in/token/queue → clinical consultation/EMR → diagnostics → prescription → pharmacy dispensing → inventory → billing → inpatient (practical subset) → notifications → role dashboards/reporting → admin/config → AI decision-support (advisory only) → security/compliance. Single-facility deployment. Deployed on Microsoft Azure. Modular monolith architecture (not microservices) unless a specific module is later split out with justification.

Four modules are **Primary Scope** (highest priority, deepest testing, changes here are always high-impact): **Appointments (APT)**, **Queue (QUE)**, **Pharmacy (PHA)**, **Inventory (INV)**.

## A.2 Assumed Technology Stack

*(Not fixed by the governing document at the language/framework level — this is the assumed stack for all feature PRDs below. If your team already has a different stack agreed, keep the contracts in Part B identical and just re-implement in your stack — the JSON contracts, table shapes, and enums are what must stay fixed.)*

| Layer | Choice |
|---|---|
| Backend | Node.js + NestJS (modular, decorator-based — maps 1:1 onto "module = bounded domain") |
| Backend Language | TypeScript (strict mode) |
| Primary Database | PostgreSQL (relational, transactional integrity for booking/queue/stock) |
| Object/File Storage | Azure Blob Storage (documents, reports, images) |
| Cache / Locks | Redis (distributed locks for concurrency-sensitive ops: slot booking, queue token issuance, stock deduction) |
| Async Messaging | Azure Service Bus (queue-state events, notifications, low-stock alerts) |
| Frontend | React 18 + TypeScript + Vite |
| Styling | TailwindCSS + a single shared design-token file (see A.7) |
| State/Data-fetching | TanStack Query (React Query) for all API calls — no ad-hoc fetch in components |
| Auth | JWT (access + refresh token pair), issued by IAM module |
| API Style | REST, JSON, versioned under `/api/v1/` |
| AI Layer | Isolated service behind `/api/v1/ai/*`, called only server-to-server from other modules, never directly from frontend |
| Deployment | Azure App Service (or AKS if containerized) + Azure Database for PostgreSQL + Azure Blob + Azure Service Bus + Azure Monitor |
| CI/CD | GitHub Actions → build → test → deploy to Dev → Test/UAT → Production-oriented, per environment in Section A.9 |

## A.3 Module Map (16 Modules, 78 Features)

| Code | Module | Features | Scope Tier |
|---|---|---|---|
| IAM | Identity, Access & Account Management | IAM-01..05 | Platform |
| PAT | Patient Management | PAT-01..04 | Core Supporting |
| APT | Appointments & Referrals | APT-01..06 | **Primary** |
| SCH | Doctor Scheduling & Capacity | SCH-01..04 | Core Supporting |
| QUE | Check-in, Token & Queue Management | QUE-01..06 | **Primary** |
| EMR | Clinical Encounter / EMR | EMR-01..06 | Core Supporting |
| DIA | Diagnostics — Lab & Radiology | DIA-01..05 | Controlled Supporting |
| PHA | Pharmacy & Medication Dispensing | PHA-01..05 | **Primary** |
| INV | Inventory & Procurement | INV-01..06 | **Primary** |
| BIL | Billing & Payments | BIL-01..06 | Controlled Supporting |
| IPD | Inpatient / Ward Management | IPD-01..05 | Controlled Supporting |
| NOT | Notifications & Communications | NOT-01..03 | Core Supporting |
| REP | Dashboards, Reporting & Analytics | REP-01..05 | Core Supporting |
| ADM | Administration & Configuration | ADM-01..04 | Platform |
| AI | AI Decision Support | AI-01..04 | Core Supporting |
| SEC | Security, Privacy & Compliance | SEC-01..04 | Core Supporting |

## A.4 Cross-Cutting Conventions (apply to EVERY feature PRD in Part B)

### A.4.1 Entity ID & Timestamp Convention
Every database table has:
```
id           UUID PRIMARY KEY (v4, generated server-side, never client-supplied)
created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at   TIMESTAMPTZ NOT NULL DEFAULT now() (auto-updated on write)
created_by   UUID (FK -> users.id, nullable only for system-seeded rows)
updated_by   UUID (FK -> users.id)
```
Human-facing identifiers (MRN, appointment number, token number, invoice number) are **separate** generated fields, never the primary key. Format conventions are specified per-feature in Part B.

### A.4.2 API Envelope (ALL endpoints, no exceptions)
Success:
```json
{ "success": true, "data": { }, "meta": { "timestamp": "ISO8601" } }
```
List/paginated success:
```json
{ "success": true, "data": [ ], "meta": { "page": 1, "pageSize": 20, "totalItems": 143, "totalPages": 8 } }
```
Error:
```json
{ "success": false, "error": { "code": "SOME_MODULE_ERROR_CODE", "message": "Human-readable message", "details": { } } }
```
Error `code` values are `SCREAMING_SNAKE_CASE`, namespaced per module (e.g. `APT_SLOT_ALREADY_BOOKED`, `QUE_TOKEN_ALREADY_CALLED`, `INV_INSUFFICIENT_STOCK`). Every feature PRD's API Contract section lists its own error codes — **do not invent ad-hoc error shapes.**

### A.4.3 HTTP Status Code Rules
`200` read/update ok · `201` created · `204` deleted/no-content · `400` validation error · `401` not authenticated · `403` not authorized (role/scope) · `404` not found · `409` conflict (concurrency — e.g., double-booking) · `422` business-rule violation (semantically valid but not allowed) · `500` unhandled server error (must always be logged with a correlation ID).

### A.4.4 Auth & Headers (every protected endpoint)
```
Authorization: Bearer <JWT access token>
X-Request-Id: <uuid, client or gateway generated, for tracing>
```
JWT payload minimum claims: `sub` (user id), `role`, `roleScopes` (department/record scope where applicable), `exp`, `iat`. Token TTL: access = 15 min, refresh = 7 days, refresh rotation on use. All authorization decisions are re-verified server-side on every request (SEC-01) — the frontend hiding a button is UX only, never a security control.

### A.4.5 Roles (canonical enum — used everywhere, do not create module-local role names)
```
PATIENT, RECEPTIONIST, DOCTOR, NURSE, PHARMACIST, LAB_TECH, RADIOLOGIST,
INVENTORY_MANAGER, BILLING_STAFF, ADMIN, MANAGEMENT, SUPER_ADMIN
```
Each feature PRD's "Business Rules" section states which roles may call which endpoints. A role not listed for an endpoint gets `403 UNAUTHORIZED_ROLE`.

### A.4.6 Pagination, Filtering, Sorting (all list endpoints)
Query params: `?page=1&pageSize=20&sortBy=fieldName&sortDir=asc|desc&filter[field]=value`. Default `pageSize=20`, max `100`. Every list endpoint in Part B implicitly supports this even where not repeated.

### A.4.7 Soft Delete
No hard deletes on clinical, financial, or audit-relevant records (Patients, Appointments, Encounters, Prescriptions, Invoices, Inventory transactions). These use `deleted_at TIMESTAMPTZ NULL` + `is_active` where relevant. Hard delete is permitted only for draft/unsent, non-auditable rows explicitly marked in a feature's Data Model.

### A.4.8 Audit Logging (mandatory hook, see SEC-03 for the service contract)
Every create/update/delete/approve/access action on Patient, Clinical, Prescription, Inventory, or Billing data MUST emit an audit event:
```json
{ "actorId": "uuid", "actorRole": "string", "action": "CREATE|UPDATE|DELETE|APPROVE|VIEW", "entityType": "string", "entityId": "uuid", "timestamp": "ISO8601", "changes": { "before": {}, "after": {} } }
```
Feature PRDs mark which of their endpoints are audit-mandatory with 🔒**AUDIT**.

### A.4.9 Concurrency-Protected Operations (state integrity — non-negotiable per SOW §9.2)
The following classes of operation MUST use a DB transaction + row-level lock (`SELECT ... FOR UPDATE`) or a Redis distributed lock keyed on the contended resource, and must return `409 CONFLICT` (with a specific error code) rather than silently corrupting state:
- Appointment slot booking (one doctor/slot = one confirmed booking)
- Queue token issuance and state transitions (no double-calling, no skipping invalid states)
- Inventory stock mutations (dispense, transfer, adjustment, goods receipt) — ledger must never go negative unexpectedly
Each relevant feature PRD flags this explicitly with 🔐**CONCURRENCY-CRITICAL**.

### A.4.10 AI Fallback Rule (applies to every workflow that consults AI-01..04)
Any endpoint that optionally enriches its response with an AI Decision Support output MUST work fully with `aiEnabled=false`/AI service down — return the deterministic rule-based value and set `"source": "fallback"` in the response instead of `"source": "ai_model"`. This is enforced in the relevant feature PRDs (waiting time, no-show risk, queue ordering hints, reorder suggestions).

### A.4.11 Frontend Conventions (so multiple people's screens compose)
- Design tokens (colors, spacing, radii, font scale) live in one shared `tokens.ts` / Tailwind config — never hardcode hex values in a feature's components.
- Every list screen: table/list + filter bar + pagination footer, using the shared `<DataTable>` and `<Pagination>` components.
- Every form: shared `<FormField>` wrapper (label, error, hint) bound to a shared validation library (zod schemas — **the same zod schema used for a resource's create/update DTO should be shared or mirrored between frontend and backend** to avoid drift).
- Every role-gated UI element is wrapped in a shared `<RequireRole roles={[...]}>` component — never an ad-hoc `if (user.role === ...)` scattered in JSX.
- Toast/notification, modal, and confirm-dialog are shared components — a feature never rolls its own.

### A.4.12 Naming Conventions
- DB tables: `snake_case`, plural (`appointments`, `queue_tokens`).
- API paths: `kebab-case`, plural nouns (`/api/v1/appointments`, `/api/v1/queue-tokens`).
- JSON fields: `camelCase`.
- Enums: `SCREAMING_SNAKE_CASE` string values (never raw integers for status — integers can't be read in logs/DB browsers).

## A.5 Shared Core Entities (own these carefully — many features reference them; do not redefine them locally)

| Entity | Owning Feature | Key Fields (non-exhaustive; full field list in owning feature's Data Model) |
|---|---|---|
| `User` | IAM-01/02 | id, email, phone, passwordHash, role, status, mrn (if patient) |
| `Patient` (extends User) | PAT-01 | id, userId, mrn, demographics, alerts |
| `Doctor` (extends User) | SCH-01 | id, userId, specialization, departmentId |
| `Department` | ADM-01 | id, name, code |
| `Appointment` | APT-03 | id, patientId, doctorId, slotStart, slotEnd, status |
| `QueueToken` | QUE-02 | id, appointmentId (nullable for walk-in), tokenNumber, status, priority |
| `Encounter` | EMR-01 | id, patientId, doctorId, appointmentId, status |
| `Prescription` | EMR-05 | id, encounterId, items[] |
| `MedicineItem` | PHA-02 / INV-01 | id, name, form, dosage, isActive |
| `StockLedgerEntry` | INV-03 | id, itemId, locationId, quantityDelta, reason, refType, refId |
| `Invoice` | BIL-02 | id, patientId, encounterId, lineItems[], status |
| `NotificationEvent` | NOT-02 | id, recipientId, channel, templateId, status |

Any feature that touches one of these entities **reads/writes through the owning feature's service/repository layer** — never a second, independent write path to the same table. This is what keeps a frontend/backend pair built by different people consistent.

## A.6 Environments (per SOW §11)

| Env | Purpose | URL pattern |
|---|---|---|
| Development | active dev/integration | `dev.hms.internal` |
| Test/UAT | Sprint demo + client UAT | `uat.hms.internal` |
| Production-oriented | real operational use | `app.<client-domain>` |

## A.7 Design Tokens (starter — expand, don't fork)
```
--color-primary: (brand blue)      --color-danger: (status red)
--color-success: (status green)    --color-warning: (status amber)
--radius-sm: 4px  --radius-md: 8px --radius-lg: 16px
--space-1..8: 4px..64px (4px scale)
--font-scale: 12/14/16/20/24/32
```

## A.8 Sprint-to-Module Traceability (for planning only — full detail in SOW §8, not restated here)
Sprint 1: IAM, PAT, SCH, APT(01-03) · Sprint 2: APT(04-06), QUE, NOT(01-02), EMR(01,02,04) · Sprint 3: EMR(03,05,06), PHA, INV · Sprint 4: BIL(01,02,04), REP, ADM-01, SEC(01,03), AI-01/02/04.

## A.9 Definition of Done (applies to every Feature PRD below — repeated per-feature as a checklist)
1. Endpoints match the API Contract exactly (path, method, request/response shape, status codes, error codes).
2. DB schema matches Data Model (types, constraints, indexes on FKs and frequently-filtered columns).
3. All Business Rules enforced server-side (never trust client validation alone).
4. All Edge Cases handled with the specified error code/behavior.
5. RBAC enforced per the endpoint's allowed-roles list.
6. Audit events emitted where marked 🔒**AUDIT**.
7. Concurrency protection implemented where marked 🔐**CONCURRENCY-CRITICAL**.
8. Unit tests for validators/business rules; integration test for the happy path + each documented edge case.
9. Frontend built with shared components/tokens per A.4.11, and calls only the documented API contract (no undocumented endpoints).
10. Acceptance Criteria checklist (in each Feature PRD) fully checked off.

---

# PART B — FEATURE PRDs

---

## MODULE: IAM — Identity, Access & Account Management (Platform Scope)

**Module Owns:** `users`, `roles`, `sessions`, `consents` tables. All other modules depend on IAM for `Authorization` header verification — no module implements its own login.

---

### IAM-01 — Patient and Staff Authentication

**Objective:** Let any registered user (patient or staff) securely log in and obtain a session, and let the system detect/log failed or suspicious login attempts.

**User Stories:**
- As a patient, I log in with email/phone + password to reach my dashboard.
- As staff, I log in with a role-aware entry point that routes me to my role's dashboard.
- As a security admin, I can see failed-login patterns.

**Functional Requirements:**
1. Single login entry point; backend determines role from credentials, frontend routes post-login based on `role` claim.
2. Password-based auth (bcrypt/argon2 hashed, never reversible).
3. Session created as JWT access+refresh pair on success.
4. Account status (`ACTIVE`, `SUSPENDED`, `LOCKED`, `PENDING_VERIFICATION`) checked before issuing a session.
5. Failed attempts counted per-account; after 5 consecutive failures within 15 minutes, account is auto-`LOCKED` and a security event is logged (see IAM-04).
6. Logout invalidates the refresh token server-side (refresh-token blacklist/rotation table).

**API Contract:**
| Method | Path | Request | Response | Notes |
|---|---|---|---|---|
| POST | `/api/v1/auth/login` | `{ identifier: string, password: string }` | `201 { accessToken, refreshToken, user: {id, role, name} }` | identifier = email or phone |
| POST | `/api/v1/auth/refresh` | `{ refreshToken }` | `200 { accessToken, refreshToken }` | rotates refresh token |
| POST | `/api/v1/auth/logout` | `{ refreshToken }` (auth required) | `204` | blacklists refresh token |
| GET | `/api/v1/auth/me` | (auth required) | `200 { id, role, name, email, phone }` | |

**Error Codes:** `AUTH_INVALID_CREDENTIALS` (401), `AUTH_ACCOUNT_LOCKED` (403), `AUTH_ACCOUNT_SUSPENDED` (403), `AUTH_ACCOUNT_UNVERIFIED` (403), `AUTH_TOKEN_EXPIRED` (401), `AUTH_TOKEN_INVALID` (401).

**Data Model (`users` — owned here, extended by PAT-01/SCH-01):**
```
id UUID PK, email TEXT UNIQUE, phone TEXT UNIQUE, password_hash TEXT,
role ENUM(<A.4.5 list>), status ENUM(ACTIVE,SUSPENDED,LOCKED,PENDING_VERIFICATION),
failed_login_count INT DEFAULT 0, locked_until TIMESTAMPTZ NULL,
last_login_at TIMESTAMPTZ, created_at, updated_at
```
`refresh_tokens(id, user_id, token_hash, expires_at, revoked_at)`

**Business Rules:** Only `ACTIVE` accounts may log in. Lockout auto-clears after 30 minutes OR admin unlock (IAM-04). Passwords never logged or returned in any response, ever.

**Edge Cases:** Login with correct password but `LOCKED` status → 403 with unlock-time hint. Concurrent login from 2 devices → both succeed by default (see IAM-04 for concurrent-session policy toggle). Refresh token reused after rotation → revoke entire token family, force re-login (replay-attack defense).

**Acceptance Criteria:**
- [ ] Valid credentials return both tokens and correct role.
- [ ] 5 failed attempts locks the account and logs a security event.
- [ ] Expired/invalid tokens rejected on all protected routes.
- [ ] Logout invalidates the refresh token (subsequent refresh attempt fails).

**Depends On:** none (foundational). **Depended on by:** every other module.

---

### IAM-02 — Registration and Identity Verification

**Objective:** Onboard new patients (self-service) and staff (admin-provisioned), with duplicate/format validation and contact verification.

**Functional Requirements:**
1. Patient self-registration: name, DOB, gender, phone, email, password → creates `users` row (`role=PATIENT`, `status=PENDING_VERIFICATION`) + triggers PAT-01 profile creation.
2. Staff onboarding is admin-initiated only (see ADM-02) — no public staff signup endpoint.
3. Required-field & format validation: valid email regex, phone E.164 format, password policy (see IAM-03).
4. Email/mobile verification via OTP (6-digit, 10 min TTL) before `status` flips to `ACTIVE`.
5. Duplicate-identity check on email+phone+DOB combination before allowing registration.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/auth/register` | `{ name, dob, gender, phone, email, password }` | `201 { userId, verificationRequired: true }` |
| POST | `/api/v1/auth/verify-otp` | `{ userId, channel: "EMAIL"\|"SMS", otp }` | `200 { verified: true }` |
| POST | `/api/v1/auth/resend-otp` | `{ userId, channel }` | `200 {}` (rate-limited: 1/60s) |

**Error Codes:** `REG_DUPLICATE_IDENTITY` (409), `REG_INVALID_FORMAT` (400), `REG_OTP_EXPIRED` (400), `REG_OTP_INVALID` (400), `REG_OTP_RATE_LIMITED` (429).

**Data Model:** adds `otp_challenges(id, user_id, channel, otp_hash, expires_at, consumed_at)` to IAM-01's schema.

**Business Rules:** Password policy delegated to IAM-03. Registration never auto-assigns any role but `PATIENT`. Staff rows are created only via ADM-02 with an explicit role.

**Edge Cases:** OTP requested but user abandons flow → row auto-expires, no account created until first OTP verified for email OR phone (at least one verified channel required to activate). Duplicate email across a soft-deleted account → block registration, direct to password reset instead.

**Acceptance Criteria:**
- [ ] Duplicate DOB+phone+email combination is rejected pre-creation.
- [ ] Account cannot reach `ACTIVE` without at least one verified OTP.
- [ ] Resend is rate-limited.

**Depends On:** IAM-01 (users table). **Depended on by:** PAT-01.

---

### IAM-03 — Password Recovery and Optional Step-Up Authentication

*(Baseline-Complete Scope — foundations built alongside IAM-01/02 in Sprint 1, full acceptance-ready build finished in Sprint 4 hardening per SOW §6.2.)*

**Functional Requirements:**
1. Forgot-password: request → OTP/reset-token sent to verified email/phone.
2. Reset token single-use, 15-min TTL, invalidated after use or on new request.
3. Password policy: min 8 chars, 1 upper, 1 lower, 1 digit, 1 symbol; rejected against a common-password blocklist.
4. Optional step-up verification (re-enter OTP) required before sensitive actions: changing own password, changing own email/phone, viewing/exporting full PII (see SEC-02).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/auth/forgot-password` | `{ identifier }` | `200 {}` (always 200 regardless of match — no user enumeration) |
| POST | `/api/v1/auth/reset-password` | `{ resetToken, newPassword }` | `200 {}` |
| POST | `/api/v1/auth/step-up/challenge` | (auth required) `{ action }` | `200 { challengeId }` |
| POST | `/api/v1/auth/step-up/verify` | `{ challengeId, otp }` | `200 { stepUpToken }` (5-min TTL, attached to the sensitive request) |

**Error Codes:** `PWD_RESET_TOKEN_INVALID` (400), `PWD_POLICY_VIOLATION` (400) with `details.reasons[]`, `STEPUP_REQUIRED` (403) returned by *other* modules' sensitive endpoints when no valid `stepUpToken` header is present.

**Business Rules:** Forgot-password endpoint never reveals whether the identifier exists (prevents enumeration). Reset invalidates all existing refresh tokens for that user (forces re-login everywhere).

**Edge Cases:** Reset token used twice → second use fails, no account state change. Step-up requested for an action not in the sensitive-action registry → `400 STEPUP_NOT_APPLICABLE`.

**Acceptance Criteria:**
- [ ] Reset flow works end-to-end and invalidates old sessions.
- [ ] Password policy enforced with clear per-rule error detail.
- [ ] Step-up token required and verified before sensitive actions listed in SEC-02.

**Depends On:** IAM-01. **Depended on by:** SEC-02 (PII access gating).

---

### IAM-04 — Session, Account Status and Suspicious-Login Management

*(Baseline-Complete Scope — Sprint 4 hardening completion per SOW §6.2.)*

**Functional Requirements:**
1. Session timeout: access token 15 min, idle refresh-token expiry 7 days; admin-configurable timeout via ADM-04.
2. Concurrent session/device handling: list active sessions per user; policy toggle (allow-multiple vs single-session) configurable at ADM-04.
3. Account lock/unlock: auto-lock (IAM-01 rule) + manual admin lock/unlock with reason.
4. Suspicious-login capture: new device/IP/geolocation deviation flagged as a security event, visible to admins.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/users/:id/sessions` | (admin or self) | `200 [{ sessionId, device, ip, createdAt, lastActiveAt }]` |
| DELETE | `/api/v1/users/:id/sessions/:sessionId` | (admin or self) | `204` (revokes that session) |
| POST | `/api/v1/admin/users/:id/lock` | `{ reason }` (ADMIN) | `200 {}` 🔒AUDIT |
| POST | `/api/v1/admin/users/:id/unlock` | `{ reason }` (ADMIN) | `200 {}` 🔒AUDIT |
| GET | `/api/v1/admin/security-events` | filter/paginate (ADMIN) | `200 [...]` |

**Data Model:** `security_events(id, user_id, event_type ENUM(FAILED_LOGIN, NEW_DEVICE, LOCK, UNLOCK, SUSPICIOUS_GEO), metadata JSONB, created_at)`.

**Business Rules:** Only `ADMIN`/`SUPER_ADMIN` can lock/unlock other accounts or view others' sessions; a user may always view/revoke their own sessions.

**Edge Cases:** User revokes their own currently-active session → immediate 401 on next request; frontend must handle by redirecting to login. Admin unlocks an account mid-auto-lockout window → `locked_until` cleared and `failed_login_count` reset.

**Acceptance Criteria:**
- [ ] Sessions listable and individually revocable.
- [ ] Suspicious-login events captured with device/IP metadata.
- [ ] Admin lock/unlock is audited.

**Depends On:** IAM-01. **Depended on by:** SEC-03 (security monitoring).

---

### IAM-05 — Roles, Permissions, Profile and Consent Management

**Objective:** Central RBAC configuration, self-service profile editing, and consent capture/withdrawal (data-use, communication).

**Functional Requirements:**
1. Role-permission mapping: each role → set of allowed module/action scopes (seeded, admin-editable via ADM-02/04).
2. User profile management: patients/staff can edit their own non-identity fields (phone, address, avatar) — identity fields (email, DOB) require step-up (IAM-03).
3. Role-aware navigation/access checks: `GET /api/v1/auth/me/permissions` returns the effective permission set for frontend route-guarding (UX only — see A.4.4).
4. Consent capture/update/withdrawal: data-processing consent, communication consent (linked to NOT-01), timestamped and versioned.
5. 🔐 Server-side authorization enforcement (SEC-01 provides the actual guard middleware; this feature owns the permission *data*, SEC-01 owns *enforcement*).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/auth/me/permissions` | auth | `200 { role, permissions: string[] }` |
| PATCH | `/api/v1/users/me/profile` | `{ phone?, address?, avatarUrl? }` | `200 { ...updatedProfile }` |
| GET/PUT | `/api/v1/users/me/consents` | `{ dataProcessing: bool, communication: bool }` | `200 {...}` 🔒AUDIT |
| GET | `/api/v1/admin/role-permissions` | (ADMIN) | `200 [{ role, permissions[] }]` |
| PUT | `/api/v1/admin/role-permissions/:role` | `{ permissions[] }` (SUPER_ADMIN) | `200 {}` 🔒AUDIT |

**Data Model:** `role_permissions(role, permission_key)`, `consents(id, user_id, type ENUM(DATA_PROCESSING, COMMUNICATION), granted BOOL, version INT, recorded_at)`.

**Business Rules:** Identity fields (email/phone as login identifier, DOB) are never editable via the profile endpoint — only via a verified change flow (reuses IAM-03 step-up + OTP re-verification). Withdrawing communication consent immediately stops NOT-02 sends to that user (except mandatory transactional/security ones, e.g., password reset).

**Edge Cases:** Role permission edit removes a permission currently in active use by a logged-in session → enforced on next request (JWT carries role, not the permission list, so this is always fresh from DB — permission checks must query `role_permissions`, not just decode the JWT).

**Acceptance Criteria:**
- [ ] Permission set correctly reflects role-permission table changes on next request.
- [ ] Consent changes are versioned and audited.
- [ ] Identity-field edits are blocked without step-up.

**Depends On:** IAM-01, IAM-03. **Depended on by:** SEC-01, NOT-01.

---

## MODULE: PAT — Patient Management (Core Supporting Scope)

**Module Owns:** `patients` table (extends `users`), `patient_documents`, `patient_alerts`.

---

### PAT-01 — Patient Master Record and MRN Management

**Objective:** Maintain the canonical patient record with a unique, permanent Medical Record Number.

**Functional Requirements:**
1. On IAM-02 registration completion, auto-create a `patients` row.
2. MRN generation: format `MRN-{YYYY}-{6-digit sequence}` (e.g. `MRN-2026-000123`), unique, immutable once assigned, sequence per calendar year.
3. Patient record update: demographics editable by patient (self) or Reception/Admin (staff), with change history retained.
4. Full record view accessible to the patient, and to staff per role scope (Doctor/Nurse during active encounter, Reception always, Billing for financial fields only).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST (internal) | triggered by IAM-02 verification | — | creates `patients` row + MRN |
| GET | `/api/v1/patients/:id` | auth (self/staff) | `200 { id, mrn, userId, demographics, alerts[] }` |
| PATCH | `/api/v1/patients/:id` | `{ ...editableFields }` | `200 {...}` 🔒AUDIT |
| GET | `/api/v1/patients/:id/history` | staff only | `200 [{ field, oldValue, newValue, changedBy, changedAt }]` |

**Error Codes:** `PAT_NOT_FOUND` (404), `PAT_MRN_GENERATION_CONFLICT` (409, auto-retried server-side with next sequence).

**Data Model:**
```
patients: id UUID PK, user_id UUID FK->users, mrn TEXT UNIQUE, dob DATE, gender ENUM,
  blood_group TEXT NULL, created_at, updated_at
patient_field_history: id, patient_id, field_name, old_value, new_value, changed_by, changed_at
```

**Business Rules:** MRN is never re-issued or reused, even if a patient record is soft-deleted. Only Reception/Admin/Doctor-during-active-encounter can edit demographics on a patient's behalf; edits by staff always populate `changed_by`.

**Edge Cases:** MRN sequence collision under concurrent registration bursts → 🔐 use a DB sequence object (`nextval`), not application-layer max+1, to avoid race conditions.

**Acceptance Criteria:**
- [ ] Every patient has exactly one immutable MRN.
- [ ] Demographic edits are versioned in history.
- [ ] Role-scoped read access enforced.

**Depends On:** IAM-01, IAM-02. **Depended on by:** APT, QUE, EMR, PHA, BIL, IPD (all reference `patientId`).

---

### PAT-02 — Demographics, Contacts, Emergency Contacts and Patient Alerts

**Functional Requirements:**
1. Demographic/contact fields: address, phone (secondary), email (secondary), preferred language.
2. Emergency contact(s): name, relationship, phone — at least one recommended, not hard-required.
3. Patient alert/flag management: e.g. `ALLERGY_ON_FILE`, `HIGH_RISK`, `VIP`, `DNR_NOTED` (informational surfacing only, not a clinical decision system) — visible as a banner wherever the patient's record is opened (QUE, EMR, IPD).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| PUT | `/api/v1/patients/:id/contacts` | `{ address, secondaryPhone?, secondaryEmail?, language? }` | `200 {}` |
| POST/GET/DELETE | `/api/v1/patients/:id/emergency-contacts` | `{ name, relationship, phone }` | `200/201 [...]` |
| POST/GET | `/api/v1/patients/:id/alerts` | `{ type, note }` (DOCTOR/NURSE/ADMIN only) | `201 {...}` 🔒AUDIT (communication-relevant: triggers via NOT-02 rules when alert added) |

**Business Rules:** Alerts are additive/append-only in the UI (never silently overwritten); resolving/removing an alert requires a reason and is retained in history, not hard-deleted.

**Edge Cases:** Emergency contact phone same as patient's own phone → allowed but flagged with a non-blocking warning in the UI.

**Acceptance Criteria:**
- [ ] Alerts surface consistently across QUE/EMR/IPD banners.
- [ ] Emergency contacts CRUD works and is scoped to the correct patient.

**Depends On:** PAT-01. **Depended on by:** QUE-03 (banner), EMR-01 (patient context), NOT-02.

---

### PAT-03 — Patient Documents and Record Access

*(Baseline-Complete Scope — Sprint 4 hardening / post-hardening per SOW §6.2.)*

**Functional Requirements:**
1. Document upload with metadata (type: `LAB_REPORT`, `PRESCRIPTION_SCAN`, `ID_PROOF`, `OTHER`; uploadedBy, uploadedAt).
2. Secure document viewing/download via short-lived signed URLs (Azure Blob SAS token, 5-min TTL) — never a permanent public URL.
3. Document access permissions: patient sees own; staff sees per role-scope; every view is logged.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/patients/:id/documents` | multipart file + `{ type, description }` | `201 { documentId }` 🔒AUDIT |
| GET | `/api/v1/patients/:id/documents` | | `200 [{ id, type, uploadedAt, uploadedBy }]` |
| GET | `/api/v1/patients/:id/documents/:docId/download-url` | | `200 { url, expiresAt }` 🔒AUDIT (VIEW action) |
| DELETE | `/api/v1/patients/:id/documents/:docId` | staff/self, reason required | `204` 🔒AUDIT |

**Data Model:** `patient_documents(id, patient_id, type, blob_path, uploaded_by, uploaded_at, deleted_at)`, `document_access_log(id, document_id, viewer_id, viewed_at)`.

**Business Rules:** Max file size 20MB; allowed types PDF/JPG/PNG only; virus/malware scan on upload before making downloadable (flag as `PENDING_SCAN` until clear).

**Edge Cases:** Download URL requested after document soft-deleted → `404 DOC_NOT_FOUND`. Upload scan fails → document stays `PENDING_SCAN`, not visible to anyone, admin notified.

**Acceptance Criteria:**
- [ ] Signed URLs expire and cannot be reused past TTL.
- [ ] Every view is logged with viewer identity.

**Depends On:** PAT-01, SEC-03 (audit sink). **Depended on by:** DIA-05 (report delivery), EMR-03.

---

### PAT-04 — Patient Search, Duplicate Handling and Correction

**Functional Requirements:**
1. Patient search/filter: by name, MRN, phone, DOB — used by Reception/Doctor/Billing.
2. Duplicate-patient detection: fuzzy match on name+DOB+phone at registration and on-demand; surfaced as a review queue for Admin/Reception.
3. Controlled correction of patient data: for staff-initiated corrections beyond normal edit (e.g., wrong DOB in MRN-linked record) — requires reason + supervisor role.
4. Record merge/exception workflow: merging two duplicate patient records into one, re-pointing all foreign-keyed records (appointments, encounters, invoices) — approved-only, irreversible, fully audited.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/patients/search` | `?q=&mrn=&phone=&dob=` | `200 [...]` paginated |
| GET | `/api/v1/patients/duplicates` | staff | `200 [{ candidateA, candidateB, matchScore }]` |
| POST | `/api/v1/patients/:id/correct` | `{ field, newValue, reason }` (ADMIN) | `200 {}` 🔒AUDIT |
| POST | `/api/v1/patients/merge` | `{ sourceId, targetId, reason }` (ADMIN) | `200 { mergedInto: targetId }` 🔒AUDIT |

**Error Codes:** `PAT_MERGE_HAS_ACTIVE_QUEUE_TOKEN` (422 — cannot merge while either record has an in-progress queue token; resolve first), `PAT_MERGE_IRREVERSIBLE_CONFIRM_REQUIRED` (400 if confirm flag missing).

**Business Rules:** Merge is a two-step confirm (dry-run diff shown first, then commit). Merge re-points FKs across ALL modules (Appointments, Queue, EMR, Prescriptions, Invoices, Documents) in a single DB transaction — partial merges are never acceptable.

**Edge Cases:** Merge target and source both have open invoices → invoices retained separately but re-linked to the surviving `patientId`; billing history preserved, not summed.

**Acceptance Criteria:**
- [ ] Search returns results across all indexed fields within acceptable latency.
- [ ] Duplicate detection surfaces true positives without excessive false positives (tunable threshold).
- [ ] Merge is transactional and fully audited, with no orphaned FK references afterward.

**Depends On:** PAT-01. **Depended on by:** ADM (admin console), BIL (billing history integrity).

---

## MODULE: APT — Appointments & Referrals (⭐ PRIMARY SCOPE)

**Module Owns:** `appointments`, `waitlist_entries`, `referrals`. This is a commercially critical-path module — full acceptance testing mandatory, any change here is high-impact by default (SOW §4.1).

---

### APT-01 — Doctor, Department and Service Discovery

**Objective:** Let a patient browse/find the right doctor/department/service before booking.

**Functional Requirements:**
1. Department/service listing: public-ish (auth'd patient) catalog of departments and the services offered.
2. Doctor profile and specialization view: name, specialization, department, qualifications, photo, bio.
3. Search/filter by service, doctor name, or department — combinable filters.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/departments` | | `200 [{ id, name, code }]` |
| GET | `/api/v1/doctors` | `?departmentId=&specialization=&q=` | `200 [{ id, name, specialization, departmentId, photoUrl }]` |
| GET | `/api/v1/doctors/:id` | | `200 { ...fullProfile }` |

**Data Model:** `doctors(id, user_id FK, department_id FK, specialization, qualifications, bio, photo_url, is_active)`.

**Business Rules:** Only `is_active=true` doctors/departments are shown in patient-facing discovery; inactive ones remain visible to Admin.

**Edge Cases:** Doctor with zero configured schedule (SCH-01 not yet set up) still appears in discovery but shows "no slots available" downstream in APT-02, not an error.

**Acceptance Criteria:**
- [ ] Filtering combinations return correct, paginated results.
- [ ] Inactive doctors excluded from patient-facing search.

**Depends On:** SCH-01 (doctor schedule existence, read-only reference), ADM-01 (departments). **Depended on by:** APT-02.

---

### APT-02 — Availability and Appointment Slot Search

**Objective:** Compute real, bookable slots for a doctor/service/date, accounting for schedule, leave, and existing bookings — with zero possibility of showing a slot that's actually taken.

**Functional Requirements:**
1. Doctor schedule availability query: pull SCH-01 recurring schedule + SCH-02 leave/holiday overrides for requested date range.
2. Slot generation: derive discrete slots from clinic session start/end and SCH-03 slot duration; exclude already-booked slots (query `appointments` for `CONFIRMED`/`CHECKED_IN` status in that window).
3. Appointment-type and duration rules: different appointment types (e.g. `NEW`, `FOLLOW_UP`) may consume different slot durations (from SCH-03 config).
4. 🔐**CONCURRENCY-CRITICAL** Real-time conflict prevention: slot list is always computed live at request time, never cached longer than a few seconds, to minimize (not eliminate) race windows — actual prevention is enforced at booking time (APT-03).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/appointments/availability` | `?doctorId=&date=&appointmentType=` | `200 { doctorId, date, slots: [{ start, end, available: true }] }` |

**Error Codes:** `APT_DOCTOR_NO_SCHEDULE` (200 with empty `slots[]`, not an error — schedule absence is a valid, displayable state), `APT_INVALID_DATE_RANGE` (400, e.g. requesting a past date).

**Business Rules:** Slots are never shown for a date the doctor is on leave (SCH-02) or the clinic is holiday-closed. Slot list excludes any slot within a configurable "booking lead time" buffer (default 30 min from now, admin-configurable via ADM-03) to prevent booking a slot that's about to start.

**Edge Cases:** Doctor's schedule changes (session shortened) after slots were shown to a patient but before they book → booking attempt (APT-03) re-validates against current schedule and rejects with `APT_SLOT_NO_LONGER_VALID` if the slot fell outside the new session window.

**Acceptance Criteria:**
- [ ] Never returns a slot that overlaps an existing `CONFIRMED`/`CHECKED_IN` appointment.
- [ ] Leave/holiday dates correctly produce zero slots.
- [ ] Slot durations reflect appointment-type rules.

**Depends On:** SCH-01, SCH-02, SCH-03, APT-01. **Depended on by:** APT-03.

---

### APT-03 — Appointment Booking

**Objective:** Atomically reserve a slot, preventing any possibility of two confirmed bookings for the same doctor/slot.

**Functional Requirements:**
1. Patient/doctor/service selection → submit booking request referencing a specific slot from APT-02's output.
2. 🔐**CONCURRENCY-CRITICAL** Slot reservation and duplicate prevention: booking wrapped in a DB transaction with a unique constraint on `(doctor_id, slot_start)` for non-cancelled statuses, plus row-level locking during the check-then-insert.
3. Booking confirmation returns a human-readable Appointment Number (`APT-{YYYYMMDD}-{4-digit seq}`).
4. 🔒**AUDIT** Booking audit and notification trigger: on success, emit an event consumed by NOT-02 for confirmation notification.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/appointments` | `{ patientId, doctorId, slotStart, slotEnd, appointmentType, serviceId, notes? }` | `201 { id, appointmentNumber, status: "CONFIRMED" }` |
| GET | `/api/v1/appointments/:id` | | `200 {...}` |

**Error Codes:** `APT_SLOT_ALREADY_BOOKED` (409), `APT_SLOT_NO_LONGER_VALID` (422), `APT_PATIENT_DOUBLE_BOOKING` (422 — same patient already has a `CONFIRMED` appointment overlapping this window, unless override flag set by staff), `APT_PAST_SLOT` (400).

**Data Model:**
```
appointments: id UUID PK, appointment_number TEXT UNIQUE, patient_id FK, doctor_id FK,
  service_id FK NULL, appointment_type ENUM(NEW, FOLLOW_UP, EMERGENCY),
  slot_start TIMESTAMPTZ, slot_end TIMESTAMPTZ,
  status ENUM(CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW, RESCHEDULED),
  notes TEXT NULL, created_by, deleted_at NULL
UNIQUE INDEX on (doctor_id, slot_start) WHERE status IN (CONFIRMED, CHECKED_IN, IN_PROGRESS)
```

**Business Rules:** Booking by Reception on a patient's behalf is allowed with role `RECEPTIONIST`; the `created_by` field distinguishes self-booked vs staff-booked. A `PATIENT` role may only create appointments where `patientId == self`.

**Edge Cases:** Two requests for the same slot arrive within milliseconds → DB unique constraint guarantees exactly one succeeds; the loser gets `409 APT_SLOT_ALREADY_BOOKED` and the frontend should immediately re-fetch availability (APT-02).

**Acceptance Criteria:**
- [ ] Load-tested: N concurrent booking requests for one slot → exactly 1 success, N-1 clean 409s, zero double-bookings.
- [ ] Appointment Number is unique and human-readable.
- [ ] Booking triggers a notification event.

**Depends On:** APT-02, PAT-01, SCH-*. **Depended on by:** QUE-01 (check-in references appointment), NOT-02, REP-01/02.

---

### APT-04 — Appointment Rescheduling and Cancellation

**Functional Requirements:**
1. Reschedule eligibility rules: allowed only for `CONFIRMED` status and only up to a configurable cutoff before slot start (default 2 hours, ADM-03 configurable).
2. Cancellation with mandatory reason capture (free text + reason category enum).
3. Slot release/reallocation: cancelling/rescheduling immediately frees the old slot for others (re-query in APT-02 reflects it instantly) and, if a waitlist exists for that slot (APT-05), triggers a waitlist offer.
4. 🔒**AUDIT** Patient/staff status updates and notifications via NOT-02.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/appointments/:id/reschedule` | `{ newSlotStart, newSlotEnd, reason? }` | `200 { id, status: "CONFIRMED", slotStart: new }` (old row marked `RESCHEDULED`, links to new row via `rescheduled_to_id`) |
| POST | `/api/v1/appointments/:id/cancel` | `{ reasonCategory, reasonText? }` | `200 { status: "CANCELLED" }` |

**Error Codes:** `APT_RESCHEDULE_CUTOFF_PASSED` (422), `APT_NOT_CANCELLABLE_STATUS` (422 — e.g. already `COMPLETED`), `APT_RESCHEDULE_TARGET_UNAVAILABLE` (409, re-runs APT-03's conflict check against the new slot).

**Business Rules:** Reschedule is modeled as cancel-old + book-new (linked), not an in-place mutation — this preserves full history for REP and audit. Staff can override the cutoff rule with a documented reason; patients cannot.

**Edge Cases:** Reschedule requested for a slot that's now also unavailable → the whole operation fails atomically; the original appointment remains `CONFIRMED` untouched (no partial cancel-without-rebook).

**Acceptance Criteria:**
- [ ] Reschedule is atomic (all-or-nothing).
- [ ] Cancellation frees the slot immediately and is visible in APT-02 within seconds.
- [ ] Reason is always captured for cancellations.

**Depends On:** APT-03, APT-05 (waitlist trigger). **Depended on by:** NOT-02.

---

### APT-05 — Waitlist and Referral Management

**Functional Requirements:**
1. Waitlist enrollment: patient joins a waitlist for a fully-booked doctor/date/time-window.
2. Waitlist prioritization and slot offer: FIFO by default, with an override to prioritize by no-show-risk-adjusted fairness (optional AI-02 signal, non-blocking) — when a slot frees up (via APT-04 cancellation), the top waitlist entry is offered first with a response window (default 30 min) before moving to the next.
3. Referral creation/assignment: a doctor refers a patient to another doctor/department; creates a referral record, optionally auto-suggesting available slots (reuses APT-02).
4. Referral status and follow-up tracking: `PENDING`, `BOOKED`, `COMPLETED`, `DECLINED`.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/waitlist` | `{ patientId, doctorId, preferredDateRange }` | `201 { id, position }` |
| GET | `/api/v1/waitlist/:id/status` | | `200 { position, status }` |
| POST | `/api/v1/waitlist/:id/respond` | `{ accept: bool }` (within offer window) | `200 {}` (accept → auto-books via APT-03 flow) |
| POST | `/api/v1/referrals` | `{ patientId, fromDoctorId, toDoctorId or toDepartmentId, reason, encounterId? }` | `201 { id, status: "PENDING" }` |
| GET | `/api/v1/referrals/:id` | | `200 {...}` |
| PATCH | `/api/v1/referrals/:id/status` | `{ status }` | `200 {}` |

**Data Model:** `waitlist_entries(id, patient_id, doctor_id, preferred_start, preferred_end, status ENUM(WAITING, OFFERED, ACCEPTED, EXPIRED, CANCELLED), offered_at, offer_expires_at, position)`, `referrals(id, patient_id, from_doctor_id, to_doctor_id NULL, to_department_id NULL, encounter_id NULL, reason, status ENUM(PENDING,BOOKED,COMPLETED,DECLINED))`.

**Business Rules:** Offer window expiry auto-advances to next waitlist entry (background job, see NOT-03 retry pattern for reliability). A referral does not itself hold a slot — it's a routing intent; booking still goes through APT-02/03.

**Edge Cases:** Patient accepts a waitlist offer for a slot that another process just booked directly (race between waitlist-offer-accept and a fresh direct booking) → accept attempt goes through the same APT-03 concurrency-safe path and can fail with `APT_SLOT_ALREADY_BOOKED`; in that case, re-offer to the entry automatically re-queues instead of erroring out to the patient.

**Acceptance Criteria:**
- [ ] Waitlist offers expire and cascade correctly.
- [ ] Referral status transitions are tracked and queryable.

**Depends On:** APT-02, APT-03, APT-04. **Depended on by:** NOT-02.

---

### APT-06 — Appointment Lifecycle, History and Reminders

**Functional Requirements:**
1. Full state-transition model: `CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED`, plus `CANCELLED`, `NO_SHOW`, `RESCHEDULED` as terminal/branch states. Invalid transitions rejected server-side (e.g. cannot go `COMPLETED → CHECKED_IN`).
2. Appointment history: full timeline of an appointment (and, per patient, all their appointments) queryable for REP-01/02.
3. Reminder scheduling and delivery: T-24h and T-1h reminders (configurable via ADM-03), delegated to NOT-02.
4. No-show marking: staff/system marks an appointment `NO_SHOW` if not checked in within a grace window (default 15 min post slot-start, configurable) past slot start — feeds AI-02 training data.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/appointments` | `?patientId=&doctorId=&status=&dateFrom=&dateTo=` | `200 [...]` paginated |
| GET | `/api/v1/appointments/:id/history` | | `200 [{ status, changedAt, changedBy }]` |
| POST | `/api/v1/appointments/:id/mark-no-show` | (system job or staff) | `200 { status: "NO_SHOW" }` 🔒AUDIT |

**Data Model:** `appointment_status_history(id, appointment_id, from_status, to_status, changed_by, changed_at)`.

**Business Rules:** State machine transitions are enforced in a single service method (`AppointmentStateMachine`) — never mutate `status` directly from another module; other modules call this service's transition method (e.g. QUE-01 calling `transition(id, 'CHECKED_IN')`).

**Edge Cases:** No-show grace window job runs but patient walks in 1 minute late (within grace) → check-in still succeeds normally; no-show job only acts after the grace window fully elapses and no check-in occurred.

**Acceptance Criteria:**
- [ ] Illegal state transitions are rejected with a clear error.
- [ ] No-show auto-marking runs reliably via background job.
- [ ] Full history is queryable per appointment.

**Depends On:** APT-03, QUE-01 (drives CHECKED_IN transition), EMR-01 (drives IN_PROGRESS/COMPLETED). **Depended on by:** REP-01/02, AI-02.

---

## MODULE: SCH — Doctor Scheduling & Capacity (Core Supporting Scope)

**Module Owns:** `doctor_schedules`, `doctor_leaves`, `clinic_holidays`, `rooms`. Read by APT-02 for availability computation.

---

### SCH-01 — Doctor Schedule and Clinic Session Management

**Functional Requirements:**
1. Recurring schedule creation: weekly pattern (e.g. Mon/Wed/Fri 9am–1pm) per doctor per department/room.
2. Clinic session management: a session = one contiguous working block with a defined service type.
3. Working hours and service assignment: which services a doctor offers in which session.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/schedules` | `{ doctorId, dayOfWeek, startTime, endTime, roomId?, serviceIds[] }` | `201 {...}` |
| GET | `/api/v1/schedules?doctorId=` | | `200 [...]` |
| PATCH/DELETE | `/api/v1/schedules/:id` | | `200/204` |

**Data Model:** `doctor_schedules(id, doctor_id, day_of_week INT 0-6, start_time TIME, end_time TIME, room_id NULL, service_ids UUID[], effective_from DATE, effective_to DATE NULL, is_published BOOL)`.

**Business Rules:** Only `ADMIN` or the doctor themself can edit; edits to a published schedule require the SCH-04 publish workflow, not direct mutation, once appointments exist against it.

**Edge Cases:** Overlapping sessions for the same doctor on the same day → rejected at creation with `SCH_SESSION_OVERLAP` (409).

**Acceptance Criteria:**
- [ ] No overlapping sessions can be created per doctor.
- [ ] APT-02 correctly derives slots from this schedule.

**Depends On:** ADM-01 (rooms/departments). **Depended on by:** APT-01/02, SCH-03/04.

---

### SCH-02 — Leave, Holiday and Urgent Availability Management

**Functional Requirements:**
1. Leave entry/approval: doctor requests leave, admin approves/rejects.
2. Holiday calendar: clinic-wide non-working days.
3. Emergency/urgent availability override: admin can force-open a doctor's slot on a leave day for urgent capacity (rare, logged).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/doctors/:id/leaves` | `{ startDate, endDate, reason }` | `201 { status: "PENDING" }` |
| PATCH | `/api/v1/doctors/:id/leaves/:leaveId/approve` | (ADMIN) | `200 { status: "APPROVED" }` |
| POST/GET | `/api/v1/clinic-holidays` | `{ date, name }` (ADMIN) | `201/200` |
| POST | `/api/v1/doctors/:id/urgent-override` | `{ date, startTime, endTime, reason }` (ADMIN) | `201 {}` 🔒AUDIT |

**Data Model:** `doctor_leaves(id, doctor_id, start_date, end_date, reason, status ENUM(PENDING,APPROVED,REJECTED), approved_by)`, `clinic_holidays(id, date, name)`.

**Business Rules:** Approved leave automatically removes affected dates from APT-02's slot generation; existing `CONFIRMED` appointments in the leave window are NOT auto-cancelled — they surface in an admin "conflicts to resolve" list requiring manual reschedule/cancel action.

**Edge Cases:** Leave requested retroactively for a date that already has confirmed appointments → allowed to submit, but approval triggers the conflict-resolution list rather than silently orphaning appointments.

**Acceptance Criteria:**
- [ ] Approved leave correctly blocks slot generation.
- [ ] Conflicting existing appointments are surfaced, never silently dropped.

**Depends On:** SCH-01. **Depended on by:** APT-02.

---

### SCH-03 — Slot Duration, Capacity and Room Assignment

**Functional Requirements:**
1. Configurable slot duration per appointment type per doctor/department (default fallback at ADM-03 global config).
2. Session capacity rules: max patients per session (derived from duration, or an explicit override cap).
3. Room/resource assignment per session, checked for double-booking across doctors sharing a room.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| PUT | `/api/v1/schedules/:id/slot-config` | `{ slotDurationMinutes, maxCapacityOverride? }` | `200 {}` |
| GET | `/api/v1/rooms/:id/availability?date=` | | `200 { conflicts: [...] }` |

**Data Model:** extends `doctor_schedules` with `slot_duration_minutes INT`, `max_capacity_override INT NULL`; `rooms(id, name, department_id)`.

**Business Rules:** Room double-booking across two different doctors' sessions at overlapping times is rejected at schedule-creation/edit time, same unique-constraint pattern as APT-03.

**Edge Cases:** Room reassigned mid-cycle → future slots regenerate with new room; past/confirmed appointments retain their original room reference (denormalized copy stored on the appointment or resolved via history).

**Acceptance Criteria:**
- [ ] Slot durations correctly propagate into APT-02's generated slots.
- [ ] Room conflicts are prevented at config time.

**Depends On:** SCH-01. **Depended on by:** APT-02.

---

### SCH-04 — Schedule Exceptions, Conflict Detection and Publishing

*(Baseline-Complete Scope — Sprint 4 hardening per SOW §6.2.)*

**Functional Requirements:**
1. Schedule exception management: one-off deviations from the recurring pattern (e.g., "this Wednesday only, 2–4pm instead of 9–1").
2. Double-booking/conflict detection: run a validation pass across schedule + exceptions + leave before allowing a publish.
3. Schedule publish/unpublish workflow: draft schedules are editable freely; published schedules feed APT-02 and require the conflict-resolution flow (from SCH-02) for any edit that would orphan existing bookings.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/schedules/:id/exceptions` | `{ date, startTime, endTime }` | `201 {}` |
| POST | `/api/v1/schedules/:id/publish` | | `200 { published: true, conflicts: [] }` or `422` with conflict list if unresolved |
| POST | `/api/v1/schedules/:id/unpublish` | (ADMIN) | `200 {}` |

**Business Rules:** A schedule cannot be published while it has unresolved conflicts (overlapping sessions, room double-bookings). `is_published=false` schedules are invisible to APT-02.

**Edge Cases:** Publishing a schedule that reduces hours where confirmed appointments already exist outside the new hours → publish is blocked until those appointments are resolved (reschedule/cancel), consistent with SCH-02's conflict-resolution pattern.

**Acceptance Criteria:**
- [ ] Publish is blocked on unresolved conflicts.
- [ ] Unpublished schedules never appear in patient-facing availability.

**Depends On:** SCH-01, SCH-02, SCH-03. **Depended on by:** APT-02.

---

## MODULE: QUE — Check-in, Token & Queue Management (⭐ PRIMARY SCOPE)

**Module Owns:** `queue_tokens`, `check_ins`. This is the live, real-time heart of the system — expect WebSocket/SSE push in addition to REST for live updates.

**Shared Realtime Convention:** All QUE endpoints that change token state also emit a WebSocket event on channel `queue:{doctorId}` with payload `{ event, token }`. Frontend queue boards subscribe to this channel; REST GETs are the source of truth on load/reconnect, WS is the live delta feed.

---

### QUE-01 — Patient Check-in and Eligibility Validation

**Functional Requirements:**
1. Appointment lookup/check-in: staff (or self-service kiosk) looks up by appointment number, patient MRN, or phone.
2. Walk-in registration: patient without an appointment registers on the spot (creates a minimal `appointments` row with `appointmentType=WALK_IN` or a dedicated walk-in flag, then checks in).
3. Eligibility/appointment validation: appointment must be `CONFIRMED` and slot_start within a check-in window (default: from 30 min before to grace-window after, ADM-03 configurable).
4. Check-in timestamp and status recorded; triggers APT-06's `CONFIRMED → CHECKED_IN` transition.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/queue/check-in` | `{ appointmentId }` OR `{ patientId, doctorId, isWalkIn: true }` | `201 { tokenId, tokenNumber }` (see QUE-02) |
| GET | `/api/v1/queue/check-in/lookup` | `?appointmentNumber= or mrn= or phone=` | `200 { appointment(s) matching }` |

**Error Codes:** `QUE_APPT_NOT_CONFIRMED` (422), `QUE_OUTSIDE_CHECKIN_WINDOW` (422), `QUE_ALREADY_CHECKED_IN` (409).

**Business Rules:** Checking in immediately and atomically creates the queue token (QUE-02) — check-in and token issuance are one transaction, not two separate steps a client could interrupt.

**Edge Cases:** Patient checks in for an appointment that was already marked `NO_SHOW` by the background job seconds earlier (race at the grace-window boundary) → allow check-in to "rescue" it back to `CHECKED_IN` if within a small tolerance (e.g. 2 min grace-of-grace), otherwise require staff override.

**Acceptance Criteria:**
- [ ] Check-in only succeeds for eligible appointments/walk-ins.
- [ ] Check-in and token issuance are atomic.

**Depends On:** APT-03, APT-06, PAT-04 (lookup). **Depended on by:** QUE-02.

---

### QUE-02 — Token Generation and Queue Entry

**Functional Requirements:**
1. Token generation rules: sequential per doctor per day, format `{doctorCode}-{3-digit seq}` (e.g. `DR07-014`), resets daily.
2. Appointment and walk-in queue entry: both paths converge into the same `queue_tokens` table with a `source` field.
3. Queue position initialization: computed from current queue length + priority tier (see QUE-04) at issuance time.
4. Token display/print/share: return a display-ready payload; support print (staff counter) and patient-app display.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| (created via QUE-01) | | | `201 { id, tokenNumber, doctorId, patientId, position, estimatedWaitMinutes, status: "WAITING" }` |
| GET | `/api/v1/queue/tokens/:id` | | `200 {...}` |

**Data Model:**
```
queue_tokens: id UUID PK, token_number TEXT, doctor_id FK, patient_id FK, appointment_id NULL FK,
  source ENUM(APPOINTMENT, WALK_IN), priority_tier ENUM(NORMAL, PRIORITY, EMERGENCY) DEFAULT NORMAL,
  status ENUM(WAITING, CALLED, IN_CONSULTATION, COMPLETED, NO_RESPONSE, CANCELLED, TRANSFERRED),
  position INT, checked_in_at, called_at NULL, completed_at NULL
```

**Business Rules:** `estimatedWaitMinutes` calls AI-01 with fallback per A.4.10; must never block token issuance if AI is slow/down (call is non-blocking / has a hard timeout of 500ms, falling back immediately after).

**Edge Cases:** Two check-ins racing for the "next sequence number" at the same doctor → 🔐 use a DB sequence per `(doctor_id, date)`, not app-layer counting, same pattern as APT-03/PAT-01.

**Acceptance Criteria:**
- [ ] Token numbers are sequential, gapless per doctor per day, and collision-free under concurrency.
- [ ] Token payload includes a wait estimate that degrades gracefully if AI is unavailable.

**Depends On:** QUE-01, AI-01. **Depended on by:** QUE-03/04/05/06.

---

### QUE-03 — Live Queue Display and Patient Position

**Functional Requirements:**
1. Live queue status: current list of `WAITING`/`CALLED` tokens for a doctor, ordered by effective priority+position.
2. Patient position/estimated wait display: patient-facing view of "you are #N, ~M minutes."
3. Staff queue board: full operational view (all tokens, all statuses, patient alerts banner from PAT-02).
4. Refresh/update mechanism: WebSocket push (see module-level convention) + REST polling fallback every 15s if WS unavailable.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/queue/doctors/:doctorId/board` | staff | `200 { tokens: [...], summary: { waiting, completed, avgWaitMinutes } }` |
| GET | `/api/v1/queue/tokens/:id/my-position` | patient (self) | `200 { position, estimatedWaitMinutes }` |
| WS | `queue:{doctorId}` | | events: `TOKEN_ADDED`, `TOKEN_CALLED`, `TOKEN_COMPLETED`, `POSITIONS_UPDATED` |

**Business Rules:** Staff board shows PAT-02 alert flags inline per token row (e.g. an "⚠ Allergy on file" chip) — never require staff to open the full patient record just to see a critical alert.

**Edge Cases:** WebSocket disconnects mid-session → frontend must fall back to polling and reconcile state via the REST GET on reconnect (WS is a delta feed, not the source of truth).

**Acceptance Criteria:**
- [ ] Position updates propagate to patient view within a few seconds of any queue change.
- [ ] Staff board correctly reflects patient alerts.

**Depends On:** QUE-02, PAT-02. **Depended on by:** REP-01/02/03.

---

### QUE-04 — Priority, Emergency/Triage and Queue Ordering Rules

**Functional Requirements:**
1. Priority rules: `EMERGENCY` > `PRIORITY` (e.g. elderly/pregnant/pre-flagged) > `NORMAL`, FIFO within each tier.
2. Emergency/urgent queue handling: staff can promote a waiting token to `EMERGENCY`, immediately re-sorting the queue.
3. Triage category capture: optional triage tag (e.g. from Nurse) attached to a token, informing (not overriding) priority.
4. 🔐**CONCURRENCY-CRITICAL** Server-side queue ordering enforcement: ordering is always computed server-side from `priority_tier` + `checked_in_at`; the client never sends or trusts a client-computed order.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| PATCH | `/api/v1/queue/tokens/:id/priority` | `{ priorityTier, reason }` (NURSE/DOCTOR/RECEPTIONIST) | `200 {}` 🔒AUDIT, broadcasts `POSITIONS_UPDATED` |
| PATCH | `/api/v1/queue/tokens/:id/triage` | `{ triageCategory }` | `200 {}` |

**Business Rules:** Promoting to `EMERGENCY` never removes/completes another patient's token — it only changes sort order; every affected token's `position` is recomputed and broadcast.

**Edge Cases:** Two staff promote two different tokens to `EMERGENCY` within the same second → both succeed; ordering between two `EMERGENCY` tokens falls back to `checked_in_at` (FIFO), deterministic tie-break.

**Acceptance Criteria:**
- [ ] Priority changes correctly and immediately re-sort the live queue.
- [ ] Ordering is always deterministic and server-computed.

**Depends On:** QUE-02, QUE-03. **Depended on by:** QUE-05, AI-03 (optimization suggestions operate on this ordering).

---

### QUE-05 — Patient Call, Recall and Turn Management

**Functional Requirements:**
1. Call-next workflow: doctor/nurse calls the next `WAITING` token → `CALLED`, broadcasts to display board and patient app.
2. Recall/re-call handling: if patient doesn't respond, staff can recall (re-announce) before moving on.
3. Turn start/end status: `CALLED → IN_CONSULTATION` (on doctor confirming patient present) `→ COMPLETED` (on encounter finalization, EMR-06, or manual staff action).
4. No-response handling: after N recalls (default 2) with no response within a timeout, auto-transitions to `NO_RESPONSE` (distinct from cancel) and calls the next token — original patient can be manually re-inserted into the queue by staff.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/queue/doctors/:doctorId/call-next` | | `200 { token }` |
| POST | `/api/v1/queue/tokens/:id/recall` | | `200 {}` |
| POST | `/api/v1/queue/tokens/:id/start-consultation` | | `200 { status: "IN_CONSULTATION" }` |
| POST | `/api/v1/queue/tokens/:id/complete` | (usually system-triggered by EMR-06) | `200 { status: "COMPLETED" }` |
| POST | `/api/v1/queue/tokens/:id/mark-no-response` | | `200 { status: "NO_RESPONSE" }` |

**Business Rules:** Only one token per doctor may be `CALLED` or `IN_CONSULTATION` at a time (enforced at the service layer, not just UI) — calling next while one is already active requires explicitly completing/cancelling the current one first, UNLESS the doctor room supports parallel tracks (future extension, out of scope for this baseline).

**Edge Cases:** Doctor calls next but the token was just cancelled by the patient a moment earlier → call-next skips cancelled tokens atomically (re-check status inside the same transaction that selects "next").

**Acceptance Criteria:**
- [ ] Only one active (CALLED/IN_CONSULTATION) token per doctor at a time.
- [ ] No-response auto-handling works after the configured recall count/timeout.

**Depends On:** QUE-02, QUE-04, EMR-01/06. **Depended on by:** REP-02.

---

### QUE-06 — Queue Transfer, Pause, Cancellation, No-show and Fallback Handling

**Functional Requirements:**
1. Queue transfer between doctors/services: move a `WAITING` token to a different doctor's queue (e.g., original doctor unavailable) — re-issues position under the new doctor, preserves original check-in time for fairness where policy allows.
2. Pause/resume queue handling: doctor can pause their queue (e.g., short break) — no new calls processed, existing display still shows position, patients not silently dropped.
3. Cancellation/no-show handling: patient or staff cancels a `WAITING` token; distinct status from consultation no-response.
4. 🛡️ System/dependency fallback procedure: if a non-critical dependency (e.g. notification service) fails during a queue operation, the queue operation itself must still complete — never fail the whole check-in/call/complete transaction because a side-effect (notification) failed. Side-effects are dispatched via the async messaging layer (A.2), not inline in the request path.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/queue/tokens/:id/transfer` | `{ toDoctorId, reason }` | `200 { newTokenId }` |
| POST | `/api/v1/queue/doctors/:doctorId/pause` | `{ reason }` | `200 {}` |
| POST | `/api/v1/queue/doctors/:doctorId/resume` | | `200 {}` |
| POST | `/api/v1/queue/tokens/:id/cancel` | `{ reason }` | `200 { status: "CANCELLED" }` |

**Business Rules:** A paused doctor's queue still accepts new check-ins (they queue up) but `call-next` is blocked with `QUE_DOCTOR_PAUSED` (422) until resumed.

**Edge Cases:** Notification dispatch (NOT-02) fails after a successful `call-next` → the call-next result to the caller is still `200` (the core transaction succeeded); the notification failure is logged and retried per NOT-03's retry policy — it never rolls back the queue state.

**Acceptance Criteria:**
- [ ] A failed non-critical side-effect never fails the core queue transaction.
- [ ] Pause correctly blocks call-next but not check-in.
- [ ] Transfer correctly re-queues under the new doctor.

**Depends On:** QUE-02, QUE-05, NOT-02/03. **Depended on by:** REP-02/03.

---

## MODULE: EMR — Clinical Encounter / EMR (Core Supporting Scope)

**Module Owns:** `encounters`, `vitals`, `clinical_notes`, `problem_list`, `diagnoses`, `prescriptions`, `prescription_items`.

---

### EMR-01 — Clinical Encounter Creation and Patient Context

**Functional Requirements:**
1. Encounter creation triggered from QUE-05's `start-consultation` action (or manual walk-in-without-queue for edge staff workflows).
2. Patient context summary: pulls PAT-01/02 demographics+alerts, EMR-03 relevant history, into a single "consult sidebar" payload — read-only aggregation, not a new source of truth.
3. Encounter status lifecycle: `OPEN → IN_PROGRESS → SIGNED` (terminal) or `VOIDED` (rare, admin-only correction).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/encounters` | `{ patientId, doctorId, appointmentId?, queueTokenId? }` | `201 { id, status: "OPEN" }` |
| GET | `/api/v1/encounters/:id` | | `200 {...}` |
| GET | `/api/v1/encounters/:id/context` | | `200 { demographics, alerts, recentHistory[] }` |

**Data Model:** `encounters(id, patient_id, doctor_id, appointment_id NULL, queue_token_id NULL, status ENUM(OPEN,IN_PROGRESS,SIGNED,VOIDED), opened_at, signed_at NULL)`.

**Business Rules:** One `OPEN`/`IN_PROGRESS` encounter per doctor at a time in practice (mirrors QUE-05's one-active-token rule) but not hard-DB-enforced, since encounters can legitimately span a walk-in outside queue flow.

**Edge Cases:** Encounter created but the linked queue token is later transferred (QUE-06) → encounter remains valid and independent; it's a snapshot link, not a live join.

**Acceptance Criteria:**
- [ ] Context sidebar loads correctly aggregated data from PAT/EMR-03.
- [ ] State transitions follow the defined lifecycle only.

**Depends On:** QUE-05, PAT-01/02, EMR-03. **Depended on by:** EMR-02..06, QUE-05 (completion trigger).

---

### EMR-02 — Triage, Vitals, Observations and Symptoms

**Functional Requirements:**
1. Triage capture (may duplicate/confirm QUE-04's triage tag, doctor/nurse can refine it here).
2. Vitals entry: BP, HR, temp, SpO2, weight, height, RR — each with unit and normal-range flagging (informational, not diagnostic).
3. Symptoms/observations capture: structured (from a symptom list) + free text.
4. Validation and timestamping: each vitals entry stamped with who/when recorded.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/encounters/:id/vitals` | `{ bp, hr, temp, spo2, weight, height, rr }` | `201 {...}` |
| POST | `/api/v1/encounters/:id/symptoms` | `{ symptomCodes[], freeText? }` | `201 {...}` |

**Data Model:** `vitals(id, encounter_id, recorded_by, recorded_at, bp_systolic, bp_diastolic, hr, temp_c, spo2, weight_kg, height_cm, rr)`, `symptoms(id, encounter_id, symptom_code, free_text)`.

**Business Rules:** Out-of-normal-range vitals are flagged with a non-blocking visual warning (e.g. SpO2 < 90%) — informational only, system never blocks entry or auto-escalates without human action.

**Edge Cases:** Vitals entered twice in one encounter (e.g. re-check) → both retained as separate timestamped rows, not overwritten; UI shows the latest by default with history expandable.

**Acceptance Criteria:**
- [ ] Vitals correctly validated for plausible ranges (format-level, not clinical judgment).
- [ ] History of multiple vitals entries per encounter preserved.

**Depends On:** EMR-01. **Depended on by:** EMR-04/05, REP-02.

---

### EMR-03 — Medical, Medication and Relevant History

*(Baseline-Complete Scope for PAT-03 dependency; EMR-03 itself is Sprint 3 committed per SOW §8.4.)*

**Functional Requirements:**
1. Medical history view/update: chronic conditions, past surgeries, family history — patient-editable (self-reported) + doctor-verified flag.
2. Medication history: current/past medications, cross-referenced with PHA-05 dispensing history where available.
3. Allergy/history visibility: prominent, always-visible allergy list in the consult sidebar.
4. Relevant prior encounter context: last N encounters summary, surfaced automatically.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET/PUT | `/api/v1/patients/:id/medical-history` | `{ conditions[], surgeries[], familyHistory[] }` | `200 {...}` |
| GET | `/api/v1/patients/:id/medication-history` | | `200 [{ medicine, startedAt, endedAt, source: "PRESCRIBED"|"DISPENSED" }]` |
| PUT | `/api/v1/patients/:id/allergies` | `{ allergen, reaction, severity }` | `200 {}` |

**Data Model:** `medical_history(patient_id, conditions JSONB, surgeries JSONB, family_history JSONB, verified_by NULL, verified_at NULL)`, `allergies(id, patient_id, allergen, reaction, severity ENUM(MILD,MODERATE,SEVERE))`.

**Business Rules:** Allergy severity `SEVERE` triggers a persistent alert flag (reuses PAT-02's alert mechanism) automatically — this is the one place EMR writes into PAT-02's alert table, done via PAT-02's service API, never a direct table write.

**Edge Cases:** Patient self-reports a condition that conflicts with doctor-verified data → both are retained; UI shows patient-reported vs doctor-verified distinctly, never silently overwritten.

**Acceptance Criteria:**
- [ ] Severe allergies always surface as a PAT-02 alert.
- [ ] Medication history correctly merges prescribed + dispensed sources.

**Depends On:** PAT-01/02, PHA-05. **Depended on by:** EMR-01 (context), PHA-03 (interaction/allergy check).

---

### EMR-04 — Clinical Notes and Problem List

**Functional Requirements:**
1. Structured/free-text clinical notes per encounter, supporting a SOAP-like structure (Subjective/Objective/Assessment/Plan) as optional structured fields plus free text fallback.
2. Problem list management: ongoing list of active/resolved problems per patient, not just per encounter.
3. Draft/save/sign behavior: notes are auto-saved as drafts; "sign" locks them (immutable thereafter, amendments only via EMR-06's controlled amendment).
4. Author and timestamp tracking on every note version.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| PUT | `/api/v1/encounters/:id/notes` | `{ subjective?, objective?, assessment?, plan?, freeText? }` (draft save) | `200 {...}` |
| POST | `/api/v1/encounters/:id/notes/sign` | | `200 { signed: true, signedAt }` |
| GET/POST/PATCH | `/api/v1/patients/:id/problem-list` | `{ problemCode, status: ACTIVE|RESOLVED }` | `200/201` |

**Business Rules:** Once signed, `clinical_notes` rows are immutable at the DB layer (application enforces no UPDATE after `signed_at` is set; any correction goes through EMR-06's amendment flow which creates a new linked amendment record, never edits the original).

**Edge Cases:** Auto-save draft conflicts with a "sign" request racing in another tab → sign always operates on the latest saved draft at the moment of signing; a save arriving after sign is rejected with `EMR_NOTE_ALREADY_SIGNED` (422), directing the user to use amendment instead.

**Acceptance Criteria:**
- [ ] Signed notes cannot be edited directly.
- [ ] Problem list persists across encounters (patient-level, not encounter-level).

**Depends On:** EMR-01, EMR-02. **Depended on by:** EMR-05/06.

---

### EMR-05 — Diagnosis, Orders and Prescription Creation

**Functional Requirements:**
1. Diagnosis capture: coded diagnosis (e.g. ICD-10-like code list) + free text.
2. Diagnostic order creation: creates a DIA-02 order directly from the encounter.
3. Prescription creation: line items (medicine, dosage, frequency, duration) referencing PHA-02's medicine catalog.
4. Clinical order validation: prescription items validated against PHA-03's interaction/allergy check (synchronous call) before the prescription can be finalized.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/encounters/:id/diagnoses` | `{ code, description, isPrimary }` | `201 {...}` |
| POST | `/api/v1/encounters/:id/diagnostic-orders` | `{ testIds[] }` | `201 { orderId }` (delegates to DIA-02) |
| POST | `/api/v1/encounters/:id/prescriptions` | `{ items: [{ medicineId, dosage, frequency, durationDays, instructions }] }` | `201 { prescriptionId, warnings: [] }` |

**Error Codes:** `EMR_RX_ALLERGY_CONFLICT` (422, returned inline as a blocking warning requiring explicit doctor override flag `{ acknowledgeWarnings: true }` to resubmit — never silently auto-blocked forever, but never silently ignored either), `EMR_RX_INTERACTION_WARNING` (200 with `warnings[]`, non-blocking).

**Data Model:** `diagnoses(id, encounter_id, code, description, is_primary)`, `prescriptions(id, encounter_id, patient_id, doctor_id, status ENUM(DRAFT,FINALIZED,DISPENSED,CANCELLED))`, `prescription_items(id, prescription_id, medicine_id, dosage, frequency, duration_days, instructions)`.

**Business Rules:** An allergy conflict (severe) blocks finalization until the doctor explicitly acknowledges (captured for audit — "doctor was warned and proceeded anyway" is a real, supported clinical workflow, never a silent override).

**Edge Cases:** Prescription references a medicine later marked inactive (PHA-02) before dispensing → PHA-01's pharmacist validation step surfaces this, not blocked at creation time (creation-time catalog might legitimately go stale by dispense time).

**Acceptance Criteria:**
- [ ] Allergy conflicts are always surfaced and require explicit acknowledgment.
- [ ] Prescription correctly hands off to PHA-01's queue on finalization.

**Depends On:** EMR-04, PHA-02, PHA-03, DIA-02, EMR-03 (allergy source). **Depended on by:** PHA-01, DIA-02.

---

### EMR-06 — Encounter Signing, Follow-up and Clinical History

**Functional Requirements:**
1. Encounter finalization/sign-off: locks the encounter (`status=SIGNED`), triggers QUE-05's token completion.
2. Follow-up plan: structured follow-up date/instructions, optionally auto-creating an APT-05 referral or a suggested rebooking.
3. Clinical history/timeline: chronological, cross-encounter view per patient.
4. 🔒**AUDIT** Controlled amendment/audit behavior: post-sign corrections create a new, linked, clearly-marked amendment record; the original is never mutated.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/encounters/:id/finalize` | `{ followUp?: { date, instructions } }` | `200 { status: "SIGNED" }` (triggers QUE-05 complete) |
| POST | `/api/v1/encounters/:id/amendments` | `{ field, correctedValue, reason }` (DOCTOR only) | `201 {...}` 🔒AUDIT |
| GET | `/api/v1/patients/:id/clinical-timeline` | | `200 [{ encounterSummary, date, doctor }]` |

**Business Rules:** Finalizing an encounter without a signed clinical note (EMR-04) is blocked — `EMR_NOTE_NOT_SIGNED` (422).

**Edge Cases:** Encounter finalized but QUE-05's token-complete call fails transiently → encounter finalization itself still succeeds (it's the source of truth); the queue-complete side-effect is retried asynchronously (same non-blocking pattern as QUE-06's fallback rule) rather than rolling back a clinically-signed record.

**Acceptance Criteria:**
- [ ] Cannot finalize without a signed note.
- [ ] Amendments never mutate original signed content.
- [ ] Finalization reliably (eventually) completes the linked queue token even under transient failure.

**Depends On:** EMR-04, EMR-05, QUE-05. **Depended on by:** REP-02, PAT-03 (history/documents view).

---

## MODULE: DIA — Diagnostics — Laboratory & Radiology (Controlled Supporting Scope)

**Module Owns:** `diagnostic_catalog`, `diagnostic_orders`, `diagnostic_results`. Delivered at catalog/order/work-queue/result/report level only — no lab hardware/LIS/RIS/PACS integration (explicitly excluded, see governing SOW §7.1; out of scope for this PRD pack too — do not build hardware adapters).

---

### DIA-01 — Diagnostic Test and Service Catalog

**Functional Requirements:**
1. Test/service master data: name, category (LAB/RADIOLOGY), code.
2. Test category and preparation information (e.g. "fasting required 8h") shown to patients pre-order.
3. Pricing/status metadata where applicable (links to BIL-01's chargeable service catalog by shared `serviceCode`).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/diagnostics/catalog` | `?category=` | `200 [{ id, name, category, prepInstructions, price }]` |
| POST/PATCH | `/api/v1/diagnostics/catalog` | (ADMIN) `{ name, category, prepInstructions, serviceCode }` | `201/200` |

**Data Model:** `diagnostic_catalog(id, name, category ENUM(LAB,RADIOLOGY), prep_instructions, service_code FK->BIL chargeable_services, is_active)`.

**Acceptance Criteria:**
- [ ] Catalog correctly links to BIL-01 pricing via `service_code`.

**Depends On:** BIL-01 (pricing link). **Depended on by:** DIA-02, EMR-05.

---

### DIA-02 — Diagnostic Order and Scheduling

**Functional Requirements:**
1. Order creation from encounter (EMR-05 hands off here).
2. Diagnostic appointment/scheduling: simple date/slot assignment (reuses a lightweight version of APT-02's slot concept, scoped to the diagnostic department's own capacity config, NOT the full doctor-schedule engine).
3. Order status tracking: `ORDERED → SCHEDULED → IN_PROGRESS → RESULT_PENDING → COMPLETED` / `CANCELLED`.
4. Cancellation/reschedule rules mirror APT-04's pattern at a simpler level (no waitlist).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/diagnostics/orders` | `{ patientId, encounterId, testIds[] }` | `201 { orderId, status: "ORDERED" }` |
| POST | `/api/v1/diagnostics/orders/:id/schedule` | `{ slotStart }` | `200 { status: "SCHEDULED" }` |
| PATCH | `/api/v1/diagnostics/orders/:id/status` | `{ status }` | `200 {}` |

**Data Model:** `diagnostic_orders(id, patient_id, encounter_id, status, scheduled_at NULL, created_at)`, `diagnostic_order_items(id, order_id, test_id FK)`.

**Acceptance Criteria:**
- [ ] Order status transitions follow the defined lifecycle.

**Depends On:** DIA-01, EMR-05. **Depended on by:** DIA-03.

---

### DIA-03 — Specimen/Work Queue Management

**Functional Requirements:**
1. Diagnostic work queue: lab-tech/radiologist-facing list of pending orders, filterable by test type.
2. Specimen/status capture where applicable (e.g. "specimen collected" timestamp for lab items — no barcode/hardware integration, manual entry only).
3. Assignment and processing status: assign an order item to a specific tech.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/diagnostics/work-queue` | `?type=LAB|RADIOLOGY&status=` (LAB_TECH/RADIOLOGIST) | `200 [...]` |
| PATCH | `/api/v1/diagnostics/orders/:id/items/:itemId` | `{ specimenCollectedAt?, assignedTo?, status }` | `200 {}` |

**Acceptance Criteria:**
- [ ] Work queue correctly filters by role-relevant test type.

**Depends On:** DIA-02. **Depended on by:** DIA-04.

---

### DIA-04 — Result Entry, Verification and Clinician Review

**Functional Requirements:**
1. Result entry: structured (numeric/reference-range) or free text/attachment (radiology report file, reuses PAT-03 document infra).
2. Result validation/verification: a second role (e.g. senior tech) can verify before it's finalized.
3. Abnormal/critical flagging: values outside reference range auto-flagged.
4. Clinician review and acknowledgment: ordering doctor must acknowledge critical results (tracked, not just "seen").

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/diagnostics/orders/:id/items/:itemId/result` | `{ value?, unit?, referenceRange?, attachmentDocId?, notes? }` | `201 {}` |
| POST | `/api/v1/diagnostics/results/:resultId/verify` | (senior role) | `200 { verified: true }` |
| POST | `/api/v1/diagnostics/results/:resultId/acknowledge` | (ordering DOCTOR) | `200 { acknowledged: true }` 🔒AUDIT |

**Data Model:** `diagnostic_results(id, order_item_id, value, unit, reference_range, is_abnormal BOOL, is_critical BOOL, attachment_doc_id NULL, entered_by, verified_by NULL, acknowledged_by NULL, acknowledged_at NULL)`.

**Business Rules:** `is_critical` results trigger DIA-05's critical-result notification path immediately on entry, independent of the verify/acknowledge steps (speed matters more than the full review chain for truly critical values).

**Edge Cases:** Result entered with a value outside the plausible numeric range for that test (e.g. negative weight) → rejected as `DIA_RESULT_IMPLAUSIBLE` (400), format/sanity check only, not a clinical judgment.

**Acceptance Criteria:**
- [ ] Critical flags trigger immediate notification regardless of verification state.
- [ ] Acknowledgment is tracked distinctly from "viewed."

**Depends On:** DIA-03. **Depended on by:** DIA-05, EMR-03.

---

### DIA-05 — Diagnostic Reports, Critical-Result Alerts and Patient Viewing

**Functional Requirements:**
1. Report generation: compiled PDF/structured report from DIA-04 results (reuses PAT-03 document storage).
2. Critical-result notification: immediate alert to ordering doctor via NOT-02.
3. Secure patient report access: patient views own results once released (a `released_at` gate — results aren't visible to patients until explicitly released, to allow clinician review first if policy requires).
4. Report history per patient.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/diagnostics/orders/:id/generate-report` | | `201 { reportDocId }` |
| POST | `/api/v1/diagnostics/orders/:id/release-to-patient` | (DOCTOR/ADMIN) | `200 { releasedAt }` |
| GET | `/api/v1/patients/:id/diagnostic-reports` | | `200 [...]` (only released ones for PATIENT role) |

**Business Rules:** Reports are never visible to the `PATIENT` role until `released_at` is set — this is a policy gate, configurable per test category via ADM-03 (some categories may auto-release, others require doctor release).

**Acceptance Criteria:**
- [ ] Patients never see unreleased results.
- [ ] Critical results notify the doctor immediately regardless of release status.

**Depends On:** DIA-04, PAT-03, NOT-02. **Depended on by:** REP (analytics), EMR-03.

---

## MODULE: PHA — Pharmacy & Medication Dispensing (⭐ PRIMARY SCOPE)

**Module Owns:** `medicines`, `prescription_queue_view` (derived from EMR's `prescriptions`), `dispensing_transactions`. Tightly coupled to INV (stock deduction) — every dispense MUST call INV's stock-mutation service, never write stock directly.

---

### PHA-01 — Prescription Queue and Pharmacist Validation

**Functional Requirements:**
1. Prescription work queue: all `FINALIZED` prescriptions (from EMR-05) awaiting pharmacist action, sortable by age/priority.
2. Pharmacist validation: reviews dosage, patient allergy/interaction flags (surfaced again here, not just at doctor entry — a second safety check by policy).
3. Dispensing eligibility checks: patient identity match, prescription not expired (default validity 30 days, ADM-03 configurable), not already dispensed.
4. Reject/hold/review workflow: pharmacist can hold (query the prescribing doctor) or reject (with reason) instead of proceeding.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/pharmacy/queue` | `?status=` (PHARMACIST) | `200 [...]` |
| POST | `/api/v1/pharmacy/prescriptions/:id/validate` | | `200 { validated: true, warnings: [] }` |
| POST | `/api/v1/pharmacy/prescriptions/:id/hold` | `{ reason, queryToDoctor }` | `200 { status: "ON_HOLD" }` |
| POST | `/api/v1/pharmacy/prescriptions/:id/reject` | `{ reason }` | `200 { status: "REJECTED" }` 🔒AUDIT |

**Error Codes:** `PHA_RX_EXPIRED` (422), `PHA_RX_ALREADY_DISPENSED` (409).

**Business Rules:** A `REJECTED` or `ON_HOLD` prescription notifies the prescribing doctor via NOT-02; `ON_HOLD` prescriptions re-enter the queue once the doctor responds (a simple status flip, not a full messaging thread in this baseline).

**Acceptance Criteria:**
- [ ] Expired/already-dispensed prescriptions cannot proceed to dispensing.
- [ ] Hold/reject correctly notify the prescribing doctor.

**Depends On:** EMR-05, PHA-03. **Depended on by:** PHA-04.

---

### PHA-02 — Medicine/Drug Catalog

**Functional Requirements:**
1. Medicine master data: name, generic name, manufacturer, code.
2. Dosage/form/unit data: tablet/syrup/injection, strength, unit.
3. Active/inactive status (discontinued medicines hidden from new prescriptions, retained for history).
4. Search and filtering, used by EMR-05 (prescribing) and PHA-04 (dispensing).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/medicines` | `?q=&isActive=` | `200 [...]` |
| POST/PATCH | `/api/v1/medicines` | (INVENTORY_MANAGER/ADMIN) `{ name, genericName, form, strength, unit }` | `201/200` |

**Data Model:** `medicines(id, name, generic_name, manufacturer, form ENUM(TABLET,SYRUP,INJECTION,CREAM,OTHER), strength, unit, is_active)` — **this is the same table referenced by INV-01's item master** (shared FK, not duplicated).

**Acceptance Criteria:**
- [ ] Inactive medicines excluded from new-prescription search but retained in historical records.

**Depends On:** none. **Depended on by:** EMR-05, PHA-01/03/04/05, INV-01.

---

### PHA-03 — Medication Interaction and Allergy Warnings

**Functional Requirements:**
1. Allergy check: cross-reference prescription items against EMR-03's allergy list.
2. Interaction/contraindication warning: cross-reference prescription items against each other and against the patient's active medication list (EMR-03).
3. Warning display and pharmacist acknowledgment: same acknowledge-and-log pattern as EMR-05's doctor-side check — this is the pharmacy-side second check, not a duplicate no-op.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/pharmacy/prescriptions/:id/safety-check` | | `200 { allergyConflicts: [], interactionWarnings: [] }` |
| POST | `/api/v1/pharmacy/prescriptions/:id/acknowledge-warnings` | `{ warningIds[] }` (PHARMACIST) | `200 {}` 🔒AUDIT |

**Business Rules:** This service is a shared library/service called by both EMR-05 (doctor-side) and PHA-01/03 (pharmacist-side) — the interaction/allergy ruleset lives in ONE place (`SafetyCheckService`), never duplicated logic in two modules that could drift out of sync.

**Acceptance Criteria:**
- [ ] Same safety-check logic produces identical results whether called from EMR or PHA.

**Depends On:** EMR-03, PHA-02. **Depended on by:** EMR-05, PHA-01, PHA-04.

---

### PHA-04 — Medication Dispensing and Partial Dispensing

**Functional Requirements:**
1. Prescription-to-dispense workflow: convert a validated prescription into an actual dispensing transaction.
2. 🔐**CONCURRENCY-CRITICAL** Stock availability check: query INV's current stock (via INV's service, never a direct read of `stock_ledger` — always go through INV-01/03's API) before allowing dispense.
3. Full/partial dispensing: patient may receive less than prescribed (stock shortage); remainder tracked as pending/refill-eligible.
4. Batch/quantity capture: which batch(es)/lot(s) were dispensed (for expiry/recall traceability).
5. 🔐**CONCURRENCY-CRITICAL** Dispensing transaction: atomically (a) creates `dispensing_transactions` row, (b) calls INV's stock-deduction service in the SAME database transaction (both modules share a DB in the modular-monolith architecture, so this is a single transaction, not a distributed one — see A.9 architecture note).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/pharmacy/prescriptions/:id/dispense` | `{ items: [{ prescriptionItemId, quantityDispensed, batchId }] }` | `201 { dispensingTxId, status: "FULL"|"PARTIAL" }` |

**Error Codes:** `PHA_INSUFFICIENT_STOCK` (422 — surfaces available quantity so pharmacist can decide partial-dispense), `PHA_BATCH_EXPIRED` (422, blocks dispensing from an expired batch even if stock shows available — see INV-02).

**Data Model:** `dispensing_transactions(id, prescription_id, patient_id, dispensed_by, dispensed_at)`, `dispensing_items(id, transaction_id, prescription_item_id, medicine_id, batch_id FK->INV batches, quantity_dispensed)`.

**Business Rules:** Stock deduction and dispensing-record creation are one atomic DB transaction — a failure in either rolls back both; there is never a state where stock is deducted but no dispensing record exists, or vice versa.

**Edge Cases:** Two pharmacists attempt to dispense against the last unit of stock simultaneously → 🔐 row-level lock on the stock ledger row (or batch row) ensures only one succeeds; the other gets `PHA_INSUFFICIENT_STOCK` and must re-check.

**Acceptance Criteria:**
- [ ] Dispensing and stock deduction are atomic — no partial-success states.
- [ ] Partial dispensing correctly tracks the remainder for refill (PHA-05).
- [ ] Expired batches are blocked from dispensing.

**Depends On:** PHA-01, PHA-03, INV-01/02/03. **Depended on by:** PHA-05, INV-03 (ledger entries).

---

### PHA-05 — Dispensing History, Refills, Substitution and Patient Instructions

**Functional Requirements:**
1. Dispensing history: full record per patient/prescription, feeding EMR-03's medication history.
2. Refill eligibility/status: for prescriptions with repeat authorization (e.g. chronic meds), track how many refills remain.
3. Approved substitution capture: if a generic/alternate brand was substituted, record original vs dispensed medicine with pharmacist justification.
4. Dosage/instruction handoff: patient-facing printed/digital label with dosage instructions.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/patients/:id/dispensing-history` | | `200 [...]` |
| GET | `/api/v1/pharmacy/prescriptions/:id/refill-status` | | `200 { refillsRemaining, nextEligibleDate }` |
| POST | `/api/v1/pharmacy/dispensing/:txId/substitute` | `{ originalMedicineId, substitutedMedicineId, reason }` | `200 {}` 🔒AUDIT |
| GET | `/api/v1/pharmacy/dispensing/:txId/label` | | `200 { patientName, medicines: [...], instructions }` |

**Acceptance Criteria:**
- [ ] Dispensing history correctly feeds EMR-03.
- [ ] Substitutions are always justified and audited.

**Depends On:** PHA-04. **Depended on by:** EMR-03, REP-03.

---

## MODULE: INV — Inventory & Procurement (⭐ PRIMARY SCOPE)

**Module Owns:** `inventory_items`, `stock_locations`, `batches`, `stock_ledger`, `stock_transfers`, `reorder_thresholds`, `suppliers`, `purchase_orders`. **This module is the single source of truth for all stock quantities system-wide — PHA and any other module NEVER write to `stock_ledger` directly, they call INV's service methods.**

---

### INV-01 — Medicine/Item Inventory and Location Management

**Functional Requirements:**
1. Item master and categories: extends PHA-02's `medicines` table with inventory-specific fields (or a 1:1 companion table `inventory_items` keyed by `medicine_id`), plus non-medicine consumables (bandages, syringes) as a `category=CONSUMABLE` item type not tied to PHA-02 at all.
2. Store/location setup: multiple stock locations (main pharmacy store, ward sub-store, etc.).
3. Stock-on-hand view: current quantity per item per location, always computed as `SUM(stock_ledger.quantity_delta)` for that item+location — never a separately-maintained "current quantity" column that can drift out of sync with the ledger (the ledger is the source of truth; a materialized/cached balance is allowed for read performance but must be reconciled against the ledger, never authoritative on its own).
4. Inventory search/filter by name, category, location.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/inventory/items` | `?category=&locationId=&q=` | `200 [{ id, name, category, stockOnHand }]` |
| POST | `/api/v1/inventory/items` | (INVENTORY_MANAGER) `{ medicineId? (nullable for consumables), name, category, unit }` | `201 {}` |
| POST/GET | `/api/v1/inventory/locations` | `{ name, type }` | `201/200` |

**Data Model:**
```
inventory_items(id, medicine_id NULL FK->medicines, name, category ENUM(MEDICINE,CONSUMABLE), unit, is_active)
stock_locations(id, name, type ENUM(MAIN_STORE, PHARMACY, WARD_SUBSTORE))
```

**Acceptance Criteria:**
- [ ] Stock-on-hand always matches the sum of ledger entries (reconciliation job, see INV-03).

**Depends On:** PHA-02 (medicine link). **Depended on by:** INV-02..06, PHA-04.

---

### INV-02 — Batch, Expiry and Stock Status Management

**Functional Requirements:**
1. Batch/lot capture: each stock receipt (INV-06) creates a batch with lot number, manufacture/expiry date.
2. Expiry-date tracking per batch.
3. Near-expiry status: auto-flag batches within a configurable window (default 60 days, ADM-03) of expiry.
4. Stock status/quarantine handling: a batch can be quarantined (e.g. suspected quality issue, recall) — quarantined stock is excluded from dispensing availability (PHA-04's stock check) without being removed from the ledger.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/inventory/batches` | `?itemId=&locationId=&status=&nearExpiry=true` | `200 [...]` |
| PATCH | `/api/v1/inventory/batches/:id/quarantine` | `{ reason }` (INVENTORY_MANAGER) | `200 {}` 🔒AUDIT |
| PATCH | `/api/v1/inventory/batches/:id/release` | `{ reason }` | `200 {}` 🔒AUDIT |

**Data Model:** `batches(id, item_id FK, location_id FK, lot_number, manufactured_date, expiry_date, status ENUM(ACTIVE, QUARANTINED, EXPIRED, DEPLETED))`.

**Business Rules:** A background job daily flips `status` to `EXPIRED` for any batch past its `expiry_date` — expired batches are automatically excluded from PHA-04's availability, same as quarantined.

**Edge Cases:** Batch marked `EXPIRED` by the daily job while a dispense transaction against it is mid-flight → PHA-04's dispense re-checks batch status inside its own transaction (🔐 same-transaction consistency), so a stale "active" read cannot slip through.

**Acceptance Criteria:**
- [ ] Expired/quarantined batches are never dispensable.
- [ ] Near-expiry flagging works on the configured window.

**Depends On:** INV-01, INV-06. **Depended on by:** PHA-04, INV-03.

---

### INV-03 — Stock Ledger, Adjustments and Reconciliation

**Objective:** The append-only transactional backbone all stock quantities derive from.

**Functional Requirements:**
1. Stock transaction ledger: every stock-affecting event (dispense, transfer, adjustment, goods receipt) writes exactly one immutable ledger row.
2. Adjustment workflow and reason capture: manual correction (e.g. physical count found a discrepancy) with mandatory reason code (`DAMAGE`, `THEFT`, `COUNT_CORRECTION`, `OTHER`).
3. Physical-vs-system reconciliation: a periodic count entry compares physical count to system balance and generates an adjustment for the delta.
4. 🔒**AUDIT** Audit history: every ledger entry is inherently an audit record (who, what, when, why, reference).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/inventory/ledger` | `?itemId=&locationId=&dateFrom=&dateTo=` | `200 [...]` paginated |
| POST | `/api/v1/inventory/adjustments` | `{ itemId, batchId, locationId, quantityDelta, reasonCode, notes }` (INVENTORY_MANAGER) | `201 {}` 🔒AUDIT |
| POST | `/api/v1/inventory/reconciliation` | `{ itemId, locationId, physicalCount }` | `200 { systemCount, discrepancy, adjustmentCreated: bool }` |

**Data Model:**
```
stock_ledger(id UUID PK, item_id FK, batch_id FK NULL, location_id FK, quantity_delta INT (+/-),
  reason ENUM(DISPENSE, TRANSFER_OUT, TRANSFER_IN, GOODS_RECEIPT, ADJUSTMENT),
  ref_type TEXT, ref_id UUID, created_by, created_at)
-- NEVER UPDATE or DELETE a stock_ledger row. Corrections are new offsetting rows.
```

**Business Rules:** This is the single internal API every other stock-affecting feature (PHA-04, INV-04, INV-06) calls — `InventoryLedgerService.recordMovement(...)` — never a direct `INSERT INTO stock_ledger` from outside this module's service layer.

**Edge Cases:** Reconciliation finds a negative discrepancy larger than a configurable threshold (possible theft/major error) → still creates the adjustment (never silently blocked) but also raises a flagged review event for Admin/Management (feeds REP-04).

**Acceptance Criteria:**
- [ ] Ledger is truly append-only (no update/delete permission at the DB role level for this table).
- [ ] Stock-on-hand computed from the ledger always matches physical reconciliation once adjustments are applied.

**Depends On:** INV-01. **Depended on by:** PHA-04, INV-04/05/06, AI-04, REP-03/04.

---

### INV-04 — Inter-location Stock Transfer

**Functional Requirements:**
1. Transfer request: from one `stock_location` to another.
2. Source/destination validation: source must have sufficient available (non-quarantined, non-expired) stock.
3. Dispatch/receipt status: `REQUESTED → DISPATCHED → RECEIVED` (receipt confirmation at destination, not assumed).
4. 🔐**CONCURRENCY-CRITICAL** Stock update at both locations: dispatch writes a `TRANSFER_OUT` ledger row at source; receipt writes a `TRANSFER_IN` ledger row at destination — both reference the same `ref_id` (the transfer's id) for traceability, and the source deduction happens atomically at dispatch time (not at request time, to avoid holding stock hostage on an unconfirmed transfer).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/inventory/transfers` | `{ itemId, batchId, quantity, fromLocationId, toLocationId }` | `201 { id, status: "REQUESTED" }` |
| POST | `/api/v1/inventory/transfers/:id/dispatch` | | `200 { status: "DISPATCHED" }` (deducts source stock) |
| POST | `/api/v1/inventory/transfers/:id/receive` | `{ receivedQuantity }` | `200 { status: "RECEIVED" }` (adds destination stock; discrepancy vs dispatched qty auto-creates an adjustment) |

**Error Codes:** `INV_TRANSFER_INSUFFICIENT_STOCK` (422, at dispatch time), `INV_TRANSFER_QUANTITY_MISMATCH` (200 with a warning + auto-adjustment, not a hard error — partial-loss-in-transit is a real operational scenario).

**Acceptance Criteria:**
- [ ] Source stock is only deducted at dispatch, never at request.
- [ ] Receipt quantity mismatches are reconciled via an auto-generated adjustment, never silently dropped.

**Depends On:** INV-01/02/03. **Depended on by:** REP-03/04.

---

### INV-05 — Low-Stock Thresholds and Alerts

**Functional Requirements:**
1. Minimum/reorder threshold configuration per item per location.
2. Low-stock detection: background job (or triggered check on every stock deduction) compares current stock to threshold.
3. Staff alert generation via NOT-02 when a threshold is breached.
4. Alert acknowledgment/history: alerts can be acknowledged (someone is handling it) without necessarily resolving immediately.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| PUT | `/api/v1/inventory/items/:id/threshold` | `{ locationId, minQuantity, reorderQuantity }` (INVENTORY_MANAGER) | `200 {}` |
| GET | `/api/v1/inventory/alerts?status=` | | `200 [...]` |
| POST | `/api/v1/inventory/alerts/:id/acknowledge` | | `200 {}` |

**Data Model:** `reorder_thresholds(item_id, location_id, min_quantity, reorder_quantity)`, `stock_alerts(id, item_id, location_id, current_quantity, threshold, status ENUM(OPEN,ACKNOWLEDGED,RESOLVED), created_at, acknowledged_by NULL)`.

**Business Rules:** A stock alert auto-resolves (`status=RESOLVED`) when stock rises back above threshold (e.g., after a goods receipt) — the system re-checks on every relevant ledger write, never requires manual resolution when the underlying condition has cleared.

**Acceptance Criteria:**
- [ ] Alerts fire reliably on threshold breach and auto-resolve when stock recovers.

**Depends On:** INV-01/03, NOT-02. **Depended on by:** INV-06, AI-04, REP-03/04.

---

### INV-06 — Reorder Requests, Suppliers, Purchase Orders and Goods Receipt

**Functional Requirements:**
1. Supplier master: name, contact, item catalog they supply.
2. Reorder request: manually created or auto-suggested from an INV-05 alert (and optionally AI-04's forecast — see AI-04, non-blocking suggestion only).
3. Purchase order workflow: `DRAFT → SENT → PARTIALLY_RECEIVED → RECEIVED → CLOSED`.
4. Goods receipt: recording physical arrival of stock against a PO.
5. Batch/expiry capture on receipt: creates the INV-02 batch record(s) at this point.
6. Stock update: goods receipt writes a `GOODS_RECEIPT` ledger row (INV-03).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST/GET | `/api/v1/inventory/suppliers` | `{ name, contact, itemIds[] }` | `201/200` |
| POST | `/api/v1/inventory/reorder-requests` | `{ itemId, locationId, quantity, sourceAlertId? }` | `201 { status: "DRAFT" }` |
| POST | `/api/v1/inventory/purchase-orders` | `{ supplierId, items: [{ itemId, quantity, unitPrice }] }` | `201 { poNumber, status: "DRAFT" }` |
| POST | `/api/v1/inventory/purchase-orders/:id/send` | | `200 { status: "SENT" }` |
| POST | `/api/v1/inventory/purchase-orders/:id/receive` | `{ items: [{ itemId, quantityReceived, lotNumber, manufacturedDate, expiryDate }] }` | `200 { status: "PARTIALLY_RECEIVED"|"RECEIVED" }` |

**Data Model:** `suppliers(id, name, contact_info JSONB)`, `purchase_orders(id, po_number UNIQUE, supplier_id, status, created_by)`, `purchase_order_items(id, po_id, item_id, quantity_ordered, quantity_received DEFAULT 0, unit_price)`.

**Business Rules:** A PO's status auto-derives from its line items' receipt completeness (`RECEIVED` only when every line's `quantity_received >= quantity_ordered`); partial receipt is a normal, expected state, not an error.

**Edge Cases:** Goods receipt quantity exceeds ordered quantity → allowed but flagged as an over-receipt warning (auto-adjustment reason `OTHER`, requires a note), never silently truncated to the ordered amount.

**Acceptance Criteria:**
- [ ] PO status correctly reflects partial vs full receipt across all line items.
- [ ] Every goods receipt creates both a batch (INV-02) and a ledger entry (INV-03) atomically.

**Depends On:** INV-01/02/03/05. **Depended on by:** REP-03/04, AI-04.

---

## MODULE: BIL — Billing & Payments (Controlled Supporting Scope)

**Module Owns:** `chargeable_services`, `invoices`, `invoice_line_items`, `payments`, `refunds`. Excludes insurance/TPA claims, external accounting-system integration, and bound payment-gateway integration (data model only — see governing SOW §7.1; not built here).

---

### BIL-01 — Service and Charge Catalog

**Functional Requirements:**
1. Chargeable service master (consultations, procedures, diagnostic tests via DIA-01's `service_code` link, room charges).
2. Price configuration, versioned (price changes don't retroactively alter already-invoiced amounts).
3. Active/inactive charge rules.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/billing/services` | `?category=` | `200 [...]` |
| POST/PATCH | `/api/v1/billing/services` | (ADMIN/BILLING_STAFF) `{ name, category, price }` | `201/200` |

**Data Model:** `chargeable_services(id, name, category, price DECIMAL, effective_from, is_active)` — price history kept as new rows with `effective_from`, never overwritten.

**Acceptance Criteria:**
- [ ] Historical invoices remain correct even after a price change.

**Depends On:** none. **Depended on by:** DIA-01, BIL-02.

---

### BIL-02 — Charge Capture and Invoice Generation

**Functional Requirements:**
1. Encounter/service charge capture: charges accumulate against a patient from APT (consultation fee), DIA (test fees), PHA (medicine cost) automatically as those events occur.
2. Invoice creation: consolidates accumulated charges for a patient/encounter/visit into one invoice.
3. Invoice status and history: `DRAFT → ISSUED → PARTIALLY_PAID → PAID → VOID`.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/billing/charges` | (system-triggered from APT/DIA/PHA) `{ patientId, encounterId?, serviceId, quantity }` | `201 {}` |
| POST | `/api/v1/billing/invoices` | `{ patientId, chargeIds[] }` | `201 { invoiceNumber, total, status: "ISSUED" }` |
| GET | `/api/v1/billing/invoices/:id` | | `200 {...}` |

**Data Model:** `invoices(id, invoice_number UNIQUE, patient_id, total_amount, status, issued_at)`, `invoice_line_items(id, invoice_id, description, unit_price, quantity, subtotal, source_ref_type, source_ref_id)`.

**Business Rules:** A charge, once attached to an issued invoice, is locked; correcting it requires BIL-05's authorized-reversal flow, not editing the line item.

**Acceptance Criteria:**
- [ ] Invoice total always equals the sum of its line items (DB check constraint or computed column).

**Depends On:** BIL-01, PAT-01. **Depended on by:** BIL-03/04/05/06.

---

### BIL-03 — Discount, Tax, Waiver and Pricing Rules

*(Baseline-Complete Scope — Sprint 4 hardening per SOW §6.2.)*

**Functional Requirements:**
1. Discount rules: percentage or flat, applied at invoice or line-item level, with a reason code.
2. Tax configuration: rate(s) applicable per service category.
3. Authorized waiver handling: full/partial waiver requires an approving role (BILLING_STAFF cannot self-approve above a configurable threshold; ADMIN required above it).
4. Final amount calculation: `subtotal - discount + tax - waiver = finalTotal`, computed server-side only.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/billing/invoices/:id/discount` | `{ type: "PERCENT"|"FLAT", value, reason }` | `200 { newTotal }` |
| POST | `/api/v1/billing/invoices/:id/waiver` | `{ amount, reason }` (approval-gated) | `200 {}` 🔒AUDIT |

**Business Rules:** Waiver above threshold auto-routes to `PENDING_APPROVAL` status requiring an ADMIN action before the invoice total updates.

**Acceptance Criteria:**
- [ ] Final total calculation is never computed client-side and trusted.
- [ ] Waivers above threshold require explicit admin approval.

**Depends On:** BIL-02. **Depended on by:** BIL-04.

---

### BIL-04 — Payment Collection and Payment-Status Management

**Functional Requirements:**
1. Payment initiation/recording: records a payment against an invoice (mode: CASH, CARD, UPI, OTHER — no bound gateway, manual/adapter-agnostic recording per SOW §7.1).
2. Payment status: `PENDING → SUCCESS` / `FAILED`.
3. Payment reference capture: external transaction reference (if applicable), for reconciliation.
4. Failed/pending payment handling: does not mark an invoice paid until a `SUCCESS` payment record exists.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/billing/invoices/:id/payments` | `{ amount, mode, externalRef? }` | `201 { paymentId, status: "PENDING" }` |
| PATCH | `/api/v1/billing/payments/:id/status` | `{ status: "SUCCESS"|"FAILED" }` | `200 {}` (on SUCCESS, re-evaluates invoice status) |

**Data Model:** `payments(id, invoice_id, amount, mode, external_ref NULL, status, recorded_by, recorded_at)`.

**Business Rules:** Invoice status becomes `PAID` only when `SUM(successful payments) >= finalTotal`; `PARTIALLY_PAID` for partial sums — computed server-side on every payment status change.

**Acceptance Criteria:**
- [ ] Invoice status accurately reflects cumulative successful payments at all times.

**Depends On:** BIL-02/03. **Depended on by:** BIL-05/06.

---

### BIL-05 — Refunds, Reversals and Payment Exception Handling

*(Baseline-Complete Scope — Sprint 4 hardening per SOW §6.2.)*

**Functional Requirements:**
1. Refund request: against a `SUCCESS` payment.
2. Authorized reversal workflow: requires an approving role, mirrors BIL-03's waiver approval-gate pattern.
3. Exception reconciliation: mismatches between recorded payments and invoice totals surfaced for Billing Staff review.
4. 🔒**AUDIT** Audit trail on every refund/reversal.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/billing/payments/:id/refund` | `{ amount, reason }` (approval-gated) | `201 { refundId, status: "PENDING_APPROVAL"|"PROCESSED" }` 🔒AUDIT |
| GET | `/api/v1/billing/exceptions` | (BILLING_STAFF) | `200 [...]` |

**Acceptance Criteria:**
- [ ] Refunds cannot exceed the original payment amount.
- [ ] All refunds are audited with an approver identity.

**Depends On:** BIL-04. **Depended on by:** BIL-06.

---

### BIL-06 — Receipts, Statements, Reconciliation and Financial Audit

*(Baseline-Complete Scope — Sprint 4 hardening per SOW §6.2.)*

**Functional Requirements:**
1. Receipt generation per successful payment (PDF, reuses PAT-03 document infra).
2. Patient statement: consolidated view of all invoices/payments over a period.
3. Payment reconciliation: daily summary of recorded payments vs invoice totals for Billing Staff sign-off.
4. 🔒**AUDIT** Financial transaction audit: full traceable log of every invoice/payment/refund/waiver action.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/billing/payments/:id/receipt` | | `200 { receiptDocId }` |
| GET | `/api/v1/patients/:id/statement` | `?dateFrom=&dateTo=` | `200 {...}` |
| GET | `/api/v1/billing/reconciliation` | `?date=` (BILLING_STAFF) | `200 { totalInvoiced, totalCollected, discrepancies[] }` |

**Acceptance Criteria:**
- [ ] Reconciliation report correctly surfaces any invoice/payment mismatch for a given day.

**Depends On:** BIL-02/04/05. **Depended on by:** REP-04/05.

---

## MODULE: IPD — Inpatient / Ward Management (Controlled Supporting Scope)

**Module Owns:** `admissions`, `wards`, `beds`, `bed_assignments`, `ward_movements`. Scope is practical admission/bed/discharge coordination only — no ICU/OT/NICU/nurse-rostering/ambulance systems (explicitly excluded, SOW §7.1).

*(All IPD-01..05 features are Baseline-Complete Scope — Sprint 4 hardening / post-hardening continuation per SOW §6.2.)*

---

### IPD-01 — Admission Request and Approval

**Functional Requirements:**
1. Admission request: created from an encounter (doctor recommends admission) or directly by Reception.
2. Admission eligibility/approval: an approving role (DOCTOR or ADMIN) confirms before an admission record is created.
3. Admission record creation: on approval, generates an admission number and moves to bed assignment (IPD-02).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/ipd/admission-requests` | `{ patientId, encounterId?, reason }` | `201 { status: "PENDING" }` |
| POST | `/api/v1/ipd/admission-requests/:id/approve` | (DOCTOR/ADMIN) | `200 { admissionId, admissionNumber }` |

**Data Model:** `admissions(id, admission_number UNIQUE, patient_id, requested_by, approved_by, status ENUM(REQUESTED, APPROVED, ADMITTED, DISCHARGED), admitted_at NULL, discharged_at NULL)`.

**Acceptance Criteria:**
- [ ] Admission record only created after explicit approval.

**Depends On:** EMR-01, PAT-01. **Depended on by:** IPD-02/03.

---

### IPD-02 — Bed, Ward and Occupancy Management

**Functional Requirements:**
1. Wards and beds master: ward name/type, beds per ward with bed number.
2. Bed availability: real-time free/occupied view.
3. Occupancy status per bed: `VACANT, OCCUPIED, CLEANING, MAINTENANCE`.
4. Bed assignment rules: cannot assign an already-`OCCUPIED` bed (🔐 same unique-constraint concurrency pattern as APT-03: unique active assignment per bed).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST/GET | `/api/v1/ipd/wards` | `{ name, type }` (ADMIN) | `201/200` |
| POST/GET | `/api/v1/ipd/beds` | `{ wardId, bedNumber }` | `201/200` |
| GET | `/api/v1/ipd/beds/availability?wardId=` | | `200 [{ bedId, status }]` |

**Data Model:** `wards(id, name, type)`, `beds(id, ward_id, bed_number, status)`, unique constraint ensuring one active `bed_assignments` row per bed.

**Acceptance Criteria:**
- [ ] Double-assignment to an occupied bed is impossible under concurrent requests.

**Depends On:** ADM-01. **Depended on by:** IPD-03.

---

### IPD-03 — Patient Admission, Transfer and Movement

**Functional Requirements:**
1. Admission check-in: patient physically admitted, bed assigned, `admissions.status → ADMITTED`.
2. Bed/ward transfer: move patient to a different bed/ward mid-stay.
3. Movement history: full log of bed/ward changes per admission.
4. Transfer validation: destination bed must be `VACANT` (same concurrency rule as IPD-02).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/ipd/admissions/:id/check-in` | `{ bedId }` | `200 { status: "ADMITTED" }` |
| POST | `/api/v1/ipd/admissions/:id/transfer` | `{ toBedId, reason }` | `200 {}` 🔒AUDIT |
| GET | `/api/v1/ipd/admissions/:id/movements` | | `200 [...]` |

**Data Model:** `bed_assignments(id, admission_id, bed_id, assigned_at, released_at NULL)`, `ward_movements(id, admission_id, from_bed_id NULL, to_bed_id, reason, moved_at)`.

**Acceptance Criteria:**
- [ ] Full movement history reconstructable per admission.

**Depends On:** IPD-01/02. **Depended on by:** IPD-04/05.

---

### IPD-04 — Inpatient Care, Medication and Discharge Coordination

**Functional Requirements:**
1. Inpatient care tasks/notes: daily rounds/nursing notes tied to the admission (reuses EMR-04's note infrastructure scoped to `admission_id` in addition to `encounter_id`).
2. Medication coordination: inpatient medication administration record (MAR) — references PHA prescriptions, tracks scheduled vs administered doses.
3. Pending-order visibility: outstanding diagnostic orders (DIA) or prescriptions relevant to the admission, surfaced on a ward dashboard.
4. Discharge readiness tracking: checklist-style flag set by the attending doctor.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/ipd/admissions/:id/care-notes` | `{ note, authorRole }` | `201 {}` |
| POST | `/api/v1/ipd/admissions/:id/medication-administration` | `{ prescriptionItemId, administeredAt }` | `201 {}` 🔒AUDIT |
| GET | `/api/v1/ipd/admissions/:id/pending-orders` | | `200 { diagnosticOrders: [], prescriptions: [] }` |
| PATCH | `/api/v1/ipd/admissions/:id/discharge-readiness` | `{ ready: bool }` (DOCTOR) | `200 {}` |

**Acceptance Criteria:**
- [ ] MAR entries are immutable once recorded (corrections via a new linked entry, same amendment pattern as EMR-06).

**Depends On:** IPD-03, EMR-04, PHA, DIA-02. **Depended on by:** IPD-05.

---

### IPD-05 — Discharge Summary, Final Billing and Follow-up Tracking

**Functional Requirements:**
1. Discharge summary: compiled clinical summary of the stay (diagnosis, treatment, care notes rollup).
2. Final bill coordination: triggers BIL-02 to consolidate all admission-linked charges (room, procedures, medication) into a final invoice.
3. Discharge completion: releases the bed (`bed_assignments.released_at` set, bed → `CLEANING` then `VACANT`), `admissions.status → DISCHARGED`.
4. Follow-up plan/reminder via NOT-02, reusing EMR-06's follow-up pattern.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/ipd/admissions/:id/discharge-summary` | `{ summaryText }` (DOCTOR) | `201 {}` |
| POST | `/api/v1/ipd/admissions/:id/discharge` | | `200 { status: "DISCHARGED", finalInvoiceId }` |

**Business Rules:** Discharge is blocked (`IPD_DISCHARGE_READINESS_NOT_CONFIRMED`, 422) until IPD-04's discharge-readiness flag is `true` AND a discharge summary exists.

**Acceptance Criteria:**
- [ ] Discharge always produces a final invoice covering the full stay.
- [ ] Bed is correctly released and made available for reassignment.

**Depends On:** IPD-04, BIL-02, NOT-02. **Depended on by:** REP-04.

---

## MODULE: NOT — Notifications & Communications (Core Supporting Scope)

**Module Owns:** `notification_templates`, `notification_events`, `channel_preferences`. **This is the ONLY module that sends outbound communications** — no other module calls an SMS/email provider directly; they all publish an event that NOT consumes. Provider-agnostic abstraction only — no specific named provider bound (SOW §7.1); build against an `INotificationProvider` interface with a stub/console/log provider for now.

---

### NOT-01 — Notification Preferences, Consent and Templates

**Functional Requirements:**
1. Channel preferences per user: SMS/Email/In-App, opt-in per category (appointment, queue, promotional-none-in-scope).
2. Communication consent: reads/writes IAM-05's `consents` table (owned there, referenced here).
3. Template management: parameterized templates per notification type (e.g. `APPOINTMENT_CONFIRMED: "Hi {{name}}, your appointment with Dr. {{doctor}} on {{date}} is confirmed."`).
4. Template version/status: templates are versioned; changing a template doesn't alter history of already-sent notifications (store the rendered content, not just the template reference, on each sent notification).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET/PUT | `/api/v1/users/me/notification-preferences` | `{ channel, category, enabled }` | `200 {}` |
| GET/POST/PATCH | `/api/v1/admin/notification-templates` | (ADMIN) `{ code, channel, body }` | `200/201` |

**Data Model:** `notification_templates(id, code, channel ENUM(SMS,EMAIL,IN_APP), body_template, version, is_active)`, `channel_preferences(user_id, category, channel, enabled)`.

**Acceptance Criteria:**
- [ ] Withdrawing consent (IAM-05) stops all non-mandatory sends to that user, verified end-to-end.

**Depends On:** IAM-05. **Depended on by:** NOT-02.

---

### NOT-02 — Appointment, Queue, Doctor-Delay, Prescription and Operational Notifications

**Objective:** The consumer side — every other module publishes an event; this feature renders and dispatches it.

**Functional Requirements:**
1. Appointment notifications: confirmation, reminder (T-24h/T-1h), cancellation, reschedule.
2. Queue/turn notifications: "you're next," "please proceed to room X."
3. Doctor-delay notifications: bulk notify waiting patients if a doctor is running significantly behind (staff-triggered).
4. Prescription-ready notifications: from PHA-01/04 events.
5. Operational alerts: low-stock (INV-05), critical diagnostic result (DIA-05) — routed to staff, not patients.

**API Contract (internal event contract, consumed via the async messaging layer, not a public REST surface for most of these):**
```json
// Published by any module onto the "notifications" topic:
{ "eventType": "APPOINTMENT_CONFIRMED", "recipientUserId": "uuid", "templateCode": "APPOINTMENT_CONFIRMED", "params": { "name": "...", "doctor": "...", "date": "..." }, "refType": "APPOINTMENT", "refId": "uuid" }
```
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/users/me/notifications` | in-app inbox | `200 [...]` |
| POST | `/api/v1/queue/doctors/:id/broadcast-delay` | `{ message }` (staff) | `200 { notifiedCount }` |

**Business Rules:** Every publisher module (APT, QUE, PHA, INV, DIA) emits events; it never knows or cares whether the send succeeds — that's NOT-03's job. This decoupling is what satisfies QUE-06's fallback rule (A.4.10-adjacent: a notification failure never blocks the originating transaction).

**Acceptance Criteria:**
- [ ] All listed event types render correctly from their templates with actual data substituted.
- [ ] In-app inbox reflects sent notifications for the recipient.

**Depends On:** NOT-01, all publishing modules. **Depended on by:** none (leaf/consumer).

---

### NOT-03 — Delivery Status, Retry and Communication History

*(Baseline-Complete Scope — Sprint 4 hardening per SOW §6.2.)*

**Functional Requirements:**
1. Delivery tracking: `PENDING → SENT → DELIVERED / FAILED` per notification event (per channel, since a notification can fan out to SMS+Email+In-App).
2. Retry policy: exponential backoff (e.g. 1m, 5m, 30m), max 3 attempts, then `FAILED` permanently.
3. Failure handling: failed sends surface in an admin dashboard, never silently dropped.
4. 🔒**AUDIT** Communication history/audit: full per-user, per-event send log.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/admin/notifications` | `?status=&dateFrom=` | `200 [...]` |
| POST | `/api/v1/admin/notifications/:id/retry` | manual retry override | `200 {}` |

**Data Model:** `notification_events(id, event_type, recipient_user_id, channel, rendered_body, status, attempt_count, last_attempted_at, ref_type, ref_id, created_at)`.

**Acceptance Criteria:**
- [ ] Failed sends retry per policy and eventually surface for manual review after max attempts.
- [ ] Full send history is queryable per user or per source event.

**Depends On:** NOT-02. **Depended on by:** REP (analytics), SEC-03 (security-event notification reliability).

---

## MODULE: REP — Dashboards, Reporting & Analytics (Core Supporting Scope)

**Module Owns:** no primary tables — this module is a **read-only aggregation layer** over other modules' data. It never writes to another module's tables; every dashboard endpoint is a query/materialized-view built from existing schemas.

---

### REP-01 — Patient Dashboard

**Functional Requirements:** Upcoming appointments (APT), queue status (QUE), prescriptions/reports list (PHA/DIA), patient activity summary (recent encounters).

**API Contract:**
| Method | Path | Response |
|---|---|---|
| GET | `/api/v1/dashboard/patient` (self) | `200 { upcomingAppointments[], activeQueueToken, recentPrescriptions[], recentReports[], activitySummary }` |

**Business Rules:** This is a fan-out read across APT/QUE/PHA/DIA's existing GET endpoints (or their underlying repositories server-side for efficiency) — never a new source of truth. **Acceptance:** [ ] Data always matches the source modules exactly (no caching staleness beyond a few seconds).

**Depends On:** APT-06, QUE-03, PHA-05, DIA-05.

---

### REP-02 — Doctor and Clinical Dashboard

**Functional Requirements:** Today's appointments, queue/encounter status, clinical workload (encounters/day), follow-up indicators (patients due for follow-up per EMR-06).

**API Contract:**
| Method | Path | Response |
|---|---|---|
| GET | `/api/v1/dashboard/doctor` (self) | `200 { todayAppointments[], queueSnapshot, workloadStats, followUpsDue[] }` |

**Depends On:** APT-06, QUE-03/05, EMR-01/06.

---

### REP-03 — Pharmacy and Inventory Dashboard

**Functional Requirements:** Prescription queue snapshot (PHA-01), dispensing status stats, stock/expiry indicators (INV-02), low-stock alerts (INV-05).

**API Contract:**
| Method | Path | Response |
|---|---|---|
| GET | `/api/v1/dashboard/pharmacy` (PHARMACIST/INVENTORY_MANAGER) | `200 { queueLength, dispensedToday, nearExpiryBatches[], openAlerts[] }` |

**Depends On:** PHA-01/05, INV-02/05.

---

### REP-04 — Admin and Operational Dashboard

**Functional Requirements:** Patient/appointment volume, queue performance (avg wait, throughput), department workload, operational alerts (aggregated from INV-05, DIA-04 critical results, BIL-06 reconciliation exceptions).

**API Contract:**
| Method | Path | Response |
|---|---|---|
| GET | `/api/v1/dashboard/admin` (ADMIN/MANAGEMENT) `?dateFrom=&dateTo=` | `200 { volumeStats, queuePerformance, departmentWorkload[], operationalAlerts[] }` |

**Depends On:** APT, QUE, INV, DIA, BIL.

---

### REP-05 — Management KPI, Trend and Scheduled Reporting

**Functional Requirements:**
1. KPI definitions: configurable named KPIs (avg wait time, no-show rate, revenue, stock turnover) computed from existing data.
2. Trend reports: time-series views of KPIs.
3. Export/download: CSV/PDF export of any report view.
4. Scheduled report generation: recurring report emailed/generated on a cron schedule (delegates dispatch to NOT-02).
5. Role-based report access: MANAGEMENT sees all; department heads see scoped subsets (via ADM's role-scope config).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/reports/kpis` | `?kpiCode=&dateFrom=&dateTo=` | `200 { series: [{ date, value }] }` |
| GET | `/api/v1/reports/:reportId/export` | `?format=csv\|pdf` | `200` (file stream) |
| POST/GET | `/api/v1/reports/scheduled` | `{ reportId, cronExpression, recipients[] }` (MANAGEMENT/ADMIN) | `201/200` |

**Business Rules:** All exports respect the same role-scoping as the underlying report view — never export data the requesting role couldn't see live.

**Acceptance Criteria:**
- [ ] KPI values are reproducible/auditable (documented formula per KPI code).
- [ ] Scheduled reports reliably generate and dispatch on their cron schedule.

**Depends On:** REP-01..04, NOT-02. **Depended on by:** none (top-level consumer).

---

## MODULE: ADM — Administration & Configuration (Platform Scope)

**Module Owns:** `departments`, `system_settings`, `workflow_configs`, `integration_configs`. This is the config backbone other modules read from — never hardcode a value here in another module's code that ADM already exposes as configurable.

---

### ADM-01 — Hospital, Department, Room and Master-Data Configuration

**Functional Requirements:** Hospital profile (name, address, logo), department configuration (referenced by SCH-01, APT-01), room/resource master (referenced by SCH-03), other operational master data (e.g. service categories).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET/PUT | `/api/v1/admin/hospital-profile` | `{ name, address, logoUrl }` (ADMIN) | `200 {}` |
| POST/GET/PATCH | `/api/v1/admin/departments` | `{ name, code }` | `201/200` |

**Data Model:** `departments(id, name, code UNIQUE)`, `hospital_profile(singleton row: name, address, logo_url)`.

**Acceptance Criteria:** [ ] Department deletion is blocked while any doctor/schedule references it (`ADM_DEPARTMENT_IN_USE`, 409) — soft-deactivate instead.

**Depends On:** none. **Depended on by:** SCH-01, APT-01, IPD-02.

---

### ADM-02 — User Lifecycle, Staff Onboarding and Administrative Approvals

*(Baseline-Complete Scope — Sprint 4 hardening per SOW §6.2.)*

**Functional Requirements:** Staff onboarding (admin creates a staff `users` row with a role, per IAM-01/02's note that staff signup is admin-only), user activation/deactivation, administrative approvals (a generic approval-queue pattern reused by other modules where noted, e.g. leave approval SCH-02 could route through here or stay local — this PRD keeps it local to each module for simplicity; ADM-02 owns only user-lifecycle approvals), role assignment workflow.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/admin/staff` | `{ name, email, phone, role, departmentId? }` (ADMIN) | `201 { userId, tempPassword sent via NOT-02 }` |
| PATCH | `/api/v1/admin/staff/:id/activate` \| `/deactivate` | | `200 {}` 🔒AUDIT |
| PATCH | `/api/v1/admin/staff/:id/role` | `{ role }` (SUPER_ADMIN) | `200 {}` 🔒AUDIT |

**Business Rules:** New staff accounts are created `status=PENDING_VERIFICATION` and must complete first-login password change (forces the temp password to be single-use).

**Acceptance Criteria:** [ ] Deactivated staff cannot log in (IAM-01 checks `status`) even with a valid old session (session revoked on deactivation, reuses IAM-04's revoke mechanism).

**Depends On:** IAM-01/02, IAM-04. **Depended on by:** all staff-role features.

---

### ADM-03 — Business Rules and Configurable Workflow Management

*(Baseline-Complete Scope — Sprint 4 hardening per SOW §6.2.)*

**Objective:** Central key-value config store for every "configurable" value referenced throughout this PRD pack (booking lead time, reschedule cutoff, no-show grace window, near-expiry window, waiver approval threshold, report-release policy, etc.) — so these aren't hardcoded per module.

**Functional Requirements:** Appointment slot rules (booking lead time, reschedule cutoff), queue priority rules (tier definitions), inventory thresholds (default reorder %), reminder timing (T-24h/T-1h defaults), configurable workflow parameters (generic namespaced key-value).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/admin/config/:namespace` | e.g. `namespace=appointments` | `200 { bookingLeadTimeMinutes, rescheduleCutoffHours, ... }` |
| PUT | `/api/v1/admin/config/:namespace` | (ADMIN) partial update | `200 {}` 🔒AUDIT |

**Data Model:** `system_config(namespace, key, value JSONB, updated_by, updated_at)` — every module reads its tunables from here via a shared `ConfigService.get(namespace, key, defaultValue)` at request time (not baked in at boot only, so admin changes take effect without a redeploy).

**Business Rules:** Every "default X, configurable via ADM-03" mention throughout this document resolves to a `system_config` row under a documented namespace/key — **maintain a single master list of these keys in code, one per module, to avoid two modules colliding on the same config key.**

**Acceptance Criteria:** [ ] Changing a config value takes effect on the next request without requiring a service restart.

**Depends On:** none. **Depended on by:** APT, QUE, PHA, INV, DIA, BIL — nearly every module.

---

### ADM-04 — System Configuration, Integration Settings and Operational Administration

*(Baseline-Complete Scope — Sprint 4 hardening per SOW §6.2.)*

**Functional Requirements:** System settings (session timeout, concurrent-session policy — feeds IAM-04), notification/provider settings (which `INotificationProvider` implementation is active, per NOT-01), integration configuration (placeholder config for a future named payment/SMS provider — data model only, no live integration per SOW §7.1), operational administration controls (maintenance-mode toggle, feature flags).

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| GET/PUT | `/api/v1/admin/system-settings` | `{ sessionTimeoutMinutes, allowMultipleSessions, maintenanceMode }` (SUPER_ADMIN) | `200 {}` 🔒AUDIT |
| GET/PUT | `/api/v1/admin/integration-settings` | `{ smsProvider, emailProvider, paymentProvider }` | `200 {}` (values stored, not yet wired to a live adapter unless a CR approves it) |

**Acceptance Criteria:** [ ] Maintenance-mode toggle correctly blocks non-admin write operations system-wide when enabled.

**Depends On:** IAM-04, NOT-01. **Depended on by:** all modules (global settings consumer).

---

## MODULE: AI — AI Decision Support (Core Supporting Scope)

**Module Owns:** an isolated service behind `/api/v1/ai/*`, called server-to-server only (never directly from the frontend). **Hard safety boundary (non-negotiable, cannot be changed by ordinary Change Request): advisory-only. No autonomous clinical diagnosis, prescribing, or treatment decisions, ever.** Every capability below MUST implement the fallback contract in A.4.10.

---

### AI-01 — Waiting-Time Prediction

**Functional Requirements:**
1. Prediction input pipeline: pulls current queue length, doctor availability, historical consultation duration, appointment type, walk-in volume (read-only queries into QUE/APT/SCH data — AI never writes to those tables).
2. Wait-time model/inference service.
3. Confidence/context display alongside the estimate.
4. Fallback to rule-based estimate: `avgConsultationMinutes * queuePositionAhead` when the model is unavailable/slow.
5. Prediction logging for future model evaluation/retraining.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/ai/wait-time-prediction` | `{ doctorId, queuePosition }` (internal, called by QUE-02) | `200 { estimatedMinutes, confidence, source: "ai_model"|"fallback" }` |

**Business Rules:** Hard timeout 500ms (per QUE-02); on timeout/error, caller uses the fallback formula itself — the fallback is NOT solely inside the AI service, it's duplicated in the caller so a total AI-service outage never blocks queue operations (belt-and-suspenders, consistent with A.4.10).

**Acceptance Criteria:** [ ] QUE-02 never blocks on this call beyond 500ms. [ ] `source` field always correctly reflects which path produced the number.

**Depends On:** QUE, APT, SCH (read-only). **Depended on by:** QUE-02.

---

### AI-02 — No-Show Prediction and Appointment Optimization

**Functional Requirements:** No-show prediction (risk score from APT-06 history), risk indicator surfaced on APT/REP-02 views (informs reminder intensity via NOT-02, e.g. an extra reminder for high-risk appointments — never used to cancel/deny), appointment optimization insight (suggested overbooking buffer, advisory), human review/override always available, outcome logging (actual no-show vs predicted, for model evaluation).

**API Contract:**
| Method | Path | Response |
|---|---|---|
| GET | `/api/v1/ai/no-show-risk?appointmentId=` | `200 { riskScore: 0-1, source }` |

**Business Rules:** Risk score is NEVER used to auto-cancel or auto-deny an appointment — enforced by simply not exposing any such action on this endpoint; consuming modules (APT, NOT) can only read it.

**Acceptance Criteria:** [ ] No code path anywhere in APT/QUE uses this score to alter appointment status automatically.

**Depends On:** APT-06 (history). **Depended on by:** NOT-02 (reminder intensity), REP-02.

---

### AI-03 — Queue Optimization Recommendations

*(Baseline-Complete Scope — Sprint 4 hardening per SOW §6.2.)*

**Functional Requirements:** Queue-state analysis, optimization recommendation (e.g. "consider calling patient B next despite FIFO, given estimated consult time"), priority/flow explanation (why the suggestion was made — required for staff trust), human approval/override (staff must explicitly accept; QUE-04's actual ordering never changes without this), 🔒 recommendation audit.

**API Contract:**
| Method | Path | Response |
|---|---|---|
| GET | `/api/v1/ai/queue-optimization?doctorId=` | `200 { suggestion: { tokenId, reason }, source }` |
| POST | `/api/v1/ai/queue-optimization/:suggestionId/apply` | (staff) | `200 {}` 🔒AUDIT (internally calls QUE-04's priority-change endpoint — never mutates the queue directly) |

**Acceptance Criteria:** [ ] Suggestions never auto-apply; every application is a distinct, audited staff action.

**Depends On:** QUE-04 (read + apply-via-existing-endpoint). **Depended on by:** REP-02.

---

### AI-04 — Inventory Demand Forecasting and Replenishment Insight

*(Baseline-Complete Scope — Sprint 4 hardening per SOW §6.2.)*

**Functional Requirements:** Demand data preparation (historical consumption from INV-03's ledger), forecast generation, reorder recommendation (advisory input to INV-06's reorder request, never auto-creates a PO), confidence/exception handling (flags low-confidence forecasts, e.g. new items with little history), human approval and outcome tracking.

**API Contract:**
| Method | Path | Response |
|---|---|---|
| GET | `/api/v1/ai/reorder-suggestions?locationId=` | `200 [{ itemId, suggestedQuantity, confidence, source }]` |

**Business Rules:** A suggestion becomes a real reorder request only via INV-06's `POST /reorder-requests` with `sourceAlertId`-equivalent linkage (`sourceSuggestionId`) — the AI module never writes to `purchase_orders`/`reorder_requests` tables.

**Acceptance Criteria:** [ ] Low-confidence forecasts are clearly flagged, never presented with false certainty.

**Depends On:** INV-03 (ledger read). **Depended on by:** INV-06.

---

## MODULE: SEC — Security, Privacy & Compliance (Core Supporting Scope)

**Module Owns:** the cross-cutting enforcement middleware and services every other module calls into. SEC does not have many "screens" — it's mostly backend infrastructure consumed by all modules.

---

### SEC-01 — RBAC, Least Privilege and Record/Department-Level Authorization

**Functional Requirements:**
1. Role-permission matrix: consumes IAM-05's `role_permissions` data.
2. Least-privilege enforcement: default-deny — an endpoint with no explicit allowed-roles configured rejects everyone but `SUPER_ADMIN`.
3. Department/record-level scope checks: e.g. a Doctor can only view encounters in their own department unless explicitly granted cross-department access.
4. 🔒 Server-side authorization tests: this is a shared `@RequireRole([...])` / `@RequireScope(...)` decorator/middleware every module's controllers use — **never implement a bespoke auth check inline in a controller method.**

**API Contract:** No public endpoints — this is the enforcement layer. Internal contract: `AuthGuard.canActivate(request)` checks JWT validity + `RoleGuard.canActivate(request, requiredRoles)` checks role + `ScopeGuard` checks department/record scope where applicable.

**Business Rules:** Every protected route in every feature PRD above declares its allowed roles (see each PRD's endpoint table); SEC-01 is the single implementation of the check, applied uniformly.

**Acceptance Criteria:** [ ] A route with no `@RequireRole` decorator is unreachable by any role except SUPER_ADMIN (default-deny verified by a standing integration test that scans all routes).

**Depends On:** IAM-01/05. **Depended on by:** every module.

---

### SEC-02 — PII Masking/Tokenization and Sensitive-Data Protection

*(Baseline-Complete Scope — Sprint 4 hardening per SOW §6.2.)*

**Functional Requirements:** PII classification (tag fields across the schema: `PATIENT_PII`, `SENSITIVE_CLINICAL`, `FINANCIAL`), masked display rules (e.g. phone shown as `+91-XXXXX-1234` to roles without full access), sensitive-field protection (full PII requires the IAM-03 step-up token for bulk export/view), controlled privileged access (an explicit "reveal full PII" action, itself audited).

**API Contract:**
| Method | Path | Response |
|---|---|---|
| POST | `/api/v1/patients/:id/reveal-pii` | requires `X-Step-Up-Token` header (IAM-03) | `200 { fullDemographics }` 🔒AUDIT |

**Business Rules:** Default GET responses across PAT/EMR/BIL return masked PII unless the requester's role is in that field's full-access allowlist (e.g. Reception sees full phone, a Lab Tech sees masked phone).

**Acceptance Criteria:** [ ] No endpoint anywhere returns unmasked PII to a role not on that field's allowlist by default.

**Depends On:** IAM-03, PAT-01. **Depended on by:** all modules returning patient data.

---

### SEC-03 — Encryption, Secure Storage, Audit Logging and Security Monitoring

**Functional Requirements:**
1. Encryption in transit/at rest: TLS everywhere; Azure-managed encryption at rest for DB and Blob.
2. Secure secret management: Azure Key Vault; no secrets in source/config committed to VCS.
3. 🔒 Audit log capture: the central sink every module's `🔒AUDIT`-marked endpoint writes to (see A.4.8's event shape) — implemented as a shared `AuditService.record(event)`, persisted to an append-only `audit_log` table + streamed to Azure Monitor.
4. Security-event monitoring and alerting: failed logins (IAM-01), account locks (IAM-04), PII reveal (SEC-02), critical config changes (ADM-04) all feed here; threshold-based alerting to admins via NOT-02.

**API Contract:**
| Method | Path | Response |
|---|---|---|
| GET | `/api/v1/admin/audit-log` | `?entityType=&actorId=&dateFrom=` (ADMIN) | `200 [...]` paginated |

**Data Model:** `audit_log(id, actor_id, actor_role, action, entity_type, entity_id, changes JSONB, timestamp)` — append-only, no update/delete DB permission granted to the application role.

**Acceptance Criteria:** [ ] Every endpoint marked 🔒AUDIT in this document actually emits an event verifiable in `audit_log` (covered by a standing integration test per module).

**Depends On:** none (foundational sink). **Depended on by:** every 🔒AUDIT-marked endpoint across all modules (see PAT-01/03/04, APT-03/04, IAM-04/05, INV-03, PHA-01/04/05, BIL-03/05/06, IPD-03/04, SEC-02, ADM-02/04).

---

### SEC-04 — Backup, Restore, Retention and Controlled Emergency Access

*(Baseline-Complete Scope — Sprint 4 hardening per SOW §6.2.)*

**Functional Requirements:**
1. Backup policy: automated daily DB backups + continuous Blob redundancy (Azure-native), documented RPO/RTO.
2. Restore procedure/testing: at least one documented, executed test restore before Production-oriented sign-off.
3. Retention rules: per data category (clinical records retained per configured policy; session/security logs retained per a shorter, separately configured window).
4. Controlled emergency/break-glass access: a documented, heavily audited procedure for emergency data access outside normal role scope (e.g., life-threatening situation, patient's own doctor unavailable) — requires dual authorization where feasible, always logged.
5. 🔒 Emergency-access audit: every break-glass use is a distinct, high-visibility audit event, reviewed by Admin/Compliance after the fact regardless of justification validity.

**API Contract:**
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/v1/admin/break-glass-access` | `{ patientId, justification }` (any clinical role) | `200 { temporaryAccessToken (short TTL) }` 🔒AUDIT (high-priority event, immediate admin notification) |

**Acceptance Criteria:** [ ] Break-glass access is always time-boxed, always logged with justification, and always triggers a review notification — never silent.

**Depends On:** SEC-03. **Depended on by:** none (top-level safety net).

---

---

# PART C — Cross-Team Compatibility Checklist

Use this before merging any feature branch, regardless of which Feature ID it implements. It exists specifically so work split across multiple people/pairs (frontend+backend, or two backend devs on adjacent features) stays interoperable.

**Before writing code:**
- [ ] Re-read Part A once (conventions don't change per feature).
- [ ] Identify your feature's "Depends On" list — read those features' **Data Model** + **API Contract** sections only.
- [ ] Identify your feature's "Depended on by" list — anyone building those features will call YOUR contract; do not change your API Contract's shape without flagging it to them.

**Backend:**
- [ ] Every endpoint matches the documented path, method, request/response shape exactly (envelope per A.4.2).
- [ ] All roles listed are enforced via the shared SEC-01 guard, not ad-hoc checks.
- [ ] 🔒AUDIT-marked actions call the shared `AuditService`.
- [ ] 🔐CONCURRENCY-CRITICAL-marked operations use a DB transaction + lock, tested under concurrent load.
- [ ] No direct writes to another module's owned tables (see each module's "Module Owns" line) — always go through that module's service.
- [ ] Config values (any "default X, ADM-03 configurable" mention) are read from `ConfigService`, not hardcoded.

**Frontend:**
- [ ] Uses shared design tokens (A.7), shared `<DataTable>`, `<FormField>`, `<RequireRole>` components.
- [ ] Calls only documented endpoints — no guessing at undocumented ones.
- [ ] Handles every documented error code with a real UI state (not just a generic toast) where the PRD implies a distinct user action (e.g. `APT_SLOT_ALREADY_BOOKED` → re-fetch availability, don't just show "error").
- [ ] Zod/validation schema for a form mirrors the backend DTO for that resource.

**Integration testing (owner of a feature is responsible for these before marking it "done"):**
- [ ] Happy path works end-to-end through the real dependency chain (not mocked), at least once against a shared Dev/Test environment.
- [ ] Every edge case listed in the Feature PRD has a corresponding test.
- [ ] Acceptance Criteria checklist in the Feature PRD is fully checked.

---

# PART D — Feature Index (quick lookup)

| ID | Feature | Module | Tier |
|---|---|---|---|
| IAM-01 | Patient/staff authentication | IAM | Platform |
| IAM-02 | Registration & identity verification | IAM | Platform |
| IAM-03 | Password recovery & step-up auth | IAM | Platform |
| IAM-04 | Session, status & suspicious-login mgmt | IAM | Platform |
| IAM-05 | Roles, permissions, profile & consent | IAM | Platform |
| PAT-01 | Patient master record & MRN | PAT | Core Supporting |
| PAT-02 | Demographics, contacts & alerts | PAT | Core Supporting |
| PAT-03 | Patient documents & record access | PAT | Core Supporting |
| PAT-04 | Patient search, duplicates & correction | PAT | Core Supporting |
| APT-01 | Doctor/dept/service discovery | APT | **Primary** |
| APT-02 | Availability & slot search | APT | **Primary** |
| APT-03 | Appointment booking | APT | **Primary** |
| APT-04 | Reschedule & cancellation | APT | **Primary** |
| APT-05 | Waitlist & referral management | APT | **Primary** |
| APT-06 | Lifecycle, history & reminders | APT | **Primary** |
| SCH-01 | Doctor schedule & clinic sessions | SCH | Core Supporting |
| SCH-02 | Leave, holiday & urgent availability | SCH | Core Supporting |
| SCH-03 | Slot duration, capacity & rooms | SCH | Core Supporting |
| SCH-04 | Exceptions, conflicts & publishing | SCH | Core Supporting |
| QUE-01 | Check-in & eligibility validation | QUE | **Primary** |
| QUE-02 | Token generation & queue entry | QUE | **Primary** |
| QUE-03 | Live queue display & position | QUE | **Primary** |
| QUE-04 | Priority/emergency/triage ordering | QUE | **Primary** |
| QUE-05 | Call, recall & turn management | QUE | **Primary** |
| QUE-06 | Transfer, pause, cancel, fallback | QUE | **Primary** |
| EMR-01 | Encounter creation & patient context | EMR | Core Supporting |
| EMR-02 | Triage, vitals, observations | EMR | Core Supporting |
| EMR-03 | Medical/medication/relevant history | EMR | Core Supporting |
| EMR-04 | Clinical notes & problem list | EMR | Core Supporting |
| EMR-05 | Diagnosis, orders & prescription | EMR | Core Supporting |
| EMR-06 | Signing, follow-up & history | EMR | Core Supporting |
| DIA-01 | Diagnostic test/service catalog | DIA | Controlled Supporting |
| DIA-02 | Diagnostic order & scheduling | DIA | Controlled Supporting |
| DIA-03 | Specimen/work queue management | DIA | Controlled Supporting |
| DIA-04 | Result entry, verification & review | DIA | Controlled Supporting |
| DIA-05 | Reports, critical alerts & viewing | DIA | Controlled Supporting |
| PHA-01 | Prescription queue & pharmacist validation | PHA | **Primary** |
| PHA-02 | Medicine/drug catalog | PHA | **Primary** |
| PHA-03 | Interaction & allergy warnings | PHA | **Primary** |
| PHA-04 | Dispensing & partial dispensing | PHA | **Primary** |
| PHA-05 | History, refills & substitution | PHA | **Primary** |
| INV-01 | Item inventory & location mgmt | INV | **Primary** |
| INV-02 | Batch, expiry & stock status | INV | **Primary** |
| INV-03 | Stock ledger, adjustments & reconciliation | INV | **Primary** |
| INV-04 | Inter-location stock transfer | INV | **Primary** |
| INV-05 | Low-stock thresholds & alerts | INV | **Primary** |
| INV-06 | Reorder, suppliers, PO & goods receipt | INV | **Primary** |
| BIL-01 | Service & charge catalog | BIL | Controlled Supporting |
| BIL-02 | Charge capture & invoice generation | BIL | Controlled Supporting |
| BIL-03 | Discount, tax & waiver rules | BIL | Controlled Supporting |
| BIL-04 | Payment collection & status | BIL | Controlled Supporting |
| BIL-05 | Refunds, reversals & exceptions | BIL | Controlled Supporting |
| BIL-06 | Receipts, statements & reconciliation | BIL | Controlled Supporting |
| IPD-01 | Admission request & approval | IPD | Controlled Supporting |
| IPD-02 | Bed, ward & occupancy mgmt | IPD | Controlled Supporting |
| IPD-03 | Admission, transfer & movement | IPD | Controlled Supporting |
| IPD-04 | Care, medication & discharge coordination | IPD | Controlled Supporting |
| IPD-05 | Discharge summary & final billing | IPD | Controlled Supporting |
| NOT-01 | Preferences, consent & templates | NOT | Core Supporting |
| NOT-02 | Appointment/queue/prescription notifications | NOT | Core Supporting |
| NOT-03 | Delivery status, retry & history | NOT | Core Supporting |
| REP-01 | Patient dashboard | REP | Core Supporting |
| REP-02 | Doctor & clinical dashboard | REP | Core Supporting |
| REP-03 | Pharmacy & inventory dashboard | REP | Core Supporting |
| REP-04 | Admin & operational dashboard | REP | Core Supporting |
| REP-05 | Management KPI & scheduled reporting | REP | Core Supporting |
| ADM-01 | Hospital/dept/room master data | ADM | Platform |
| ADM-02 | User lifecycle & staff onboarding | ADM | Platform |
| ADM-03 | Business rules & workflow config | ADM | Platform |
| ADM-04 | System/integration/operational config | ADM | Platform |
| AI-01 | Waiting-time prediction | AI | Core Supporting |
| AI-02 | No-show prediction & optimization | AI | Core Supporting |
| AI-03 | Queue optimization recommendations | AI | Core Supporting |
| AI-04 | Inventory demand forecasting | AI | Core Supporting |
| SEC-01 | RBAC & least-privilege enforcement | SEC | Core Supporting |
| SEC-02 | PII masking & sensitive-data protection | SEC | Core Supporting |
| SEC-03 | Encryption, audit logging & monitoring | SEC | Core Supporting |
| SEC-04 | Backup, restore & emergency access | SEC | Core Supporting |

**END OF DOCUMENT — 78 Feature PRDs across 16 modules, built on one shared Super PRD foundation.**
