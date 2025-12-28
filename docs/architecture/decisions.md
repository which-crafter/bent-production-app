# Architecture Decisions (ADR-lite)

This file records decisions that should not be repeatedly debated.
Add entries only when a decision is intentional and “locked.”

---

## 2025-12-28 — Foundation architecture

- Application type: internal operations tool
- Audience: Bent Studio internal team only
- Not a SaaS product
- Not client-facing

### Tech stack
- Frontend: Next.js + TypeScript
- App Router
- Tailwind for baseline styling
- Backend: Supabase (Postgres + Auth)
- Hosting: Vercel

### Repo structure
- `/web` contains the application
- `/docs` contains architecture and process documentation

### Data & integrations (future modules)
- Google Drive is the source of truth for files
- App creates and manages Drive folder structure
- Gmail attachments can be ingested into Drive
- QuickBooks is the system of record for estimates, POs, invoices

### Security
- No secrets committed to the repo
- No `.env*` files in version control
- Secrets injected via environment variables only
- Service account credentials stored as env var JSON

### Product philosophy
- Projects can exist in multiple phases simultaneously
- Use flags and queues instead of rigid workflows
- Manual processes first, automation later
- Optimize for clarity and reliability over speed
