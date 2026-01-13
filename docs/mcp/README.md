# MCP Queue + Cursor Workflow

This document describes how the Bent MCP Queue, ChatGPT, and Cursor work together, what tools are available, and how to use this setup safely and intentionally. This is a **living document** and will be updated as the system evolves.

---

## What This Setup Is

This setup allows you to:
- Send work from **ChatGPT** into a **shared task queue**
- Have **Cursor** claim and execute those tasks
- Keep a clear audit trail of what was asked, what ran, and what changed
- Avoid ad-hoc changes by enforcing deliberate, queued work

At a high level:
- **ChatGPT** = planner / dispatcher
- **MCP Queue** = source of truth
- **Cursor** = executor

---

## MCP Tools (Plain English)

These tools are available to ChatGPT and Cursor via the MCP server. Think of them as actions you can ask the system to perform.

### 1) `queue_enqueue`
**What it does:** Adds a new task to the queue.

**When to use it:** You want Cursor to do something later.

**In plain language:** "Add a task for Cursor to do X."

---

### 2) `queue_latest`
**What it does:** Shows the most recent tasks and their status.

**When to use it:** You want to see what's in the queue or what already ran.

**In plain language:** "Show me what tasks exist right now."

---

### 3) `queue_dequeue`
**What it does:** Claims the next available task (oldest first) so it can be worked on.

**When to use it:** Cursor is ready to start working.

**Important:** Claiming locks the task to Cursor until completion is posted back.

**In plain language:** "Start working on the next task."

---

### 4) `queue_postback`
**What it does:** Records progress or completion for a task and stores a short summary.

**When to use it:** After finishing, or if blocked.

**In plain language:** "I'm done (or blocked) — here's what happened."

---

## How You Use This (Non-Technical)

### From ChatGPT
You can say things like:
- "Queue a task for Cursor to write a doc."
- "Check what tasks are waiting."
- "Don't run anything yet — just enqueue."

ChatGPT should:
- Write clear task descriptions
- Include rules in the task body
- Avoid making changes directly

---

### From Cursor
Cursor should:
- Only act on **dequeued tasks**
- Follow task rules exactly
- Avoid touching unrelated files
- Post back with a clear summary

Cursor should not:
- Make changes without a task
- Infer intent beyond the task
- Clean up or refactor unless explicitly told

---

## Task Rules Convention (Current)

Rules live inside each task body.

Recommended structure:

```
RULES:
- Do X
- Do not do Y
- Only modify Z

TASK:
<actual instructions>
```

---

## Git Hygiene Expectations

Before and after tasks:
- Working tree should be clean
- Commits should be small and scoped
- No drive-by fixes

If something unexpected changes:
- Stop
- Post back as `blocked`

---

## On / Off Control (Operational Safety)

**Purpose:** The On / Off concept exists to give you a fast, human-safe way to pause automated Cursor actions without breaking the MCP server, queue, or ChatGPT integration.

### Current State (Implemented)
- There is **no automatic execution** unless Cursor explicitly dequeues a task
- You remain in full control of when Cursor claims tasks
- MCP tools can be inspected (`queue_latest`) without modifying code

### Planned (Deferred – Not Yet Implemented)
- A simple ON/OFF flag (file or env-based) that Cursor checks before executing any task
- When OFF:
  - Cursor may read the queue
  - Cursor must NOT dequeue or execute tasks
  - Cursor may post status notes like `blocked: automation disabled`

---

## ngrok URL Change – Common Failure Mode

If something suddenly stops working without any code changes, check this first.

### What can happen
- ngrok may restart, rotate your public hostname, or lose the tunnel.

### What it looks like
- ChatGPT reports tool errors
- Cursor MCP tools disappear or fail to connect
- Errors like:
  - `SSL routines::wrong version number`
  - `ECONNRESET`
  - "Cannot reach MCP server"
  - Requests never appear in the ngrok inspector

### How to confirm
1) Check ngrok inspector: `http://127.0.0.1:4040`
2) Verify the public URL matches what ChatGPT / Cursor is using
3) `curl https://<ngrok-url>/mcp` should return `{ "ok": true }`
4) `curl https://<ngrok-url>/` should return the health JSON `{ "ok": true, "service": "bent-mcp-queue", ... }`

If the URL changed, update the connector config and retry (no code changes required).

---

## Deferred / Planned Improvements

- ON/OFF execution switch (central flag)
- Rule presets per task type (docs vs code vs refactor)
- Optional task approval step before dequeue
- Structured logging / audit trail for task execution
- Optional cleanup automation for legacy `.mcp` stores

---

**Last updated:** Initial version
