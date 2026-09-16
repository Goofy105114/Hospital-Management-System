# Going Merry HMS — Sprint 1 PRD

**Sprint:** 1 — Core Foundation
**Dates:** 5 Sep – 8 Sep
**Status:** Delivery baseline
**Parent:** Going Merry HMS Master Engineering PRD
**Scope basis:** Final BRD v4.0 (78 features) → SOW/SRS (310 detailed items)

## 1. Sprint Objective

Deliver the secure project baseline and the patient appointment journey.

This sprint PRD is a delivery view of the project-wide PRD. It does not redefine business scope. Each included BRD Feature ID retains the exact objective, dependencies, API contract, data model, business rules, edge cases and acceptance criteria defined in the Master Engineering PRD.

## 2. Sprint Scope

**BRD features in this sprint: 24**

| Module | Features | Count |
|---|---|---:|
| IAM — Identity, Access & Account Management (Platform Scope) | `IAM-01, IAM-02, IAM-03, IAM-04, IAM-05` | 5 |
| PAT — Patient Management (Core Supporting Scope) | `PAT-01, PAT-02, PAT-03, PAT-04` | 4 |
| APT — Appointments & Referrals (⭐ PRIMARY SCOPE) | `APT-01, APT-02, APT-03, APT-04, APT-05, APT-06` | 6 |
| SCH — Doctor Scheduling & Capacity (Core Supporting Scope) | `SCH-01, SCH-02, SCH-03, SCH-04` | 4 |
| ADM — Administration & Configuration (Platform Scope) | `ADM-01, ADM-02, ADM-03, ADM-04` | 4 |
| SEC — Security, Privacy & Compliance (Core Supporting Scope) | `SEC-01` | 1 |

**Feature count rule:** these are BRD-level business capabilities. Detailed SOW/SRS child items remain underneath the feature IDs and are not counted as new features.

## 3. Shared Engineering Foundation

The following Part A foundation is reproduced from the Master Engineering PRD so this sprint PRD can be handed to an implementation team as a standalone working document. The Master PRD remains the canonical source if a shared convention is formally revised.

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

## A.8 Sprint-to-Module Traceability (official delivery planning baseline)

The sprint plan below is the official delivery allocation for the 78 BRD-level business features. A BRD feature appears in exactly one sprint. S4 also contains release/quality work (`REL-*`) that is delivery work, not additional BRD business features.

| Sprint | Dates | Focus | BRD Features | Delivery Work |
|---|---|---|---:|---|
| **Sprint 1 — Core Foundation** | 5 Sep – 8 Sep | Identity, patient management, appointments, doctor scheduling, administration foundation and initial security | **24** | Foundation/integration readiness |
| **Sprint 2 — Operations Journey** | 9 Sep – 14 Sep | Smart queue, complete clinical encounter flow, pharmacy, inventory core and notifications | **24** | End-to-end outpatient operational flow |
| **Sprint 3 — Support Domains** | 15 Sep – 20 Sep | Diagnostics, inventory completion, billing, inpatient, reporting and AI decision support | **27** | Supporting-domain integration |
| **Sprint 4 — Test & Release** | 21 Sep – 26 Sep | Security completion and production-oriented integration, testing, UAT, deployment and handover | **3** | **8 REL work items** |

### Sprint 1 — Core Foundation
`IAM-01..05`, `PAT-01..04`, `APT-01..06`, `SCH-01..04`, `ADM-01..04`, `SEC-01`

### Sprint 2 — Operations Journey
`QUE-01..06`, `EMR-01..06`, `PHA-01..05`, `INV-01..04`, `NOT-01..03`

## 4. Sprint Dependencies & Integration Order

1. IAM and authorization baseline → 2. Patient master data → 3. Administration/master data → 4. Doctor scheduling → 5. Appointment discovery/availability/booking → 6. Remaining appointment lifecycle → 7. SEC-01 authorization enforcement.

The sprint must leave a usable appointment journey and stable contracts for Sprint 2 queue/clinical work.

## 5. Feature PRDs

The following feature PRDs are copied from the Master Engineering PRD without changing their contracts. They are included here so the sprint can be handed to the implementation team as a standalone PRD.


### MODULE: IAM — Identity, Access & Account Management (Platform Scope)

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

---


### MODULE: PAT — Patient Management (Core Supporting Scope)

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

---


### MODULE: APT — Appointments & Referrals (⭐ PRIMARY SCOPE)

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

---


### MODULE: SCH — Doctor Scheduling & Capacity (Core Supporting Scope)

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

---


### MODULE: ADM — Administration & Configuration (Platform Scope)

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

---


### MODULE: SEC — Security, Privacy & Compliance (Core Supporting Scope)

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

---

## 6. Sprint Definition of Done

A feature is complete only when the applicable items below are satisfied:

- [ ] Exact API contract implemented and tested.
- [ ] Database schema, constraints and indexes match the feature PRD.
- [ ] Business rules and state transitions are enforced server-side.
- [ ] Validation and documented edge cases are handled.
- [ ] RBAC and record/department scope are enforced.
- [ ] Required audit events are emitted.
- [ ] Required concurrency protection is implemented and tested.
- [ ] Unit and integration tests cover the documented behavior.
- [ ] Frontend uses shared components/tokens and documented APIs.
- [ ] Cross-feature integration works against the shared Dev/Test environment.
- [ ] Acceptance criteria are checked.
- [ ] No undocumented API/data ownership shortcuts are introduced.

## 7. Sprint Handoff

At sprint close, the team must hand forward:

1. Working, tested feature increments.
2. Updated database migrations/schema and seed/configuration where applicable.
3. API contracts and integration notes for dependent features.
4. Test evidence and unresolved defects with severity/owner.
5. Updated backlog status and traceability from BRD → SOW/SRS → backlog → test/UAT.
6. Deployment/configuration notes required by the next sprint.

**Scope protection:** Clarifications to an existing BRD feature may be incorporated through the SRS/backlog. A materially new business capability requires the project Change Request process and must not be silently added to a sprint.

**End of Sprint PRD**
