# Going Merry HMS — Sprint 3 PRD

**Sprint:** 3 — Support Domains
**Dates:** 15 Sep – 20 Sep
**Status:** Delivery baseline
**Parent:** Going Merry HMS Master Engineering PRD
**Scope basis:** Final BRD v4.0 (78 features) → SOW/SRS (310 detailed items)

## 1. Sprint Objective

Deliver diagnostics, billing, inpatient workflows, reporting and decision support.

This sprint PRD is a delivery view of the project-wide PRD. It does not redefine business scope. Each included BRD Feature ID retains the exact objective, dependencies, API contract, data model, business rules, edge cases and acceptance criteria defined in the Master Engineering PRD.

## 2. Sprint Scope

**BRD features in this sprint: 27**

| Module | Features | Count |
|---|---|---:|
| DIA — Diagnostics — Laboratory & Radiology (Controlled Supporting Scope) | `DIA-01, DIA-02, DIA-03, DIA-04, DIA-05` | 5 |
| INV — Inventory & Procurement (⭐ PRIMARY SCOPE) | `INV-05, INV-06` | 2 |
| BIL — Billing & Payments (Controlled Supporting Scope) | `BIL-01, BIL-02, BIL-03, BIL-04, BIL-05, BIL-06` | 6 |
| IPD — Inpatient / Ward Management (Controlled Supporting Scope) | `IPD-01, IPD-02, IPD-03, IPD-04, IPD-05` | 5 |
| REP — Dashboards, Reporting & Analytics (Core Supporting Scope) | `REP-01, REP-02, REP-03, REP-04, REP-05` | 5 |
| AI — AI Decision Support (Core Supporting Scope) | `AI-01, AI-02, AI-03, AI-04` | 4 |

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

1. Diagnostics catalog/order/work queue/results → 2. Inventory alerts/procurement completion → 3. Billing → 4. Inpatient workflows → 5. Dashboards/reporting → 6. AI decision-support integrations.

AI remains advisory and cannot become a prerequisite for normal business operation.

## 5. Feature PRDs

The following feature PRDs are copied from the Master Engineering PRD without changing their contracts. They are included here so the sprint can be handed to the implementation team as a standalone PRD.


### MODULE: DIA — Diagnostics — Laboratory & Radiology (Controlled Supporting Scope)

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

---


### MODULE: INV — Inventory & Procurement (⭐ PRIMARY SCOPE)

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

---


### MODULE: BIL — Billing & Payments (Controlled Supporting Scope)

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

---


### MODULE: IPD — Inpatient / Ward Management (Controlled Supporting Scope)

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

---


### MODULE: REP — Dashboards, Reporting & Analytics (Core Supporting Scope)

### REP-01 — Patient Dashboard

**Functional Requirements:** Upcoming appointments (APT), queue status (QUE), prescriptions/reports list (PHA/DIA), patient activity summary (recent encounters).

**API Contract:**
| Method | Path | Response |
|---|---|---|
| GET | `/api/v1/dashboard/patient` (self) | `200 { upcomingAppointments[], activeQueueToken, recentPrescriptions[], recentReports[], activitySummary }` |

**Business Rules:** This is a fan-out read across APT/QUE/PHA/DIA's existing GET endpoints (or their underlying repositories server-side for efficiency) — never a new source of truth. **Acceptance:** [ ] Data always matches the source modules exactly (no caching staleness beyond a few seconds).

**Depends On:** APT-06, QUE-03, PHA-05, DIA-05.

---

---

### REP-02 — Doctor and Clinical Dashboard

**Functional Requirements:** Today's appointments, queue/encounter status, clinical workload (encounters/day), follow-up indicators (patients due for follow-up per EMR-06).

**API Contract:**
| Method | Path | Response |
|---|---|---|
| GET | `/api/v1/dashboard/doctor` (self) | `200 { todayAppointments[], queueSnapshot, workloadStats, followUpsDue[] }` |

**Depends On:** APT-06, QUE-03/05, EMR-01/06.

---

---

### REP-03 — Pharmacy and Inventory Dashboard

**Functional Requirements:** Prescription queue snapshot (PHA-01), dispensing status stats, stock/expiry indicators (INV-02), low-stock alerts (INV-05).

**API Contract:**
| Method | Path | Response |
|---|---|---|
| GET | `/api/v1/dashboard/pharmacy` (PHARMACIST/INVENTORY_MANAGER) | `200 { queueLength, dispensedToday, nearExpiryBatches[], openAlerts[] }` |

**Depends On:** PHA-01/05, INV-02/05.

---

---

### REP-04 — Admin and Operational Dashboard

**Functional Requirements:** Patient/appointment volume, queue performance (avg wait, throughput), department workload, operational alerts (aggregated from INV-05, DIA-04 critical results, BIL-06 reconciliation exceptions).

**API Contract:**
| Method | Path | Response |
|---|---|---|
| GET | `/api/v1/dashboard/admin` (ADMIN/MANAGEMENT) `?dateFrom=&dateTo=` | `200 { volumeStats, queuePerformance, departmentWorkload[], operationalAlerts[] }` |

**Depends On:** APT, QUE, INV, DIA, BIL.

---

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

---


### MODULE: AI — AI Decision Support (Core Supporting Scope)

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
