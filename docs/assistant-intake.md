# Assistant Intake Checklist (canonical)

This document is the single source of truth for orienting the assistant
(ChatGPT / Cursor / future tools) at the start of a session.

## Project
- Name: Bent Production App
- Repo path:
- Current module:
- Current goal (one sentence):

## Environment
- OS / shell:
- Node version:
- npm version:
- Hosting target (later): Vercel

## Locked decisions (do not relitigate)
- Internal web app only (not client-facing, not SaaS)
- Next.js + TypeScript
- App lives in `/web`
- Supabase for Postgres + Auth
- Google Drive is file storage source of truth
- Gmail attachments ingested into Drive
- QuickBooks is system of record for accounting
- No secrets in repo; env vars only

## Scope guardrails
- Build modularly, step by step
- Prefer flags and queues over rigid workflows
- Avoid overengineering
- Defer integrations until explicitly scheduled

## Current constraints
- Google Workspace APIs later
- QuickBooks integration later
- Scheduling is manual first
- Time tracking is optional / opt-in

## Today’s session
- Tasks completed:
- Decisions made:
- Open questions:
- Blockers / risks:
- Next concrete step:
