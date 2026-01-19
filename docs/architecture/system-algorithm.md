# High‑Level System Algorithm (Intent)

This algorithm defines **what we are building**, independent of implementation details.

---

## 1. Lead Intake

- Capture inbound opportunities
- Track status, contact attempts, and staleness
- Convert qualified leads into projects

---

## 2. Project Core

- Create a stable source of truth per job
- Generate project identifiers
- Track lifecycle state

---

## 3. Estimates (Core Domain)

- Estimates are created only after a lead is converted to a project
- Estimates are immutable once saved
- Estimates are versioned (v1, v2, v3…)
- One or more estimates may be marked as "current"
- Selecting multiple current estimates triggers an explicit warning
- Estimates may be revised only by creating a new version (copy existing estimate is default for a new version, but a new fresh estimate should be an option and continue the versions on a separate branch)

---

## 4. Sales Orders (Client‑Facing)

- Sales orders are generated from estimates
- Sales orders may be created from:
  - An entire estimate
  - Selected line items from a single estimate
  - Selected line items across multiple estimates
  - Multiple entire estimates (rare)
- Sales orders are client‑facing documents
- Sales orders are the authoritative input for purchasing and production

---

## 5. Purchasing

- Purchasing needs are generated from sales order line items
- Editable purchasing queues exist prior to release
- Purchasing may be partially released over time

---

## 6. Production Phases

- Production phases represent operational work streams
- Multiple phases may be active simultaneously
- Phases include engineering, purchasing, milling, etc.
- Partial releases (engineering vs production) are supported

---

## 7. Time Tracking (MVP)

- Optional project‑level time tracking
- Time may be attributed to production phases
- Task‑level time tracking deferred

---

## 8. Multi‑User & Permissions

- System designed for concurrent users
- RLS and role‑based permissions deferred to later module

---

## 9. Reporting & Hardening

- Visibility into bottlenecks
- Cleanup, validation, and stabilization
- Long‑term maintainability

---

## How to Derive Next Module Docs from This Spec

When planning a new module, use this checklist:

1. **Identify the algorithm step(s)** this module addresses
   - Reference the numbered sections above (e.g., "Module 3 addresses algorithm step 3: Estimates")

2. **Define module scope**
   - What parts of the algorithm step are in scope?
   - What parts are explicitly deferred?

3. **Map to data surface**
   - Which tables/entities are touched?
   - What new tables/entities are created?
   - What constraints or invariants must be enforced?

4. **Map to UI/UX surface**
   - Which pages/components are involved?
   - What user workflows are supported?
   - Mobile considerations?

5. **Lock decisions**
   - What architectural choices are made in this module?
   - What patterns are established?
   - What is explicitly frozen?

6. **Break into portions**
   - Cohesive groups (data, logic, UI)
   - Dependencies between portions
   - Execution order

7. **Define exit criteria**
   - All algorithm step requirements met?
   - All locked decisions implemented?
   - All portions complete?

8. **Document what's next**
   - Which algorithm step comes next?
   - What dependencies must be satisfied?

---

**Note:** This document is append-only. Algorithm steps may be refined, but not redesigned without explicit approval.
