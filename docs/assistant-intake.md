# Bent Production App — Master Intake, Plan & Operating Rules (Canonical)

## Purpose of This Document
This file is the **single authoritative intake, plan, and operating manual** for the Bent Production App.

It exists so that:
- The project can be paused and resumed indefinitely
- New chats, tools, or assistants can be brought in without losing context
- The system can grow module-by-module without scope drift
- Past decisions remain frozen unless explicitly changed

This document is **append-only by module** and evolves only at explicit module boundaries.

---

## Roles & Authority

### Assistant Role (Locked)
The assistant acts as:
- System architect
- Scope guardrail
- Sequencing authority

The assistant may **not**:
- Redesign prior modules without explicit instruction (recomendations are allowed)
- Jump ahead to future modules
- Add speculative or “future-proofing” features unless requested (you may make suggestions, but cofirmation required to implement)
- Modify locked decisions silently

If a prior decision creates friction, it must be **flagged**, not changed.

### User Role
- Product owner
- Final decision-maker
- Controls when modules start, pause, change, or lock

---

## Core Operating Rules (Non‑Negotiable)

1. **One module at a time**
   - Only one module may be active.
   - No planning or implementation of future modules.

2. **Plan first, then build**
   - Every module must be fully planned and approved before implementation.
   - No schema changes, migrations, or code until the plan is locked.

3. **No silent redesigns**
   - Once a module is locked, its decisions are frozen.
   - Changes require explicit user request.

4. **Explicit lock points**
   - Every module ends with a written lock confirmation.
   - Only after lock may the next module begin.

5. **Controlled evolution**
   - The master plan may only be updated at module boundaries.
   - No ad‑hoc edits mid‑module.

---

## Cursor Usage & Chat Discipline (Locked)

Cursor is the primary repo-aware coding tool, used exclusively for scoped implementation tasks.

ChatGPT acts as system architect, scope guardrail, and sequencing authority.

### Chat Organization
- One ChatGPT chat is used per module portion (e.g., Module 1 – Portion E).
- Cursor chats should be started per portion, not per file.
- Old Cursor chats should not be deleted; they serve as historical execution records.

### Cursor Prompt Requirements
Cursor prompts must be tightly scoped:
- Explicit files to touch
- Explicit files to avoid
- No refactors unless instructed

### Document Updates
- `assistant-intake.md` is not updated per portion.
- It is updated only at module boundaries when a module is completed and locked.

### Code Changes
- All code changes must be committed in small, incremental commits with lint/build verification.

---

## High‑Level System Algorithm (Intent)

This algorithm defines **what we are building**, independent of implementation details.

1. **Lead Intake**
   - Capture inbound opportunities
   - Track status, contact attempts, and staleness
   - Convert qualified leads into projects

2. **Project Core**
   - Create a stable source of truth per job
   - Generate project identifiers
   - Track lifecycle state

3. **Estimates (Core Domain)**
   - Estimates are created only after a lead is converted to a project
   - Estimates are immutable once saved
   - Estimates are versioned (v1, v2, v3…)
   - One or more estimates may be marked as “current”
   - Selecting multiple current estimates triggers an explicit warning
   - Estimates may be revised only by creating a new version (copy existing estimate is default for a new version, but a new fresh estimate should be an option and continue the versions on a separate branch)

4. **Sales Orders (Client‑Facing)**
   - Sales orders are generated from estimates
   - Sales orders may be created from:
     - An entire estimate
     - Selected line items from a single estimate
     - Selected line items across multiple estimates
     - Multiple entire estimates (rare)
   - Sales orders are client‑facing documents
   - Sales orders are the authoritative input for purchasing and production

5. **Purchasing**
   - Purchasing needs are generated from sales order line items
   - Editable purchasing queues exist prior to release
   - Purchasing may be partially released over time

6. **Production Phases**
   - Production phases represent operational work streams
   - Multiple phases may be active simultaneously
   - Phases include engineering, purchasing, milling, etc.
   - Partial releases (engineering vs production) are supported

7. **Time Tracking (MVP)**
   - Optional project‑level time tracking
   - Time may be attributed to production phases
   - Task‑level time tracking deferred

8. **Multi‑User & Permissions**
   - System designed for concurrent users
   - RLS and role‑based permissions deferred to later module

9. **Reporting & Hardening**
   - Visibility into bottlenecks
   - Cleanup, validation, and stabilization
   - Long‑term maintainability

---

## Technology Stack (Authoritative)

### Frontend
- Next.js (App Router)
- React + TypeScript
- Server Components + Client Components
- Server Actions for mutations
- **Mobile‑first responsive design**
  - Phone and tablet usage prioritized
  - Desktop fully supported

### Backend / Data
- Supabase (Postgres)
- SQL migrations
- Database RPC functions where appropriate
- RLS deferred to later module

### State & Patterns
- Append‑only logs for historical data
- Immutable versioned records (estimates)
- Optimistic UI with conflict handling
- Status enums via CHECK constraints

### Tooling & Workflow
- **Cursor (Primary Repo‑Aware Assistant)**
  - Used at every module boundary
  - Used to export the current system state
  - Used to verify repo reality before planning
  - NOT permitted to redesign architecture independently
- Git (small commits, staged progress)
- Google Sheets (project tracking only, not domain logic)

---

## Project Lifecycle (Locked)

A project may be in **one lifecycle state at a time**.

1. **Quote**
2. **Awarded** (pre‑deposit)
3. **Released**
   - Deposit paid
   - Planned start & end dates required
   - Sales order finalized
   - Project may be released to:
     - Engineering / purchasing
     - Production (later)
4. **Active**
5. **Closed**

Lifecycle states are strictly forward‑moving unless explicitly reopened.

---

## Module System Overview

### Module Status
- Module 0: Foundation — COMPLETE & LOCKED
- Module 1: Leads & Intake — IN PROGRESS
- Module 2: Projects Core — NOT STARTED
- Module 3: Estimates & Sales Orders — NOT STARTED
- Module 4: Purchasing & Production Phases — NOT STARTED
- Module 5: Tasks & Time Tracking — NOT STARTED
- Module 6: Permissions & Multi‑User Safety — NOT STARTED
- Module 7: Reporting, Cleanup & Hardening — NOT STARTED

---

## Required Module Template

Every module must be defined using this structure.

### MODULE X — <Name>

#### 1. Purpose
- What this module solves
- What it explicitly does not solve

#### 2. Scope (Locked)
**In scope**
- …

**Out of scope**
- …

#### 3. Data Surface
- Tables touched
- Columns added or modified
- Functions or triggers added
- Explicitly frozen elements

#### 4. UI / UX Surface
- Pages involved
- Components involved
- Mobile considerations

#### 5. Decisions Locked in This Module
- Explicit bullet list
- Immutable unless explicitly changed later

#### 6. Module Breakdown (Planning)
- Portion A
- Portion B
- Portion C

#### 7. Execution Checklist
- Atomic, trackable tasks used during implementation

#### 8. Exit Criteria
All must be true:
- [ ] …
- [ ] …

#### 9. Module Lock
- Written confirmation that the module is locked
- Summary of frozen decisions

#### 10. What's Next
- Next module name
- Dependencies

---

## MODULE 1 — Leads & Intake (Expanded)

# MODULE 1 — Leads & Intake

## 1. Purpose
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

## 3. Data Surface

### Tables Touched
- leads
- contacts
- contact_links
- projects (conversion only; no editing)
- (optional) lead_contact_logs if introduced in this module

### Lead Data (Module 1 Ownership)
- Lead identity (name / label)
- Lead status:
  - new
  - contacted
  - qualified
  - lost
- Lead timestamps:
  - created
  - updated
  - last contacted (for staleness)

### Contact Rules (Locked)
- Each lead has **exactly one primary contact**
- Primary contact is required at lead creation
- Primary contact minimum fields:
  - first_name
  - client_type
  - at least one of: email or phone
- Email and phone are optional but encouraged
- Contacts may be reused across leads/projects later

### Duplicate Logic (Locked)
- Email match takes precedence
- Phone match used as fallback
- Matches warn only
- User may proceed anyway
- No automatic merging

---

## 4. UI / UX Surface

### Primary Surfaces (Module 1)
- **Homepage** (basic)
- **Navigation tabs** (basic, acceptable long-term; TBD)
  - Leads is a tab
  - Projects may exist as a tab later, but Module 1 focuses on Leads
- `/ops` may remain temporarily as a developer/admin page during build-out, but it is not the primary user surface for Module 1.

### UX Rules (Locked)
- Inline edits auto-save
- Visual feedback for saving / errors
- Duplicate warnings must show:
  - existing lead name
  - quick-open option
- Mobile-first layout:
  - forms usable on phone
  - tables degrade gracefully to stacked rows

---

## 5. Decisions Locked in This Module
- A lead must have a primary contact
- A lead has only one primary contact
- Primary contact is captured at lead creation
- Lead status options are limited to: new, contacted, qualified, lost
- Staleness is derived from timestamps, not manual flags
- Duplicate detection is warn-only
- Conversion creates a project but does not advance lifecycle beyond Quote
- No estimates may be created at the lead stage
- Module 1 primary surface is homepage + nav tabs; Leads is a tab (final IA TBD)

---

## 6. Module Breakdown (Planning)

### Portion A — Lead Creation
- Lead form structure
- Required vs optional fields
- Primary contact capture
- Duplicate warning flow

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

## 7. Execution Checklist (Implementation-Level)
- Lead creation requires primary contact
- Client type enforced at lead creation
- Duplicate check runs before save
- Duplicate warning UI implemented
- Lead status inline editing stable
- Stale logic verified
- Contact log append-only
- Convert-to-project works deterministically
- Mobile UX validated on phone & tablet
- Homepage + tab navigation implemented; Leads accessible via tab

---

## 8. Exit Criteria (All Must Be True)
- All leads have a primary contact
- Lead creation blocks missing required fields
- Duplicate warnings appear correctly
- Lead status changes persist correctly
- Stale leads are correctly identified
- Contact logs are append-only
- Lead → Project conversion produces a valid project
- No estimate functionality exists in lead flow
- Homepage + nav tabs exist and Leads is accessible via tab

---

## 9. Module Lock
Once exit criteria are met:
- Module 1 is marked COMPLETE & LOCKED
- Lead data model is frozen
- Intake assumptions are fixed
- Future modules must adapt to these constraints

A Cursor export must be run at this point.

---

## 10. What's Next
Module 2: Projects Core

Dependencies from Module 1:
- Project creation via conversion
- Stable project identifiers
- Initial lifecycle state = Quote
- Primary contact carried forward

---

## Module Breakdown Strategy (How We Build)

Each module is developed in layers:

1. **Module Plan**
   - High‑level intent
   - Locked decisions

2. **Portions**
   - Cohesive groups (data, logic, UI)

3. **Execution Tasks**
   - Atomic steps tracked during active work

The master document records:
- Module plans
- Locked decisions
- Completion summaries

Task‑level execution lists are ephemeral unless explicitly promoted.

---

## Cursor Export Prompt (End of Every Module)

At the end of each module, run this prompt in Cursor and paste the result back:

```
You are documenting the CURRENT STATE of the Bent Production App.

Output a SINGLE, COPY‑PASTEABLE REPORT.

DO NOT suggest changes.
DO NOT refactor.
DO NOT speculate.

SECTIONS:
1. Folder structure (tree view from /web)
2. Database schema (tables, columns, constraints)
3. Migrations added in THIS MODULE
4. Server actions added/changed
5. UI components added/changed
6. Known limitations intentionally left open

If something does not exist, say: NOT PRESENT.

Output everything in one response.
```

This report becomes the handoff artifact for the next module.

---

## Module Transition Command (User‑Controlled)

To move to the next module, the user will explicitly say:

“Proceed to Module X. Use the current locked plan. Do not redesign prior modules.”

Only after this command may the next module be expanded.

---

## How to Use This Document

- Store this file in the project folder (recommended: `docs/assistant-intake.md`)
- Reuse it for every new module and new chat
- Treat it as the constitution of the project
- Update it only at module boundaries

---

## Next Step

The user will specify **which module to expand next**.

No implementation begins until that module is fully planned and approved.
