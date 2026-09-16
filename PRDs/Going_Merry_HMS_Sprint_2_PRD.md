# Going Merry HMS — Sprint 2 PRD

**Sprint:** 2 — Operations Journey
**Dates:** 9 Sep – 14 Sep
**Status:** Delivery baseline
**Parent:** Going Merry HMS Master Engineering PRD
**Scope basis:** Final BRD v4.0 (78 features) → SOW/SRS (310 detailed items)

## 1. Sprint Objective

Connect check-in, smart queue, consultation, pharmacy and inventory.

This sprint PRD is a delivery view of the project-wide PRD. It does not redefine business scope. Each included BRD Feature ID retains the exact objective, dependencies, API contract, data model, business rules, edge cases and acceptance criteria defined in the Master Engineering PRD.

## 2. Sprint Scope

**BRD features in this sprint: 24**

| Module | Features | Count |
|---|---|---:|
| QUE — Check-in, Token & Queue Management (⭐ PRIMARY SCOPE) | `QUE-01, QUE-02, QUE-03, QUE-04, QUE-05, QUE-06` | 6 |
| EMR — Clinical Encounter / EMR (Core Supporting Scope) | `EMR-01, EMR-02, EMR-03, EMR-04, EMR-05, EMR-06` | 6 |
| PHA — Pharmacy & Medication Dispensing (⭐ PRIMARY SCOPE) | `PHA-01, PHA-02, PHA-03, PHA-04, PHA-05` | 5 |
| INV — Inventory & Procurement (⭐ PRIMARY SCOPE) | `INV-01, INV-02, INV-03, INV-04` | 4 |
| NOT — Notifications & Communications (Core Supporting Scope) | `NOT-01, NOT-02, NOT-03` | 3 |

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

1. Queue check-in/token foundations → 2. Live queue and ordering → 3. Clinical encounter/triage/history/notes → 4. Diagnosis/orders/prescription → 5. Pharmacy validation/dispensing → 6. Inventory core → 7. Notifications.

The sprint should demonstrate the outpatient journey from arrival through consultation and prescription/dispensing.

## 5. Feature PRDs

The following feature PRDs are copied from the Master Engineering PRD without changing their contracts. They are included here so the sprint can be handed to the implementation team as a standalone PRD.


### MODULE: QUE — Check-in, Token & Queue Management (⭐ PRIMARY SCOPE)

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

---


### MODULE: EMR — Clinical Encounter / EMR (Core Supporting Scope)

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

---


### MODULE: PHA — Pharmacy & Medication Dispensing (⭐ PRIMARY SCOPE)

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

---


### MODULE: INV — Inventory & Procurement (⭐ PRIMARY SCOPE)

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

---


### MODULE: NOT — Notifications & Communications (Core Supporting Scope)

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
