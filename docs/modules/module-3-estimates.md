# Module 3 — Estimates & Sales Orders (Bent Estimator)

## 1. Purpose

Module 3 defines **how estimates are created, versioned, priced, approved, and finalized into a Primary Sales Order** for a project.

This module exists to:
- Provide Bent’s **internal estimating engine** (cost → price) for custom fabrication
- Capture costs **separately** (labor, materials, outside services, overhead)
- Support **multiple drafts + unlimited versions**, including cloning from any prior version
- Enforce **immutability after Send**
- Produce:
  - a **client-facing quote view**
  - an **internal profit/forecast view**
  - a **BOM/procurement-ready output** for a later Purchasing module
- Convert a selected **Approved estimate version** into a **Primary Sales Order** (immutable record of what was sold)

This module explicitly **does not**:
- Create or manage Purchase Orders
- Sync to QuickBooks (POs, invoices, payments)
- Handle production phases, scheduling, or shop-floor execution
- Handle time tracking / actual hours (but stores estimated hours for later comparison)
- Handle permissions / auth / RLS

---

## 2. Scope (LOCKED)

### In Scope
- Estimate container per project
- **Unlimited estimate versions** with clone/new flows (multiple drafts allowed)
- Estimate version lifecycle: **draft → sent → approved | rejected**
- Immutability rules (sent/approved/rejected immutable)
- Estimator engine with:
  - **Settings** (rates, overhead, tiered margin, fees, taxes, install/delivery defaults)
  - Materials & outside services catalogs (with vendor metadata fields)
  - Component mapping (materials/services/labor hours → line items)
  - Per-line upcharges: rush, special finish, manual overrides
  - Separate buckets: **labor, materials, outside services, overhead**
  - Profit breakdown: gross/net + %
  - Payment schedule planning (milestones, amounts, timing)
- Primary Sales Order:
  - Create **one Primary Sales Order per project** from a chosen Approved estimate version
  - Sales order immutable snapshot (line items + totals + source reference)
- BOM / procurement output:
  - Aggregate materials & services from selected version (vendor-grouping-ready)
  - Output used later to generate POs (Module 3 does not create POs)
- UI surfaces (owned by this module):
  - Estimate list per project
  - Estimate version editor (internal)
  - Client quote view
  - Profit/forecast view
  - BOM/procurement view
  - Sales order view (read-only)

### Out of Scope
- Purchasing: vendors as entities, RFQs, POs, receiving
- QuickBooks integration (POs/invoices/payments)
- Production phases, routing, scheduling
- Time tracking / actual vs estimated comparisons (future module; store estimated hours now)
- Permissions / RLS / multi-user locking
- Change orders / add-on sales orders (deferred; see Parking Lot)
- Multi-currency

---

## 3. Data Surface

### Tables Touched / Added

> NOTE: Enforcement of lifecycle/immutability rules is handled at the application layer (not DB), consistent with Module 2 patterns, unless explicitly stated otherwise.

#### `estimates`
Container per project.
- id (uuid, PK)
- project_id (uuid, FK → projects.id)
- created_at (timestamptz)
- updated_at (timestamptz)

**Constraint (locked for v1):**
- unique(project_id) — one estimate container per project (simplifies versioning and UI)

#### `estimate_versions`
Versioned estimate revisions.
- id (uuid, PK)
- estimate_id (uuid, FK → estimates.id)
- version_number (int, not null) — starts at 1; increments per estimate
- status (text, not null) — `draft | sent | approved | rejected`
- name (text, nullable) — optional label (e.g. “v3 — revised scope”)
- created_at, updated_at
- sent_at (nullable)
- approved_at (nullable)
- rejected_at (nullable)

**Locked decisions:**
- Multiple drafts allowed.
- Draft editable; sent/approved/rejected immutable.

#### `estimate_settings_snapshots`
Frozen settings per estimate version (auditability).
- id (uuid, PK)
- estimate_version_id (uuid, FK → estimate_versions.id, UNIQUE)
- shop_rate (numeric)
- assembly_rate (numeric)
- finishing_rate (numeric)
- install_rate (numeric)
- packing_rate (numeric)
- overhead_pct (numeric)
- margin_tiers_json (jsonb) — tier rules for pricing
- rush_fee_mode (text: `percent | fixed`)
- rush_fee_value (numeric)
- special_finish_fee_pct (numeric)
- tax_mode (text)
- tax_pct (numeric)
- install_pct_default (numeric)
- delivery_base (numeric)
- outside_services_markup_mode (text: `percent | fixed`)
- outside_services_markup_value (numeric)
- created_at (timestamptz)

#### `materials_catalog`
- id (uuid, PK)
- name (text)
- unit_type (text) — e.g. `sheet`, `ft`, `each`, `sqft`
- unit_cost (numeric)
- preferred_vendor_name (text, nullable)
- vendor_sku (text, nullable)
- default_waste_pct (numeric, nullable)
- lead_time_days (int, nullable)
- notes (text, nullable)
- created_at, updated_at

#### `services_catalog`
Outside services / outsourcing.
- id (uuid, PK)
- name (text)
- unit_type (text) — `each`, `hour`, `job`
- base_cost (numeric)
- preferred_vendor_name (text, nullable)
- lead_time_days (int, nullable)
- notes (text, nullable)
- created_at, updated_at

#### `labor_categories`
- id (uuid, PK)
- key (text, UNIQUE) — `shop | assembly | finishing | install | packing`
- display_name (text)
- default_rate (numeric)
- created_at, updated_at

#### `estimate_line_items`
Estimator line items (quoted objects).
- id (uuid, PK)
- estimate_version_id (uuid, FK → estimate_versions.id)
- name (text)
- description_internal (text, nullable)
- description_client (text, nullable)
- quantity (numeric, default 1)
- sort_order (int)
- created_at, updated_at

Per-line upcharge controls:
- rush_enabled (bool, default false)
- rush_override_mode (text, nullable)
- rush_override_value (numeric, nullable)
- special_finish_enabled (bool, default false)
- special_finish_override_pct (numeric, nullable)
- manual_price_override (numeric, nullable) — policy defined in Portion A

#### `estimate_components`
Cost decomposition records attached to a line item. BOM inputs.
- id (uuid, PK)
- estimate_line_item_id (uuid, FK → estimate_line_items.id)
- type (text) — `material | service | labor`
- material_id (uuid, FK → materials_catalog.id, nullable)
- service_id (uuid, FK → services_catalog.id, nullable)
- labor_category_key (text, nullable) — matches labor_categories.key
- quantity (numeric, nullable) — materials/services
- unit_type (text, nullable) — stored for snapshot clarity
- unit_cost_override (numeric, nullable)
- hours (numeric, nullable) — labor
- waste_override_pct (numeric, nullable)
- notes (text, nullable)
- sort_order (int)
- created_at, updated_at

#### `estimate_version_totals`
Computed totals per estimate version (bucketed).
- estimate_version_id (uuid, PK/FK)
- labor_cost (numeric)
- materials_cost (numeric)
- services_cost (numeric)
- overhead_cost (numeric)
- subtotal_cost (numeric)
- subtotal_price (numeric)
- tax_total (numeric)
- total_price (numeric)
- gross_profit (numeric)
- net_profit (numeric)
- gross_pct (numeric)
- net_pct (numeric)
- created_at, updated_at

#### `payment_schedules`
- id (uuid, PK)
- estimate_version_id (uuid, FK → estimate_versions.id)
- name (text, nullable)
- created_at, updated_at

#### `payment_schedule_items`
- id (uuid, PK)
- payment_schedule_id (uuid, FK → payment_schedules.id)
- label (text)
- due_offset_days (int, nullable) OR target_date (date, nullable)
- amount (numeric)
- sort_order (int)

#### `sales_orders`
Primary sales order per project.
- id (uuid, PK)
- project_id (uuid, FK → projects.id, UNIQUE)
- source_estimate_version_id (uuid, FK → estimate_versions.id)
- created_at (timestamptz)
- locked_at (timestamptz, nullable)
- notes (text, nullable)

#### `sales_order_line_items`
Immutable snapshot of the chosen estimate version’s line items.
- id (uuid, PK)
- sales_order_id (uuid, FK → sales_orders.id)
- name (text)
- description_client (text, nullable)
- quantity (numeric)
- unit_price (numeric)
- extended_price (numeric)
- sort_order (int)

### Frozen elements (explicit)
- Project lifecycle state machine from Module 2 is unchanged.
- Module 3 does not repurpose any existing `projects.status`.
- Module 3 does not implement PO/QuickBooks/procurement automation; only produces procurement-ready BOM outputs.

### Functions or Triggers Added
- None required by spec (math + rules enforced in application layer).
- CHECK constraints for enum-like status fields are recommended during implementation but not mandated here.

---

## 4. UI / UX Surface

### Pages Involved
> Exact routes can be adjusted during implementation, but these surfaces are locked.

#### Estimates
- `/projects/[id]/estimates` — list of estimate versions for project (and “new version” / “clone version”)
- `/projects/[id]/estimates/[versionId]` — estimator editor (internal)

#### Views
- `/projects/[id]/estimates/[versionId]/quote` — client quote view (clean, no costs/profit)
- `/projects/[id]/estimates/[versionId]/profit` — profit/forecast view (internal)
- `/projects/[id]/estimates/[versionId]/bom` — BOM/procurement view (internal)

#### Sales Order
- `/projects/[id]/sales-order` — primary sales order view (read-only once created)

### Components Involved (conceptual)
- EstimateVersionList
- VersionActions (New, Clone, Send, Approve, Reject)
- SettingsPanel (drives snapshot)
- LineItemsEditor (qty, per-line upcharges)
- ComponentsEditor (materials/services/labor hours)
- TotalsSummary
- ProfitBreakdownPanel
- PaymentScheduleEditor
- QuoteRenderer
- BOMAggregatorView
- SalesOrderView

### Mobile Considerations
- Mobile-first layouts, touch-friendly controls
- Estimator UI uses collapsible sections (line item → components) on small screens
- Quote view must be readable and print-friendly

---

## 5. Decisions Locked in This Module (LOCKED)

Plan approved and locked on 2026-01-31.

**LOCKED DECISIONS (verbatim intent, do not reinterpret):**
1. Multiple drafts and unlimited estimate versions are allowed.
2. Sent versions are immutable; changes require a new version (clone any version or start blank).
3. Not necessarily the newest version converts to sales order; user selects which Approved version becomes Primary Sales Order.
4. Costs are always separated into labor/materials/outside services/overhead (stored and computed distinctly).
5. Optional upcharges exist per line item (rush, special finish, manual override).
6. Exactly one Primary Sales Order per project in v1; change orders/add-ons deferred.
7. Module 3 must output BOM/procurement-ready rollups, but PO creation and QuickBooks integration are out of scope.
8. Estimator UI is part of Module 3 (not deferred).

---

## 6. Module Breakdown (Planning)

### Portion A — Database Schema & Estimator Engine Core
- Create all estimator tables (estimates, versions, settings snapshots, catalogs, line items, components, totals)
- Implement estimator calculation logic:
  - costs bucketed separately
  - overhead application
  - tiered margin application
  - per-line upcharges
  - computed totals persisted to `estimate_version_totals`
- Implement versioning rules + immutability enforcement in application layer
- Implement BOM aggregation logic (materials/services rollups; vendor grouping-ready)

### Portion B — Sales Orders Core
- Create sales order tables
- Create Primary Sales Order from selected Approved version
- Snapshot line items + totals into sales order
- Enforce one primary sales order per project

### Portion C — Estimator UI (Internal)
- `/projects/[id]/estimates` list
- `/projects/[id]/estimates/[versionId]` editor:
  - settings panel
  - line items editor
  - components editor
  - totals summary

### Portion D — Client Quote View
- Quote renderer for a selected version
- Clean client-facing output; print-friendly

### Portion E — Profit / Forecast UI + Payment Schedule
- Profit/forecast view for a version
- Payment schedule editor/view
- Ensure estimated labor hours by category are captured (for later actual-vs-estimated comparisons)

### Portion F — BOM / Procurement UI
- BOM view for a version (aggregate materials/services; show vendor metadata)
- Export/print-friendly output
- No PO creation

---

## 7. Current State (as of today)

Module 3 is **ACTIVE**. Implementation has begun.

- Portion A — ACTIVE
- Portion B — NOT STARTED
- Portion C — NOT STARTED
- Portion D — NOT STARTED
- Portion E — NOT STARTED
- Portion F — NOT STARTED

---

## 8. Execution Checklist

### Portion A — Database Schema & Estimator Engine Core
- [ ] Add migrations for: estimates, estimate_versions, estimate_settings_snapshots
- [ ] Add migrations for: materials_catalog, services_catalog, labor_categories
- [ ] Add migrations for: estimate_line_items, estimate_components, estimate_version_totals
- [ ] Add migrations for: payment_schedules, payment_schedule_items
- [ ] Implement server actions for:
  - [ ] create estimate container (if missing for project)
  - [ ] create draft version (blank)
  - [ ] clone version (from any version)
  - [ ] update draft version settings/line items/components
  - [ ] compute totals (persist to estimate_version_totals)
  - [ ] generate BOM rollups for a version
- [ ] Enforce immutability at application layer:
  - [ ] only draft editable
  - [ ] sent/approved/rejected read-only
- [ ] Define and test tiered margin rule format (margin_tiers_json)

### Portion B — Sales Orders Core
- [ ] Add migrations for: sales_orders, sales_order_line_items
- [ ] Implement server actions for:
  - [ ] create primary sales order from selected Approved version
  - [ ] fetch primary sales order by project
- [ ] Enforce one primary SO per project (unique constraint + app validation)

### Portion C — Estimator UI (Internal)
- [ ] Implement estimates list per project (versions)
- [ ] Implement version editor with:
  - [ ] settings panel
  - [ ] line items editor
  - [ ] components editor
  - [ ] totals summary
- [ ] Ensure mobile responsiveness

### Portion D — Client Quote View
- [ ] Implement quote view for a version
- [ ] Ensure print-friendly formatting
- [ ] Ensure no internal costs/profit displayed

### Portion E — Profit / Forecast UI + Payment Schedule
- [ ] Implement profit/forecast view (bucketed)
- [ ] Implement payment schedule editor (milestones)
- [ ] Verify labor hours captured by category

### Portion F — BOM / Procurement UI
- [ ] Implement BOM view (aggregate materials/services)
- [ ] Show vendor name/SKU/UOM/qty and waste factors
- [ ] Provide export/print-friendly output

---

## 9. Exit Criteria

All must be true:
- [ ] Unlimited versions supported; cloning from any version works
- [ ] Sent versions are immutable (UI + server enforcement)
- [ ] Costs remain separated into labor/materials/services/overhead (stored and computed)
- [ ] Per-line upcharges work and are auditable
- [ ] Totals and profit breakdown are accurate and repeatable (match spreadsheet expectations)
- [ ] BOM rollup aggregates materials/services correctly and is vendor-grouping-ready
- [ ] Can select any Approved version to create Primary Sales Order
- [ ] Only one Primary Sales Order per project is possible
- [ ] Estimator UI, Quote view, Profit view, BOM view are functional and mobile-responsive
- [ ] No PO creation or QuickBooks integration exists in this module

---

## 10. Module Lock

**Status:** NOT LOCKED (completion lock). The module plan is locked; execution is in progress.

Module 3 is locked only after Portions A–F meet Exit Criteria and are browser-validated.

**Frozen decisions summary (upon lock):**
- Estimate versioning model + immutability rules
- Separate cost buckets and profit model
- BOM/procurement output shape
- One Primary Sales Order per project
- UI surfaces for estimator/quote/profit/BOM/sales order

---

## 11. What's Next

**Next module:** Module 4 — Purchasing & Production Phases

**Dependencies created by Module 3:**
- Purchasing module will consume:
  - materials/services catalogs (or extend them)
  - BOM rollups from selected estimate versions / sales orders
- Accounting/QuickBooks integration will later consume:
  - Primary Sales Orders (for invoicing)
- Production modules will later consume:
  - estimated labor hours and components breakdown (for planning)

---

## 12. Deferred / Parking Lot

- Vendor management as first-class entities (vendors table, vendor contacts)
- Purchase Orders + receiving workflows
- QuickBooks sync (POs/invoices/payments)
- Change orders / add-on sales orders (design required; possible approaches):
  - separate add-on SO type per project
  - separate “sub-project” entity
  - new project with shared client reference (risk of confusion)
- Permissions / RLS / multi-user conflict handling
- Actual time tracking and variance reporting
- Multi-currency
