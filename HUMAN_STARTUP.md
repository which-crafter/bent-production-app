# Bent Production App — Human Operator Startup Guide

## Purpose of This Document

This document is the **human operating manual** for starting a working session with the Bent Production App development environment.

**Important distinction:**
- **Intake documents** (`docs/assistant-intake.md`) are for the AI system — they tell the assistant what to do and how to behave.
- **This document** (`docs/mcp/STARTUP.md`) is for **you, the human operator** — it tells you exactly how to start everything so the system can work.

This document assumes **ZERO prior knowledge**. Every step is explicit. Every command is literal. Nothing is skipped.

---

## Which Terminal to Use (CRITICAL)

### You MUST Use Ubuntu WSL Terminal

**DO NOT use:**
- ❌ PowerShell
- ❌ Command Prompt (cmd.exe)
- ❌ Git Bash
- ❌ Any Windows-native terminal

**DO use:**
- ✅ **Ubuntu (WSL)** terminal

### What is WSL?

WSL stands for **Windows Subsystem for Linux**. It allows you to run a Linux environment (Ubuntu) directly on Windows. The Bent Production App requires Linux commands and paths, which is why you must use WSL.

### How to Open Ubuntu WSL Terminal

1. Press the **Windows key** on your keyboard
2. Type: `Ubuntu`
3. Click on **Ubuntu** (or **Ubuntu 22.04** / **Ubuntu 24.04** — whichever version you have installed)
4. A terminal window will open

### How to Confirm You Are in WSL

After opening the terminal, run this command:

```bash
pwd
```

**Correct output (you are in WSL):**
```
/home/shant/projects/bent-production-app
```
or
```
/home/<your-username>/projects/bent-production-app
```

**Wrong output (you are NOT in WSL):**
```
C:\Users\...
```
or
```
PS C:\...
```

If you see a Windows path (with `C:\` or `PS`), you are in the wrong terminal. Close it and open Ubuntu WSL.

### Navigate to the Project Directory

If you are not already in the project directory, run:

```bash
cd ~/projects/bent-production-app
```

Replace `shant` with your actual username if different.

---

## Terminals Required

You need **THREE separate terminal windows** open at the same time. Do not reuse terminals. Each terminal has a specific purpose and must remain open while you work.

### Terminal 1 — MCP Server
- **Purpose:** Runs the MCP (Model Context Protocol) server
- **Must stay running:** Yes — keep this terminal open and the server running
- **What happens here:** The server starts and listens for connections

### Terminal 2 — ngrok
- **Purpose:** Creates a public URL that forwards to your local MCP server
- **Must stay running:** Yes — keep this terminal open and ngrok running
- **What happens here:** ngrok displays a public HTTPS URL (e.g., `https://abc123.ngrok.io`)

### Terminal 3 — Verification / Misc
- **Purpose:** Run verification commands, check status, run other commands
- **Must stay running:** No — you can close and reopen as needed
- **What happens here:** You run `curl` commands, check file paths, verify setup

**Important:** Do not run commands from Terminal 1 or Terminal 2 in Terminal 3. Each terminal has its own job.

---

## Step-by-Step Startup (Exact Order)

Follow these steps **in order**. Do not skip steps. Do not proceed to the next step until the current step is complete and verified.

---

### Step 1 — Open Ubuntu WSL Terminal

1. Press **Windows key**
2. Type: `Ubuntu`
3. Click on **Ubuntu**
4. Terminal window opens

**Verify you are in WSL:**
```bash
pwd
```

Should show: `/home/<your-username>/projects/bent-production-app` (or similar Linux path)

If it shows a Windows path (`C:\...`), you are in the wrong terminal. Close it and open Ubuntu WSL again.

**Navigate to project (if needed):**
```bash
cd ~/projects/bent-production-app
```

---

### Step 2 — Start MCP Server

**Use Terminal 1 for this step.**

1. **Navigate to the MCP server directory:**
   ```bash
   cd tools/mcp-queue-server
   ```

2. **Build the server (required before starting):**
   ```bash
   npm run build
   ```

   **Expected output:**
   ```
   (TypeScript compilation messages)
   ```

   If you see errors, fix them before proceeding. If this is your first time, you may need to run `npm install` first.

3. **Set the API key and start the server:**
   ```bash
   BENT_MCP_API_KEY=your-secret-key npm run start:http
   ```

   Replace `your-secret-key` with your actual API key. If you don't have one, use a random string like `my-secret-key-12345`.

   **Expected output:**
   ```
   Bent MCP HTTP server listening at http://127.0.0.1:8000/mcp
   ```

   **Important:** The server must show this message. If you see errors, stop and fix them. Do not proceed until the server is running.

4. **Leave this terminal open.** Do not close it. Do not press Ctrl+C. The server must keep running.

---

### Step 3 — Verify MCP Paths

**Use Terminal 3 for this step.** (Open a new Ubuntu WSL terminal if you don't have Terminal 3 open yet.)

1. **Navigate to project root:**
   ```bash
   cd ~/projects/bent-production-app
   ```

2. **Check that the MCP server is running:**
   ```bash
   curl http://127.0.0.1:8000/
   ```

   **Expected output:**
   ```json
   {"ok":true,"service":"bent-mcp-queue","ts":1234567890}
   ```

   If you get a connection error, go back to Step 2 and make sure the server is running.

3. **Verify the MCP directory paths (CRITICAL):**
   ```bash
   curl http://127.0.0.1:8000/debug/core-paths
   ```

   **Correct output:**
   ```json
   {
     "ok": true,
     "repo_root": "/home/shant/projects/bent-production-app",
     "mcp_dir": "/home/shant/projects/bent-production-app/.mcp",
     "cwd": "/home/shant/projects/bent-production-app/tools/mcp-queue-server",
     "env_BENT_REPO_ROOT": null
   }
   ```

   **What to check:**
   - `repo_root` must end with `bent-production-app` (not `tools/mcp-queue-server`)
   - `mcp_dir` must end with `bent-production-app/.mcp` (NOT `tools/mcp-queue-server/.mcp`)

   **WRONG output (STOP IMMEDIATELY):**
   ```json
   {
     "mcp_dir": "/home/shant/projects/bent-production-app/tools/mcp-queue-server/.mcp"
   }
   ```

   If `mcp_dir` shows `tools/mcp-queue-server/.mcp`, the server is writing files to the wrong location. This will break everything. **Stop the server (Ctrl+C in Terminal 1), fix the issue, and restart from Step 2.**

---

### Step 4 — Start ngrok

**Use Terminal 2 for this step.** (Open a new Ubuntu WSL terminal if you don't have Terminal 2 open yet.)

**What is ngrok?**
ngrok creates a public HTTPS URL that forwards to your local server. ChatGPT and Cursor need to reach your MCP server, but they can't access `127.0.0.1` (localhost) directly. ngrok makes your local server accessible from the internet.

1. **Navigate to project root:**
   ```bash
   cd ~/projects/bent-production-app
   ```

2. **Start ngrok:**
   ```bash
   ngrok http 8000
   ```

   **Expected output:**
   ```
   Session Status                online
   Account                       (your account info)
   Version                       (version number)
   Region                        (region)
   Forwarding                    https://abc123def456.ngrok.io -> http://localhost:8000
   
   Connections                   ttl     opn     rt1     rt5     p50     p90
                                 0       0       0.00    0.00    0.00    0.00
   ```

3. **Identify the public URL:**
   - Look for the line that says `Forwarding`
   - The URL after the arrow (`->`) is your local server (`http://localhost:8000`)
   - The URL **before** the arrow is your **public ngrok URL**
   - Example: `https://abc123def456.ngrok.io`

4. **Copy the ngrok URL.** You will need it in Step 5.

   **Important:** The ngrok URL will be different each time you start ngrok (unless you have a paid account with a static domain). Write it down or keep this terminal visible.

5. **Leave this terminal open.** Do not close it. Do not press Ctrl+C. ngrok must keep running.

6. **Optional — Open ngrok web interface:**
   - Open a web browser
   - Go to: `http://127.0.0.1:4040`
   - This shows ngrok's inspector with request logs
   - Useful for debugging connection issues

---

### Step 5 — Update ChatGPT MCP App Settings

**What is ChatGPT MCP App?**
ChatGPT can connect to external services via MCP (Model Context Protocol). You configure this connection in ChatGPT's settings, and ChatGPT can then use tools provided by your MCP server.

1. **Open ChatGPT** (in a web browser or desktop app)

2. **Enable Developer Mode:**
   - Go to ChatGPT settings
   - Find "Developer Mode" or "MCP" settings
   - Turn Developer Mode **ON**

3. **Configure the MCP App:**
   - Find the MCP app configuration
   - Select or create the MCP app for "Bent Production App" (or similar name)
   - Set the **Server URL** to your ngrok URL from Step 4
   - **Important:** The URL must be the **full ngrok URL** including `/mcp` at the end
   - Example: `https://abc123def456.ngrok.io/mcp`
   - **Do not use** `http://127.0.0.1:8000/mcp` — that won't work from ChatGPT

4. **Verify the connection:**
   - ChatGPT should show that the MCP server is connected
   - If you see errors, check:
     - Is ngrok running? (Terminal 2)
     - Is the MCP server running? (Terminal 1)
     - Does the URL in ChatGPT match the ngrok URL exactly?
     - Did you include `/mcp` at the end of the URL?

5. **Save the settings**

---

### Step 6 — Open Cursor

**What is Cursor?**
Cursor is a code editor (like VS Code) that has AI assistance built in. Cursor can also connect to MCP servers to use tools.

1. **Open Cursor** (the code editor application)

2. **Open the repository:**
   - File → Open Folder
   - Navigate to: `\\wsl.localhost\Ubuntu\home\shant\projects\bent-production-app`
   - Or use the WSL path: `~/projects/bent-production-app`
   - Click "Open"

3. **Configure MCP server in Cursor:**
   - Go to Cursor settings
   - Find "MCP" or "Model Context Protocol" settings
   - Add a new MCP server connection
   - Set the server URL to: `http://127.0.0.1:8000/mcp`
   - **Note:** Cursor can use `localhost` because it runs on your machine. ChatGPT needs ngrok because it runs in the cloud.

4. **Verify MCP tools are available:**
   - In Cursor, try to use an MCP tool (e.g., `intake_put` or `queue_latest`)
   - If tools are missing or fail, check:
     - Is the MCP server running? (Terminal 1)
     - Did you restart Cursor after configuring MCP?
     - Is the server URL correct in Cursor settings?

---

### Step 7 — Upload Intake Doc from Cursor

**What is the intake doc?**
The intake document (`docs/assistant-intake.md`) contains all the rules, plans, and context for the AI assistant. By uploading it via MCP, it gets stored in a canonical location (`.mcp/bootstrap/intake.json`) that persists across chat sessions.

1. **In Cursor, read the intake document:**
   ```bash
   cat docs/assistant-intake.md
   ```
   (Or open it in Cursor's file explorer)

2. **Use the MCP tool `intake_put` from Cursor:**
   - In Cursor, you can call MCP tools directly
   - Call the tool: `intake_put`
   - Parameter: `assistant_intake_md` — paste the **full contents** of `docs/assistant-intake.md`

3. **Expected response:**
   ```json
   {
     "content": [
       {
         "type": "text",
         "text": "{\"relative_path\":\".mcp/bootstrap/intake.json\",\"absolute_path\":\"/home/shant/projects/bent-production-app/.mcp/bootstrap/intake.json\"}"
       }
     ]
   }
   ```

4. **Verify the absolute path:**
   - The `absolute_path` must end with `bent-production-app/.mcp/bootstrap/intake.json`
   - It must **NOT** end with `tools/mcp-queue-server/.mcp/...`
   - If the path is wrong, go back to Step 3 and fix the MCP server paths

---

### Step 8 — Verify .mcp on Disk

**Use Terminal 3 for this step.**

1. **Navigate to project root:**
   ```bash
   cd ~/projects/bent-production-app
   ```

2. **Check that .mcp directory exists:**
   ```bash
   ls -la .mcp
   ```

   **Expected output:**
   ```
   total 12
   drwxr-xr-x 3 shant shant 4096 Jan 19 12:00 .
   drwxr-xr-x 8 shant shant 4096 Jan 19 12:00 ..
   drwxr-xr-x 2 shant shant 4096 Jan 19 12:00 bootstrap
   ```

3. **Check that intake.json exists:**
   ```bash
   ls -la .mcp/bootstrap/intake.json
   ```

   **Expected output:**
   ```
   -rw-r--r-- 1 shant shant 12345 Jan 19 12:00 .mcp/bootstrap/intake.json
   ```

4. **Verify there is NO .mcp under tools/:**
   ```bash
   find . -maxdepth 4 -type d -name ".mcp" -print
   ```

   **Correct output (only one .mcp):**
   ```
   ./.mcp
   ```

   **Wrong output (STOP if you see this):**
   ```
   ./.mcp
   ./tools/mcp-queue-server/.mcp
   ```

   If you see `./tools/mcp-queue-server/.mcp`, the server wrote files to the wrong location. Stop everything and fix it.

---

### Step 9 — Start NEW ChatGPT Chat

1. **In ChatGPT, start a NEW chat** (don't use an old chat)

2. **Verify Developer Mode is ON:**
   - Check ChatGPT settings
   - Developer Mode must be enabled

3. **Verify MCP app is selected:**
   - In the chat interface, confirm the MCP app is active
   - You should see MCP tools available (or be able to call them)

4. **Verify ngrok URL matches:**
   - Check that the MCP app URL in ChatGPT settings matches the ngrok URL from Terminal 2
   - If ngrok restarted and got a new URL, update ChatGPT settings with the new URL

---

### Step 10 — Load Intake in ChatGPT

1. **In the new ChatGPT chat, type this exact text:**
   ```
   Load the intake document from the MCP server using the intake_get tool.
   ```

2. **What ChatGPT should do:**
   - ChatGPT should call the `intake_get` MCP tool
   - The tool will read `.mcp/bootstrap/intake.json`
   - ChatGPT should receive the intake document content
   - ChatGPT should acknowledge that it has loaded the canonical intake document

3. **If ChatGPT doesn't call the tool automatically:**
   - You may need to explicitly ask: "Use the MCP tool `intake_get` to read the intake document"
   - Or: "Call the intake_get tool"

4. **Verify ChatGPT has the document:**
   - Ask ChatGPT: "What is the active module?"
   - ChatGPT should reference the intake document and tell you which module is active
   - If ChatGPT says it doesn't have the document, the tool call failed — check MCP connection

---

## STOP CONDITIONS (Do Not Proceed If...)

**Stop immediately and fix the issue before continuing if any of these are true:**

### ❌ MCP Server Not Running
- **Symptom:** `curl http://127.0.0.1:8000/` fails or times out
- **Fix:** Go back to Step 2 and start the server

### ❌ ngrok URL Mismatch
- **Symptom:** The URL in ChatGPT MCP app settings doesn't match the URL shown in ngrok (Terminal 2)
- **Fix:** Update ChatGPT settings with the current ngrok URL from Terminal 2

### ❌ .mcp Created Under tools/
- **Symptom:** `find . -name ".mcp"` shows `./tools/mcp-queue-server/.mcp`
- **Fix:** 
  1. Stop the MCP server (Ctrl+C in Terminal 1)
  2. Delete the wrong directory: `rm -rf tools/mcp-queue-server/.mcp`
  3. Restart the server from Step 2
  4. Verify paths in Step 3

### ❌ MCP Tools Missing
- **Symptom:** ChatGPT or Cursor shows no MCP tools, or tools fail to call
- **Fix:**
  - Verify MCP server is running (Step 2)
  - Verify ngrok is running (Step 4)
  - Verify URLs match in settings (Step 5, Step 6)
  - Restart ChatGPT/Cursor if needed

### ❌ Cursor Executes Without Dequeue
- **Symptom:** Cursor makes changes or commits code without first calling `queue_dequeue`
- **Fix:** This is a workflow violation. Cursor should only act on dequeued tasks. Remind Cursor of the operational rules.

---

## Quick Checklist (Every Session)

Use this checklist every time you start a working session. Check off each item as you complete it.

- [ ] **Terminal 1:** MCP server running (`npm run start:http` in `tools/mcp-queue-server/`)
- [ ] **Terminal 2:** ngrok running (`ngrok http 8000`)
- [ ] **Terminal 3:** Available for verification commands
- [ ] **MCP paths verified:** `curl http://127.0.0.1:8000/debug/core-paths` shows `mcp_dir` ending with `bent-production-app/.mcp` (NOT `tools/mcp-queue-server/.mcp`)
- [ ] **ngrok URL copied:** Public URL from Terminal 2 written down or visible
- [ ] **ChatGPT:** Developer Mode ON, MCP app configured with ngrok URL (ending in `/mcp`)
- [ ] **Cursor:** Repo opened, MCP server connected to `http://127.0.0.1:8000/mcp`
- [ ] **Intake uploaded:** `intake_put` called from Cursor with `docs/assistant-intake.md` contents
- [ ] **.mcp verified:** `ls -la .mcp/bootstrap/intake.json` exists, `find . -name ".mcp"` shows only `./.mcp`
- [ ] **New ChatGPT chat started:** Fresh chat with Developer Mode ON and MCP app selected
- [ ] **Intake loaded in ChatGPT:** `intake_get` tool called successfully, ChatGPT acknowledges document loaded

**If all items are checked, you are ready to work.**

---

## What This Enables

Once this setup is complete, you have a working system where:

### Cursor Writes Docs → MCP
- When you ask Cursor to document something or update the intake document, Cursor uses the `intake_put` MCP tool
- The document is written to `.mcp/bootstrap/intake.json` at the repo root
- This file persists on disk and survives chat sessions

### ChatGPT Reads Docs from MCP
- When you start a new ChatGPT chat, ChatGPT can call `intake_get` to load the intake document
- ChatGPT gets the same canonical document that Cursor wrote
- No copy-pasting needed — the document is the single source of truth

### Canonical State Persists Across Chats
- The `.mcp/bootstrap/intake.json` file on disk is the authoritative version
- Every chat (ChatGPT or Cursor) reads from and writes to this same file
- You can pause work, close chats, and resume later — the state is preserved
- No information is lost between sessions

### Workflow
1. **ChatGPT** plans work and enqueues tasks using `queue_enqueue`
2. **Cursor** dequeues tasks using `queue_dequeue`, executes them, and posts back with `queue_postback`
3. **Both** read and write the intake document via `intake_get` and `intake_put`
4. **Everything** persists in `.mcp/` at the repo root

---

## Troubleshooting

If something doesn't work, check the stop conditions above first. Then:

1. **Verify all three terminals are still running:**
   - Terminal 1: MCP server
   - Terminal 2: ngrok
   - Terminal 3: Available for commands

2. **Check the ngrok inspector:**
   - Open `http://127.0.0.1:4040` in a browser
   - See if requests are reaching ngrok
   - See if requests are being forwarded to the MCP server

3. **Test the MCP server directly:**
   ```bash
   curl http://127.0.0.1:8000/
   curl http://127.0.0.1:8000/debug/core-paths
   ```

4. **Test ngrok URL:**
   ```bash
   curl https://<your-ngrok-url>/mcp
   ```
   Should return: `{"ok":true}`

5. **Restart components in order:**
   - Stop MCP server (Ctrl+C in Terminal 1)
   - Stop ngrok (Ctrl+C in Terminal 2)
   - Restart MCP server (Step 2)
   - Restart ngrok (Step 4)
   - Update ChatGPT settings with new ngrok URL if it changed

---

**Last updated:** 2026-01-19
