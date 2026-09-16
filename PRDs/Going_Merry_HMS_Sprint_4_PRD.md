# Going Merry HMS — Sprint 4 PRD

**Sprint:** 4 — Test & Release
**Dates:** 21 Sep – 26 Sep
**Status:** Delivery baseline
**Parent:** Going Merry HMS Master Engineering PRD
**Scope basis:** Final BRD v4.0 (78 features) → SOW/SRS (310 detailed items)

## 1. Sprint Objective

Complete integration, testing, UAT, defect closure, deployment and handover by 26 September.

This sprint PRD is a delivery view of the project-wide PRD. It does not redefine business scope. Each included BRD Feature ID retains the exact objective, dependencies, API contract, data model, business rules, edge cases and acceptance criteria defined in the Master Engineering PRD.

## 2. Sprint Scope

**BRD features in this sprint: 3**

| Module | Features | Count |
|---|---|---:|
| SEC — Security, Privacy & Compliance (Core Supporting Scope) | `SEC-02, SEC-03, SEC-04` | 3 |

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

1. Complete PII protection, encryption/audit/security monitoring and recovery controls → 2. End-to-end integration testing → 3. RBAC/security testing → 4. Regression/smoke/performance checks → 5. Defect closure → 6. Deployment/rollback → 7. Post-deployment smoke tests → 8. Documentation → 9. Client UAT and sign-off.


## 5. Feature PRDs

The following feature PRDs are copied from the Master Engineering PRD without changing their contracts. They are included here so the sprint can be handed to the implementation team as a standalone PRD.


### MODULE: SEC — Security, Privacy & Compliance (Core Supporting Scope)

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

---

## Sprint 4 Release & Quality Work

These are delivery/quality work items and are **not BRD business features**. They sit alongside SEC-02..04 to complete the production-oriented release.

| ID | Work item | Purpose |
|---|---|---|
| REL-01 | Execute end-to-end integration test suite | Verify the complete business journey across modules. |
| REL-02 | Execute role-based security and access testing | Verify RBAC, least privilege and protected access. |
| REL-03 | Execute regression, smoke and performance checks | Verify existing workflows remain stable and responsive. |
| REL-04 | Triage and close release-blocking defects | Remove blockers before UAT/release. |
| REL-05 | Prepare production deployment and rollback plan | Make release repeatable and recoverable. |
| REL-06 | Deploy HMS release and run post-deployment smoke tests | Verify the deployed release. |
| REL-07 | Prepare user, technical and release documentation | Support handover and operational use. |
| REL-08 | Conduct client UAT, final demo and sign-off | Obtain client validation and release approval. |

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
- [ ] All REL-01..08 release/quality activities are completed or formally accepted as an open risk by the PM/client.
- [ ] Client UAT/sign-off is recorded before final project closure.

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
