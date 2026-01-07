# Module 1 — Leads & Intake

## 1. Module 1 Purpose

Module 1 defines **how opportunities enter the system** and how they are prepared for conversion into projects.

This module exists to:
- Capture inbound opportunities in a structured way
- Track lead status, activity, and staleness
- Attach a **single primary contact** to each lead
- Convert qualified leads into projects cleanly and deterministically

This module explicitly **does not**:
- Handle estimates
- Handle sales orders
- Handle purchasing
- Handle production phases
- Handle time tracking
- Handle permissions or RLS

---

## 2. Scope (Locked)

### In Scope
- Lead creation
- Lead status management
- Lead staleness logic
- Primary contact capture and editing
- Append-only contact/activity logging
- Lead → Project conversion trigger
- Duplicate detection (warn-only)
- Basic homepage + navigation tab for Leads

### Out of Scope
- Estimates or pricing
- Sales orders
- Purchasing
- Production phases
- Time tracking
- Multi-contact per lead (beyond primary)
- Permissions / auth logic
- Final navigation architecture (tabs are acceptable for now; future IA TBD)

---

## 3. Migrations Added in Module 1

### 0001_init.sql
- Purpose: Initial schema creation
- Creates `leads`, `projects`, `contacts`, `contact_links` tables
- Defines CHECK constraints for status enums
- Creates indexes

### 0002_project_code.sql
- Purpose: Project code generation and lead-to-project conversion
- Creates `project_code_counters` table
- Creates `next_project_code()` function
- Creates `convert_lead_to_project()` RPC function

### 0003_updated_at_trigger.sql
- Purpose: Automatic updated_at timestamp management
- Creates `set_updated_at()` trigger function
- Creates `leads_set_updated_at` trigger on `leads` table

### 0004_lead_contact.sql
- Purpose: Add contact tracking fields to leads table
- Adds `last_contacted_at` column to `leads` table
- Adds `last_contact_note` column to `leads` table

### 0005_convert_sets_qualified.sql
- Purpose: Ensure lead remains qualified after conversion
- Updates `convert_lead_to_project()` function to explicitly set lead status to 'qualified' after conversion

### 0006_contacts_client_type.sql
- Purpose: Add client type classification to contacts
- Adds `client_type` column to `contacts` table
- Adds CHECK constraint for allowed client_type values: 'homeowner', 'designer', 'contractor', 'dealer', 'architect', 'retail', 'other'

### 0007_leads_source_required.sql
- Purpose: Enforce leads.source as required (Module 1 locked decision)
- Backfills existing NULL values to 'unknown'
- Sets `leads.source` NOT NULL

---

## 4. Data Surface (Current Reality)

### Current Tables

#### `leads` table
- `id` (uuid, primary key)
- `name` (text, not null)
- `company_or_client` (text, nullable)
- `status` (text, not null, default 'new', CHECK: 'new' | 'contacted' | 'qualified' | 'lost')
- `source` (text, not null) — set to NOT NULL in migration 0007
- `notes` (text, nullable)
- `created_at` (timestamptz, not null, default now())
- `updated_at` (timestamptz, not null, default now())
- `last_contacted_at` (timestamptz, nullable) — added in migration 0004
- `last_contact_note` (text, nullable) — added in migration 0004

#### `contacts` table
- `id` (uuid, primary key)
- `display_name` (text, not null)
- `company` (text, nullable)
- `email` (citext, unique, nullable)
- `phone` (text, nullable)
- `role` (text, nullable)
- `notes` (text, nullable)
- `created_at` (timestamptz, not null, default now())
- `updated_at` (timestamptz, not null, default now())
- `client_type` (text, nullable) — added in migration 0006
  - CHECK constraint: `'homeowner' | 'designer' | 'contractor' | 'dealer' | 'architect' | 'retail' | 'other' | null`

**Note:** The contacts table currently uses `display_name` (not `first_name`/`last_name`). The `client_type` column exists with allowed values, but `first_name`/`last_name` columns are **not yet present** in the schema.

#### `contact_links` table
- `id` (uuid, primary key)
- `contact_id` (uuid, not null, references contacts(id) on delete cascade)
- `lead_id` (uuid, nullable, references leads(id) on delete cascade)
- `project_id` (uuid, nullable, references projects(id) on delete cascade)
- `relationship` (text, nullable)
- `created_at` (timestamptz, not null, default now())
- Constraint: exactly one of `lead_id` or `project_id` must be non-null
- Unique indexes: `(contact_id, lead_id)` and `(contact_id, project_id)`

#### `projects` table (conversion only; no editing in Module 1)
- `id` (uuid, primary key)
- `lead_id` (uuid, not null, unique, references leads(id) on delete restrict)
- `project_code` (text, not null, unique, format: NNNN-YY)
- `name` (text, not null)
- `client_name` (text, nullable)
- `status` (text, not null, default 'active', CHECK: 'active' | 'on_hold' | 'closed')
- `start_date` (date, nullable)
- `end_date` (date, nullable)
- `created_at` (timestamptz, not null, default now())
- `updated_at` (timestamptz, not null, default now())

---

## 5. Decisions Locked

- A lead must have a primary contact
- A lead has only one primary contact
- Primary contact is captured at lead creation
- Lead status options are limited to: `new`, `contacted`, `qualified`, `lost`
- Staleness is derived from timestamps, not manual flags
- Duplicate detection is warn-only
- Conversion creates a project but does not advance lifecycle beyond Quote
- No estimates may be created at the lead stage
- Module 1 primary surface is homepage + nav tabs; Leads is a tab (final IA TBD)
- **Client type enum values are locked:** `'homeowner' | 'designer' | 'contractor' | 'dealer' | 'architect' | 'retail' | 'other'`
- **Role distinction:** Contacts have a `role` field (separate from `client_type`); `client_type` indicates the type of client (homeowner, designer, etc.), while `role` is a free-form field
- **Company table deferred:** Normalization of company/client data into a separate `companies` table is explicitly deferred to Module 2
- **Lead naming:** Lead name is free text, but UI provides a suggested template and user may override; lead name remains editable after creation
- **Source required (locked):** `leads.source` will be enforced at the DATABASE level (NOT NULL) via a Module 1 migration. Existing NULL values must be backfilled during the migration (e.g., 'legacy' or 'unknown').
- **Company input:** A single Company/Client input is captured in the lead creation UX and written to BOTH `leads.company_or_client` and `contacts.company`
- **Notes separation:** Lead notes and contact notes are separate inputs, stored in `leads.notes` and `contacts.notes` respectively
- **Contact comms:** Primary contact must have email OR phone (at least one required)
- **Title removed:** Title field removed from intake UI (deferred to later if needed)
- **Duplicate detection rules:** Warn-only; check email first, then phone; allow user to proceed
- **Atomic create RPC:** Deferred; note that current approach is sequential writes and will be replaced later

---

## 6. Portion Breakdown

### Portion A — Lead Creation
- Lead form structure
- Required vs optional fields
- Primary contact capture
- Duplicate warning flow
- **Single form flow:** Intake UX is a SINGLE form flow that writes to multiple tables (leads + contacts + contact_links) with shared company input and two notes fields (lead notes and contact notes)
- **Lead name template:** UI will provide a suggested template for lead name (do not implement here; just document intent)

### Portion B — Lead Management
- Status transitions
- Inline editing behavior
- Stale logic definition
- Filtering and visibility rules

### Portion C — Contact Logging
- Append-only log behavior
- Timestamped entries
- Relationship to staleness calculation

### Portion D — Lead → Project Conversion
- Conversion eligibility rules
- Data passed into project
- Post-conversion lead state

### Portion E — Basic App Shell (Homepage + Tabs)
- Basic homepage exists
- Navigation tabs exist
- Leads lives behind a Leads tab
- `/ops` can remain as dev/admin but not primary surface

---

## 7. Current State (as of today)

### Portion E — COMPLETE
- **Dashboard/Homepage:** Basic homepage exists at `/` (web/src/app/(app)/page.tsx)
  - Shows Module 1 description and link to Leads
- **Navigation tabs:** AppTabs component implemented (web/src/app/(app)/_components/AppTabs.tsx)
  - Home and Leads tabs
  - Active state highlighting based on pathname
- **Leads page:** `/leads` route implemented (web/src/app/(app)/leads/page.tsx)
  - Fetches leads from database
  - Reuses components from `/ops/_components` (intentional for Module 1E)
  - Renders CreateLeadForm and LeadsTable

### Portion A — COMPLETE

**Step A1: Validation structure (COMPLETE)**
- `createLeadWithPrimaryContact` function exists in `web/src/app/ops/actions.ts`
- Server-side validation implemented:
  - Lead name required
  - Primary contact first name required
  - Primary contact client type required
  - At least one of email or phone required

**Step A2: Database schema preparation (COMPLETE)**
- Migration 0006 adds `client_type` column to `contacts` table
- CHECK constraint enforces allowed values: `'homeowner' | 'designer' | 'contractor' | 'dealer' | 'architect' | 'retail' | 'other'`
- Migration 0007 enforces `leads.source` as NOT NULL (backfills NULLs to 'unknown')

**Step B1: Database writes (COMPLETE)**
- `createLeadWithPrimaryContact` database writes implemented
- Writes lead record to `leads` table
- Creates contact record in `contacts` table
- Creates `contact_links` record linking lead to contact with relationship 'primary'
- Handles errors explicitly at each step

**Step B2: UI form (COMPLETE)**
- CreateLeadForm now uses `createLeadWithPrimaryContact`
- Source is required in the UI and is passed as non-null
- Email/Phone requirement is clarified in UI ("Email or Phone is required (at least one)")
- Company/Client input is written to BOTH `leads.company_or_client` and `contacts.company`
- Title field removed from intake UI
- Lead name placeholder provides suggested template (e.g., "Ken — Cabinet quote — Glendale")

**Pending:**
- Duplicate detection logic (warn-only; check email first, then phone)
- Decision needed: whether to add `first_name`/`last_name` columns to contacts table or use `display_name` (currently schema uses `display_name`)

### Portions B, C, D — PARTIAL
- **Status transitions and inline editing:** Implemented on `/ops` (admin surface) but not yet promoted to `/leads`
- **Contact logging:** `logContact` function and UI exist on `/ops` but not yet integrated into `/leads`
- **Lead → Project conversion:** RPC function `convert_lead_to_project` exists and works; conversion UI exists on `/ops` but not yet in `/leads`

---

## 8. Deferred / Parking Lot

- **Companies table / normalization deferred to Module 2:** The `leads.company_or_client` and `contacts.company` fields are denormalized text fields. Normalization into a separate `companies` table is explicitly deferred to Module 2.
- Duplicate detection implementation (validation structure exists, but actual duplicate checking logic not yet implemented)
- Multi-contact per lead (beyond primary contact)
- Final navigation architecture (tabs are acceptable for now; future IA TBD)
- Permissions / auth logic / RLS
- Estimates, sales orders, purchasing, production phases, time tracking
- Create an RPC (transaction) for atomic creation of lead + primary contact + contact_link (replace sequential writes)
- Add a dedicated Contacts editing surface outside lead creation (e.g., /contacts or equivalent)
- Duplicate detection UI + autofill/suggested lead name UX (warn-only) — still deferred but rules are locked

---

## 9. Next Steps (Only the next executable steps)

1. **Portion A Step C1:** Implement duplicate detection
   - Add duplicate check logic to `createLeadWithPrimaryContact` (before DB writes)
   - Check for email match first, then phone match
   - Return warning (not error) with existing lead info
   - Allow user to proceed anyway

2. **Portion A Step C2:** Build duplicate warning UI
   - Show warning modal/alert when duplicates detected
   - Display existing lead name and quick-open option
   - Allow user to proceed or cancel

3. **Portion B — Lead Management:** Define and lock decisions
   - Status transitions and inline editing behavior
   - Stale logic definition
   - Filtering and visibility rules

---

## 10. Cursor Prompts

### Current State Export Prompt

```
You are documenting the CURRENT STATE of the Bent Production App for Module 1.

Output a SINGLE, COPY-PASTEABLE REPORT.

DO NOT suggest changes.
DO NOT refactor.
DO NOT speculate.

SECTIONS:
1. Folder structure (tree view from /web)
2. Database schema (tables, columns, constraints) for Module 1 tables:
   - leads
   - contacts
   - contact_links
   - projects (conversion only)
3. Migrations added in Module 1 (list all migration files and their purpose)
4. Server actions added/changed in Module 1 (web/src/app/ops/actions.ts)
5. UI components added/changed for Module 1:
   - Homepage/dashboard
   - Navigation tabs
   - Leads page
   - Lead creation forms
6. Known limitations intentionally left open

If something does not exist, say: NOT PRESENT.

Output everything in one response.
```

### Portion A Step B1 Implementation Prompt

```
Implement database writes for createLeadWithPrimaryContact in web/src/app/ops/actions.ts.

REQUIREMENTS:
1. Edit ONLY web/src/app/ops/actions.ts
2. Replace the placeholder return with actual database operations
3. Write lead record to leads table (name, status, company_or_client, source, notes)
4. Create contact record in contacts table
   - Use display_name for now (combine first_name + last_name if last_name provided, else just first_name)
   - Include client_type, email, phone, company, role (from title), notes
5. Create contact_links record linking the lead to the contact
   - Set relationship to 'primary' or similar
6. Use a transaction or handle errors properly (rollback if any step fails)
7. On success, revalidate /leads and /ops paths
8. Return proper success/error object (do not redirect yet, let UI handle it)

CONSTRAINTS:
- Do NOT modify any other files
- Do NOT add new migrations (use existing schema)
- Do NOT refactor other functions
- Commit in small steps: first add the DB writes, test, then commit

After implementation, verify the function works by testing lead creation.
```

