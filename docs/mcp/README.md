# MCP Server Setup & Troubleshooting

Quick reference for starting, stopping, and troubleshooting the Bent MCP Queue server.

---

## Start / Stop / Verify

### Start the MCP Server

From the repo root (`bent-production-app/`):

```bash
cd tools/mcp-queue-server
npm install  # First time only
npm run build
BENT_MCP_API_KEY=your-secret-key npm run start:http
```

The server will start on `http://127.0.0.1:8000` and write `.mcp` to the repo root (`bent-production-app/.mcp`), **not** under `tools/mcp-queue-server`.

### Stop the MCP Server

Press `Ctrl+C` in the terminal where the server is running.

### Verify the Server is Running

```bash
curl http://127.0.0.1:8000/
```

Should return: `{"ok":true,"service":"bent-mcp-queue","ts":...}`

---

## How to Verify Paths

The server **must** write `.mcp` to the repo root. Verify this:

### Method 1: Debug Endpoint

```bash
curl http://127.0.0.1:8000/debug/core-paths
```

Should show:
```json
{
  "ok": true,
  "repo_root": "/home/shant/projects/bent-production-app",
  "mcp_dir": "/home/shant/projects/bent-production-app/.mcp",
  "cwd": "...",
  "env_BENT_REPO_ROOT": null
}
```

**Critical:** `mcp_dir` must end with `bent-production-app/.mcp`, NOT `tools/mcp-queue-server/.mcp`.**

### Method 2: Find .mcp Directories

```bash
find . -maxdepth 4 -type d -name ".mcp" -print
```

Should show **only**:
```
./.mcp
```

If you see `./tools/mcp-queue-server/.mcp`, that's wrong — see "Common Failure Modes" below.

---

## What Tools Exist

The MCP server exposes these tools:

### Intake Tools
- **`intake_put`** — Write assistant intake markdown to bootstrap file (`.mcp/bootstrap/intake.json`)
- **`intake_get`** — Read assistant intake markdown from bootstrap file

### Queue Tools
- **`queue_enqueue`** — Add a new task to the queue
- **`queue_dequeue`** — Claim the next queued task (oldest first)
- **`queue_postback`** — Record progress/completion for a task
- **`queue_latest`** — Show the latest N tasks and their status

### Debug Tools
- **`debug_paths`** — Debug path resolution for repo root and MCP directory

---

## Cursor Usage

### Using `intake_put` from Cursor

1. In Cursor, use the MCP tool `intake_put` with the full contents of `docs/assistant-intake.md`
2. The tool will write to `.mcp/bootstrap/intake.json` at the repo root
3. Verify it wrote correctly:
   ```bash
   cat .mcp/bootstrap/intake.json | jq .absolute_path
   ```
   Should show: `"/home/shant/projects/bent-production-app/.mcp/bootstrap/intake.json"`

**Important:** The `absolute_path` in the response confirms where the file was written. Always check this to ensure it's at the repo root, not under `tools/`.

---

## Common Failure Modes

### 1. Server Not Running

**Symptoms:**
- ChatGPT/Cursor reports "Cannot reach MCP server"
- Tool calls fail with connection errors

**Fix:**
- Start the server (see "Start / Stop / Verify" above)
- Verify with `curl http://127.0.0.1:8000/`

### 2. Cursor Not Refreshed

**Symptoms:**
- Tools appear in Cursor but calls fail
- Old tool definitions cached

**Fix:**
- Restart Cursor completely
- Or: Disconnect and reconnect the MCP server in Cursor settings

### 3. .mcp Created Under tools/ (Wrong Location)

**Symptoms:**
- `find . -name ".mcp"` shows `./tools/mcp-queue-server/.mcp`
- Intake/bootstrap files not found at repo root

**Fix:**
1. Stop the server
2. Delete the wrong directory:
   ```bash
   rm -rf tools/mcp-queue-server/.mcp
   ```
3. Restart the server from repo root (or ensure `BENT_REPO_ROOT` is set correctly)
4. Verify with `curl http://127.0.0.1:8000/debug/core-paths`

**Root cause:** Server was started from `tools/mcp-queue-server/` directory without proper repo root detection. The server has safety checks to prevent this, but if it still happens, check your working directory.

### 4. SSE/Accept Header Gotcha

**Symptoms:**
- Direct `curl` calls to `/mcp` return `{"ok":true}` instead of MCP responses
- MCP tools work from ChatGPT/Cursor but not from command line

**Explanation:**
- The `/mcp` endpoint requires `Accept: text/event-stream` header for SSE (Server-Sent Events)
- Plain GET requests return `{"ok":true}` as a health check
- This is **expected behavior** — MCP clients (ChatGPT/Cursor) send the correct headers automatically

**Fix:**
- Use MCP tools through ChatGPT/Cursor, not direct curl
- Or: Use the debug endpoints (`/debug/core-paths`) for testing

### 5. ngrok URL Change

**Symptoms:**
- ChatGPT reports tool errors
- Cursor MCP tools disappear or fail to connect
- Errors like `SSL routines::wrong version number`, `ECONNRESET`

**Fix:**
1. Check ngrok inspector: `http://127.0.0.1:4040`
2. Verify the public URL matches what ChatGPT/Cursor is using
3. `curl https://<ngrok-url>/mcp` should return `{ "ok": true }`
4. If the URL changed, update the connector config and retry

---

## What This Setup Is

This setup allows you to send work from **ChatGPT** into a **shared task queue**, have **Cursor** claim and execute those tasks, and keep a clear audit trail of what was asked, what ran, and what changed. At a high level: **ChatGPT** = planner / dispatcher, **MCP Queue** = source of truth, **Cursor** = executor.

---

## How You Use This

### From ChatGPT
ChatGPT should enqueue tasks with clear descriptions and rules. You can say things like "Queue a task for Cursor to write a doc" or "Check what tasks are waiting." ChatGPT should avoid making changes directly.

### From Cursor
Cursor should only act on **dequeued tasks**, follow task rules exactly, avoid touching unrelated files, and post back with a clear summary. Cursor should not make changes without a task, infer intent beyond the task, or clean up/refactor unless explicitly told.

---

## Tools

### Queue Tools
**`queue_enqueue`** adds a new task to the queue. **`queue_dequeue`** claims the next available task (oldest first) and locks it to Cursor until completion is posted back. **`queue_postback`** records progress or completion for a task with a summary. **`queue_latest`** shows the most recent tasks and their status.

### Intake Tools
**`intake_put`** writes assistant intake markdown to bootstrap file (`.mcp/bootstrap/intake.json`) at the repo root, returning both relative and absolute paths for verification. **`intake_get`** reads the persisted intake document from the bootstrap file.

### Debug Tools
**`debug_paths`** shows the resolved repo root and MCP directory paths, useful for verifying the server is writing `.mcp` to the correct location.

---

## Operational Rules

- **Dequeue-only execution:** Cursor must explicitly dequeue a task before executing. No automatic execution.
- **Postback required:** After finishing or if blocked, Cursor must post back with status and summary.
- **No drive-by edits:** Cursor must not touch unrelated files or make changes outside the dequeued task scope.
- **Clean working tree:** Before and after tasks, working tree should be clean. Commits should be small and scoped.

---

**Last updated:** 2026-01-19
