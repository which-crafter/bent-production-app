# Module 2 — Projects Core

## 1. Purpose

Module 2 defines **how projects are created, managed, and tracked through their lifecycle** after conversion from leads.

This module exists to:
- Provide a stable source of truth for each job/project
- Track project lifecycle states with enforced transition rules
- Support project editing (name and client name)
- Enforce forward-only lifecycle transitions by default
- Support Hold state with resume capability
- Support override transitions with explicit reason tracking

This module explicitly **does not**:
- Handle estimates
- Handle sales orders
- Handle purchasing
- Handle production phases
- Handle time tracking
- Handle permissions or RLS
- Handle project status (existing `projects.status` column is not repurposed in this module)

---

## 2. Scope (Locked)

### In Scope
- Project list page (`/projects`)
- Project detail page (`/projects/[id]`)
- Projects navigation entry
- Project lifecycle state management
- Lifecycle transition enforcement (forward-only by default)
- Hold state semantics (enter from any state, resume to previous state)
- Override transitions with reason requirement
- Editing of `projects.name` and `projects.client_name` only
- New `projects.lifecycle_state` column (separate from existing `projects.status`)
- New `projects.prev_lifecycle_state` column (for Hold resume)
- New `projects.hold_reason` column (optional)
- New `projects.hold_at` column (optional timestamp)
- New `projects.lifecycle_override_reason` column (required when override used)

### Out of Scope
- Estimates or pricing
- Sales orders
- Purchasing
- Production phases
- Time tracking
- Permissions / auth logic / RLS
- Editing of other project fields (beyond name and client_name)
- Repurposing existing `projects.status` column
- Project creation (handled in Module 1 via lead conversion)
- Final navigation architecture (tabs are acceptable for now; future IA TBD)

---

## 3. Data Surface

### Tables Touched

#### `projects` table
**New columns added:**
- `lifecycle_state` (text, not null, default 'quote')
  - CHECK constraint: `'quote' | 'awarded' | 'released' | 'active' | 'closed' | 'hold'`
  - Separate from existing `projects.status` column
- `prev_lifecycle_state` (text, nullable)
  - Stores the state immediately before entering Hold
  - Used to enforce Hold → prev_lifecycle_state resume behavior
  - CHECK constraint: `'quote' | 'awarded' | 'released' | 'active' | 'closed'` (excludes 'hold')
- `hold_reason` (text, nullable)
  - Optional reason for entering Hold state
- `hold_at` (timestamptz, nullable)
  - Optional timestamp when Hold state was entered
- `lifecycle_override_reason` (text, nullable)
  - Required when a non-forward transition is performed via override
  - Must be provided when override action is used

**Existing columns (not modified in this module):**
- `id` (uuid, primary key)
- `lead_id` (uuid, not null, unique, references leads(id) on delete restrict)
- `project_code` (text, not null, unique, format: NNNN-YY)
- `name` (text, not null) — **editable in this module**
- `client_name` (text, nullable) — **editable in this module**
- `status` (text, not null, default 'active', CHECK: 'active' | 'on_hold' | 'closed') — **not repurposed in this module**
- `start_date` (date, nullable)
- `end_date` (date, nullable)
- `created_at` (timestamptz, not null, default now())
- `updated_at` (timestamptz, not null, default now())

**Frozen elements:**
- Existing `projects.status` column remains unchanged and is not repurposed
- Existing `projects.start_date` and `projects.end_date` columns remain unchanged
- Existing `projects.project_code` generation logic remains unchanged
- Existing `projects.lead_id` relationship remains unchanged

### Functions or Triggers Added
- None in this module (lifecycle transition logic handled in application layer)
- **Enforcement approach:** Lifecycle transition enforcement (forward-only rules, Hold semantics, override requirements) is handled at the application layer in Module 2. No database-level enforcement of forward-only transition rules exists in this module.

---

## 4. UI / UX Surface

### Pages Involved

#### `/projects` (Project List Page)
- Displays list of all projects
- Shows project code, name, client name, lifecycle state
- Supports filtering/sorting by lifecycle state
- Mobile-responsive table/list view
- Navigation entry in app tabs

#### `/projects/[id]` (Project Detail Page)
- Displays full project information
- Shows project code, name, client name, lifecycle state
- Lifecycle change control component
- Edit controls for `name` and `client_name` only
- Mobile-responsive layout

### Components Involved

#### Lifecycle Change Control
- Dropdown or button group for lifecycle state transitions
- Enforces forward-only transitions by default
- Special handling for Hold state:
  - "Hold" option available from any state
  - When entering Hold, captures optional hold reason
  - When in Hold, only option is to resume to `prev_lifecycle_state`
- Override mode:
  - Explicit toggle or action to enable override
  - When override enabled, allows any transition
  - Requires `lifecycle_override_reason` input when override is used
- Visual indicators for current state
- Disabled states for invalid transitions

#### Project Name/Client Name Editor
- Inline editing or form-based editing
- Only `name` and `client_name` fields are editable
- Other fields are read-only

### Mobile Considerations
- Mobile-first responsive design
- Touch-friendly controls for lifecycle transitions
- Collapsible sections on detail page
- Table/list view adapts to small screens

---

## 5. Decisions Locked in This Module

**LOCKED DECISIONS (verbatim, do not reinterpret):**

1. **Lifecycle states:** Quote, Awarded, Released, Active, Closed, Hold.

2. **Transitions are forward-only by default:**
   - Quote → Awarded → Released → Active → Closed

3. **Hold semantics (must be enforceable):**
   - Any state → Hold
   - When entering Hold, persist `prev_lifecycle_state` = the state immediately before Hold
   - Hold → back to `prev_lifecycle_state` ONLY

4. **Override rule:**
   - Any non-forward transition is allowed ONLY via an explicit override action that requires an override reason.

5. **Storage approach:**
   - Add NEW column `projects.lifecycle_state` (do not repurpose existing `projects.status` in this module).
   - Add `projects.prev_lifecycle_state` (used to enforce Hold resume behavior).
   - Add optional `projects.hold_reason` and `projects.hold_at`.
   - Add `projects.lifecycle_override_reason` (required only when override is used).

6. **UI scope in Module 2:**
   - Project list page (`/projects`) and project detail page (`/projects/[id]`)
   - Projects navigation entry
   - Editing allowed only for: `projects.name` and `projects.client_name`
   - Lifecycle change control that enforces forward-only by default, supports Hold semantics, and supports Override with reason.

7. **Out of scope:** estimates, sales orders, purchasing, production phases, time tracking, permissions/auth/RLS.

8. **Enforcement approach:** Lifecycle transition enforcement (forward-only rules, Hold semantics, override requirements) is handled at the application layer in Module 2. No database-level enforcement of forward-only transition rules exists in this module.

---

## 6. Module Breakdown (Planning)

### Portion A — Database Schema & Migrations
- Add `projects.lifecycle_state` column with CHECK constraint
- Add `projects.prev_lifecycle_state` column with CHECK constraint
- Add `projects.hold_reason` column (nullable)
- Add `projects.hold_at` column (nullable)
- Add `projects.lifecycle_override_reason` column (nullable)
- Set default `lifecycle_state` to 'quote' for existing projects
- Migration to backfill existing projects with default lifecycle state

### Portion B — Lifecycle Transition Logic
- Server action for lifecycle state transitions
- Forward-only transition validation (default behavior)
- Hold entry logic (capture `prev_lifecycle_state`, optional `hold_reason` and `hold_at`)
- Hold resume logic (transition to `prev_lifecycle_state` only)
- Override mode logic (allow any transition, require `lifecycle_override_reason`)
- Error handling and validation

### Portion C — Project List Page (`/projects`)
- Create `/projects` route
- Fetch and display projects list
- Show project code, name, client name, lifecycle state
- Filtering/sorting by lifecycle state
- Mobile-responsive layout
- Add Projects navigation entry

### Portion D — Project Detail Page (`/projects/[id]`)
- Create `/projects/[id]` route
- Fetch and display project details
- Edit controls for `name` and `client_name` only
- Server actions for editing name/client_name
- Mobile-responsive layout
- **Lifecycle change control component:**
  - Build reusable lifecycle change control component
  - Forward-only transition UI (default)
  - Hold entry UI (with optional reason input)
  - Hold resume UI (only shows resume option)
  - Override mode UI (toggle + reason input required)
  - Visual state indicators
  - Integration into project detail page

---

## 7. Current State (as of today)

### Portion A — COMPLETE
- **Migration applied:** `supabase/migrations/0008_projects_lifecycle_state.sql`
- **Columns added:**
  - `projects.lifecycle_state` (text NOT NULL DEFAULT 'quote')
  - `projects.prev_lifecycle_state` (text NULL)
  - `projects.hold_reason` (text NULL)
  - `projects.hold_at` (timestamptz NULL)
  - `projects.lifecycle_override_reason` (text NULL)
- **CHECK constraints present:**
  - `projects_lifecycle_state_check` (enforces: 'quote', 'awarded', 'released', 'active', 'closed', 'hold')
  - `projects_prev_lifecycle_state_check` (enforces: NULL or 'quote', 'awarded', 'released', 'active', 'closed' — excludes 'hold')
- **Note:** Existing historical test projects may have `status='active'` but `lifecycle_state='quote'` due to legacy defaults. `lifecycle_state` is authoritative going forward.

### Portion B — COMPLETE
- **Server actions implemented:** `web/src/app/ops/actions.ts`
  - `updateProjectLifecycleState`
    - Enforces forward-only lifecycle transitions by default
    - Supports Hold state with prev_lifecycle_state resume semantics
    - Allows override transitions with required override reason
  - `updateProjectBasics`
    - Allows editing `projects.name` and `projects.client_name` only
- **Validation rules enforced at application layer**
- **No UI changes included in this portion**

### Portion C — COMPLETE
- **Projects list page implemented:** `web/src/app/(app)/projects/page.tsx`
  - Server Component that queries Supabase directly
  - Selects: id, project_code, name, client_name, lifecycle_state
  - Orders by project_code ASC
  - Handles errors and empty states
- **ProjectsTable component:** `web/src/app/(app)/projects/_components/ProjectsTable.tsx`
  - Client component with lifecycle state filtering
  - Filter options: All, quote, awarded, released, active, closed, hold
  - Default filter: "All"
  - Mobile-first responsive layout
  - Displays: project_code, name, client_name, lifecycle_state
- **Navigation updated:** `web/src/app/(app)/_components/AppTabs.tsx`
  - Added "Projects" tab pointing to `/projects`
- **Types updated:** `web/src/app/ops/types.ts`
  - Added `LifecycleState` type
  - Updated `ProjectRow` and `Project` interfaces to include lifecycle_state

### Portion D — COMPLETE
- **Project detail page implemented:** `web/src/app/(app)/projects/[id]/page.tsx`
  - Server Component that fetches single project by ID
  - Selects all project fields including lifecycle_state and prev_lifecycle_state
  - Handles not found with Next.js notFound()
- **ProjectDetail component:** `web/src/app/(app)/projects/_components/ProjectDetail.tsx`
  - Displays all project fields (read-only except name/client_name)
  - Integrates ProjectNameEditor and LifecycleChangeControl
  - Mobile-responsive layout
- **ProjectNameEditor component:** `web/src/app/(app)/projects/_components/ProjectNameEditor.tsx`
  - Inline editing for `projects.name` and `projects.client_name` only
  - Uses `updateProjectBasics` server action
  - Error handling and success feedback
- **LifecycleChangeControl component:** `web/src/app/(app)/projects/_components/LifecycleChangeControl.tsx`
  - Forward-only transition UI (default mode)
  - Hold entry UI (with optional reason input)
  - Hold resume UI (only shows resume option to prev_lifecycle_state)
  - Override mode UI (toggle + reason input required)
  - Visual state indicators
  - Disabled states for invalid transitions
  - Uses `updateProjectLifecycleState` server action
- **Server actions updated:** `web/src/app/ops/actions.ts`
  - `updateProjectLifecycleState` and `updateProjectBasics` now revalidate detail page path

### Portion E — COMPLETE
- **List → detail navigation:** `web/src/app/(app)/projects/_components/ProjectsTable.tsx`
  - Project code and name are clickable (Next.js `<Link>` to `/projects/[id]`)
  - Uses existing UUID `id` from query; filter, sort, layout, mobile responsive unchanged

---

## 8. Execution Checklist

### Portion A — Database Schema & Migrations
- [ ] Schema change required to add `projects.lifecycle_state` column
- [ ] CHECK constraint required for lifecycle_state enum values
- [ ] Default value required: 'quote'
- [ ] Schema change required to add `projects.prev_lifecycle_state` column
- [ ] CHECK constraint required for prev_lifecycle_state (excludes 'hold')
- [ ] Schema change required to add `projects.hold_reason` column (nullable)
- [ ] Schema change required to add `projects.hold_at` column (nullable)
- [ ] Schema change required to add `projects.lifecycle_override_reason` column (nullable)
- [ ] Backfill required for existing projects with default lifecycle_state = 'quote'
- [ ] Migration testing required on clean database
- [ ] Constraint validation required to prevent invalid values

### Portion B — Lifecycle Transition Logic
- [ ] Server action required for lifecycle state transitions
- [ ] Forward-only transition validation required (default behavior)
- [ ] Hold entry logic required (capture prev_lifecycle_state)
- [ ] Hold resume logic required (validate prev_lifecycle_state exists)
- [ ] Override mode required (allow any transition with reason)
- [ ] Validation required for override_reason when override used
- [ ] Error handling required with appropriate error messages
- [ ] Testing required for all transition scenarios

### Portion C — Project List Page
- [ ] `/projects` route file required
- [ ] Server action required to fetch projects list
- [ ] ProjectsTable or ProjectsList component required
- [ ] Display required: project code, name, client name, lifecycle state
- [ ] Filtering by lifecycle state required
- [ ] Sorting capabilities required
- [ ] Mobile-responsive design required
- [ ] Projects navigation entry required in AppTabs
- [ ] Testing required on mobile and desktop

### Portion D — Project Detail Page
- [ ] `/projects/[id]` route file required
- [ ] Server action required to fetch project by ID
- [ ] ProjectDetail component required
- [ ] Display required: all project fields (read-only except name/client_name)
- [ ] Edit controls required for `name` and `client_name`
- [ ] Server action required for updating name/client_name
- [ ] Mobile-responsive design required
- [ ] Testing required on mobile and desktop
- [ ] **Lifecycle change control component:**
  - [ ] LifecycleChangeControl component required
  - [ ] Forward-only transition UI required (default mode)
  - [ ] Hold entry UI required (with optional reason input)
  - [ ] Hold resume UI required (only shows resume option)
  - [ ] Override mode toggle/action required
  - [ ] Override reason input required (when override used)
  - [ ] Visual state indicators required
  - [ ] Disabled states required for invalid transitions
  - [ ] Mobile-responsive design required
  - [ ] Integration required into project detail page
  - [ ] Testing required for all transition scenarios in UI

---

## 9. Exit Criteria

All must be true:
- [ ] Migration files created and tested for all new columns
- [ ] All CHECK constraints enforce valid lifecycle state values
- [ ] Existing projects have default lifecycle_state = 'quote'
- [ ] Forward-only transitions enforced by default in application logic
- [ ] Hold entry captures `prev_lifecycle_state` correctly
- [ ] Hold resume only allows transition to `prev_lifecycle_state`
- [ ] Override mode requires `lifecycle_override_reason` when used
- [ ] Project list page (`/projects`) displays all projects with lifecycle states
- [ ] Project detail page (`/projects/[id]`) displays full project information
- [ ] Editing of `name` and `client_name` works correctly
- [ ] Lifecycle change control enforces all transition rules
- [ ] Projects navigation entry exists and works
- [ ] All UI components are mobile-responsive
- [ ] No editing of other project fields is possible
- [ ] Existing `projects.status` column is not repurposed or modified

---

## 10. Module Lock

**Status:** LOCKED (Module 2 COMPLETED)

Module 2 is complete. All portions (A–E) implemented and browser-validated. Decisions are frozen.

**Frozen decisions summary:**
- Lifecycle states: quote, awarded, released, active, closed, hold
- Forward-only transitions by default; Hold semantics; Override with reason
- New column `projects.lifecycle_state` (existing `projects.status` not repurposed)
- Project list `/projects`, detail `/projects/[id]`, list→detail navigation via Link
- Edit only `projects.name` and `projects.client_name`; lifecycle enforced in app layer

**Acceptance checklist (browser validated):**
- [x] `/projects` lists projects; lifecycle filter works; sort by project_code ASC
- [x] Project code and name link to `/projects/[id]`; detail loads
- [x] Detail shows all fields; name/client_name editable; lifecycle control works (forward, Hold, resume, override)
- [x] Projects tab in nav; mobile responsive

---

## 11. What's Next

**Next module:** Module 3 — Estimates & Sales Orders

**Dependencies:**
- Module 2 must be locked before Module 3 begins
- Module 3 will build on the project lifecycle states established in Module 2
- Estimates will be created only after a project exists (from Module 1 conversion or Module 2 creation)

**Prerequisites for Module 3:**
- Projects must have stable lifecycle state tracking
- Project detail pages must be functional
- Project editing (name/client_name) must be complete

---

## 12. Deferred / Parking Lot

- Editing of other project fields (beyond name and client_name)
- Project creation UI (currently only via lead conversion)
- Advanced filtering and search on project list
- Project history/audit log for lifecycle state changes
- Bulk lifecycle state transitions
- Final navigation architecture (tabs are acceptable for now; future IA TBD)
- Permissions / auth logic / RLS
- Estimates, sales orders, purchasing, production phases, time tracking

