# Bent Production App (internal)

Internal production + project management web app for Bent Studio (Los Angeles).
Not client-facing. Not a SaaS product.

## Stack
- Next.js + TypeScript (in `/web`)
- Supabase (Postgres + Auth) — later modules
- Vercel — later modules
- Google Workspace APIs (Drive, Gmail) — later modules
- QuickBooks integration — later modules

## Monorepo layout
- `/web` — Next.js app
- `/docs` — architecture + decisions + intake

## Local dev
```bash
cd web
npm install
npm run dev
```

## Security rules (non-negotiable)
- No secrets in repo
- No `.env*` committed
- Secrets injected via shell env vars locally + Vercel env vars
- Never paste secrets into AI prompts
