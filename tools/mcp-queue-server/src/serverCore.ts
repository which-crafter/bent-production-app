import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export type BentQueueServerOptions = {
  repoRoot?: string;
};

// Module-level storage for computed paths
let _REPO_ROOT: string | null = null;
let _MCP_DIR: string | null = null;

type QueueItemStatus = "queued" | "claimed" | "cancelled";

interface QueueItem {
  id: string;
  createdAt: string;
  source: string;
  module: string;
  portion: string;
  title: string;
  body: string;
  status: QueueItemStatus;
  priority?: "low" | "normal" | "high";
  claimedAt?: string | null;
  claimedBy?: string | null;
  tags?: string[];
}

type PostbackStatus = "in_progress" | "blocked" | "done";

interface Postback {
  id: string;
  at: string;
  from: string;
  module: string;
  portion: string;
  status: PostbackStatus;
  summary: string;
  git?: {
    branch?: string;
    status?: string;
    diffStat?: string;
  };
  checks?: {
    lint?: { ok: boolean; excerpt?: string };
    build?: { ok: boolean; excerpt?: string };
    test?: { ok: boolean; excerpt?: string };
  };
  blocker?: {
    reason?: string | null;
    details?: string | null;
  };
}

export function createBentQueueServer(
  options: BentQueueServerOptions = {}
): McpServer {
  const server = new McpServer({
    name: "bent-queue-server",
    version: "1.0.0",
  });

  // ---------- Paths & helpers ----------

  // Repo root resolution precedence:
  // 1. options.repoRoot (explicit parameter)
  // 2. process.env.BENT_REPO_ROOT (environment variable)
  // 3. Auto-detect by walking up from server file location
  // This ensures `.mcp` is ALWAYS written to repo root, never under tools/mcp-queue-server/
  let REPO_ROOT =
    options.repoRoot ||
    process.env.BENT_REPO_ROOT;
  
  // If not explicitly set, detect repo root from server file location
  if (!REPO_ROOT) {
    // Get the directory where this server code is located (will be build/ in compiled output)
    const serverFile = fileURLToPath(import.meta.url);
    let currentDir = path.dirname(serverFile);
    
    // Walk up the directory tree to find the repo root
    // Look for a directory that contains tools/mcp-queue-server as a subdirectory
    for (let i = 0; i < 10; i++) {
      const toolsDir = path.join(currentDir, "tools");
      const mcpQueueServerDir = path.join(toolsDir, "mcp-queue-server");
      
      try {
        const stats = fsSync.statSync(mcpQueueServerDir);
        if (stats.isDirectory()) {
          // Found tools/mcp-queue-server, so currentDir is the repo root
          REPO_ROOT = currentDir;
          break;
        }
      } catch {
        // Directory doesn't exist, continue searching
      }
      
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        // Reached filesystem root, fallback to process.cwd()
        REPO_ROOT = process.cwd();
        break;
      }
      currentDir = parentDir;
    }
    
    // Final fallback: check if current working directory is tools/mcp-queue-server
    if (!REPO_ROOT) {
      const cwdNormalized = path.normalize(process.cwd());
      const cwdBasename = path.basename(cwdNormalized);
      const cwdParentBasename = path.basename(path.dirname(cwdNormalized));
      if (cwdBasename === "mcp-queue-server" && cwdParentBasename === "tools") {
        REPO_ROOT = path.resolve(process.cwd(), "..", "..");
      } else {
        REPO_ROOT = process.cwd();
      }
    }
  }
  
  // Ensure REPO_ROOT is absolute and normalized
  REPO_ROOT = path.resolve(REPO_ROOT);
  
  // Hard safety correction: ensure we're not in tools/mcp-queue-server or tools/mcp-queue-server/build
  const normalized = path.normalize(REPO_ROOT);
  const segments = normalized.split(path.sep).filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  const secondLastSegment = segments.length >= 2 ? segments[segments.length - 2] : null;
  
  if (lastSegment === "mcp-queue-server" && secondLastSegment === "tools") {
    REPO_ROOT = path.resolve(REPO_ROOT, "..", "..");
  } else if (lastSegment === "build" && secondLastSegment === "mcp-queue-server" && segments.length >= 3 && segments[segments.length - 3] === "tools") {
    REPO_ROOT = path.resolve(REPO_ROOT, "..", "..", "..");
  }
  
  const MCP_DIR = path.join(REPO_ROOT, ".mcp");
  // Store in module-level variables for export
  _REPO_ROOT = REPO_ROOT;
  _MCP_DIR = MCP_DIR;
  const QUEUE_FILE = path.join(MCP_DIR, "queue.jsonl");
  const POSTBACK_FILE = path.join(MCP_DIR, "postback.jsonl");

  async function ensureMcpDir() {
    await fs.mkdir(MCP_DIR, { recursive: true });
    try {
      await fs.access(QUEUE_FILE);
    } catch {
      await fs.writeFile(QUEUE_FILE, "", "utf8");
    }
    try {
      await fs.access(POSTBACK_FILE);
    } catch {
      await fs.writeFile(POSTBACK_FILE, "", "utf8");
    }
  }

  async function readJsonl<T>(filePath: string): Promise<T[]> {
    try {
      const content = await fs.readFile(filePath, "utf8");
      return content
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line) as T);
    } catch (err: any) {
      if (err.code === "ENOENT") return [];
      throw err;
    }
  }

  async function appendJsonl(filePath: string, obj: unknown): Promise<void> {
    const line = JSON.stringify(obj) + "\n";
    await fs.appendFile(filePath, line, "utf8");
  }

  async function writeJsonl<T>(filePath: string, items: T[]): Promise<void> {
    const lines =
      items.map((x) => JSON.stringify(x)).join("\n") + (items.length ? "\n" : "");
    await fs.writeFile(filePath, lines, "utf8");
  }

  function generateId(): string {
    const now = new Date();
    const iso = now.toISOString().replace(/[-:.TZ]/g, "");
    const rand = Math.random().toString(36).slice(2, 8);
    return `q-${iso}-${rand}`;
  }

  // ---------- Tools: queue_enqueue ----------

  server.tool(
    "queue_enqueue",
    "Enqueue a new task for Cursor to execute.",
    {
      module: z.string().describe("Module number, e.g. '2'"),
      portion: z.string().describe("Portion identifier, e.g. 'A' or '2E'"),
      title: z.string().describe("Short human-readable title"),
      body: z.string().describe("Full instructions/prompt for Cursor"),
      priority: z.enum(["low", "normal", "high"]).optional().default("normal"),
      tags: z.array(z.string()).optional(),
      source: z.string().optional().default("chatgpt"),
    },
    async (args) => {
      await ensureMcpDir();
      const id = generateId();
      const now = new Date().toISOString();

      const item: QueueItem = {
        id,
        createdAt: now,
        source: args.source ?? "chatgpt",
        module: args.module,
        portion: args.portion,
        title: args.title,
        body: args.body,
        status: "queued",
        priority: args.priority ?? "normal",
        claimedAt: null,
        claimedBy: null,
        tags: args.tags,
      };

      await appendJsonl(QUEUE_FILE, item);

      return {
        content: [
          {
            type: "text",
            text: `Enqueued task ${id} for module ${item.module}${
              item.portion ? ` portion ${item.portion}` : ""
            }.`,
          },
        ],
      };
    }
  );

  // ---------- Tools: queue_dequeue ----------

  server.tool(
    "queue_dequeue",
    "Claim the next queued task (oldest first).",
    {},
    async () => {
      await ensureMcpDir();
      const items = await readJsonl<QueueItem>(QUEUE_FILE);

      const idx = items.findIndex((it) => it.status === "queued");
      if (idx === -1) {
        return {
          content: [{ type: "text", text: "No queued tasks." }],
        };
      }

      const now = new Date().toISOString();
      const item = items[idx];

      items[idx] = {
        ...item,
        status: "claimed",
        claimedAt: now,
        claimedBy: "cursor",
      };

      await writeJsonl(QUEUE_FILE, items);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(items[idx], null, 2),
          },
        ],
      };
    }
  );

  // ---------- Tools: queue_postback ----------

  server.tool(
    "queue_postback",
    "Post back status and results for a queue item.",
    {
      id: z.string().describe("Queue item id"),
      module: z.string(),
      portion: z.string(),
      status: z.enum(["in_progress", "blocked", "done"]),
      summary: z.string(),
      git: z
        .object({
          branch: z.string().optional(),
          status: z.string().optional(),
          diffStat: z.string().optional(),
        })
        .optional(),
      checks: z
        .object({
          lint: z
            .object({
              ok: z.boolean(),
              excerpt: z.string().optional(),
            })
            .optional(),
          build: z
            .object({
              ok: z.boolean(),
              excerpt: z.string().optional(),
            })
            .optional(),
          test: z
            .object({
              ok: z.boolean(),
              excerpt: z.string().optional(),
            })
            .optional(),
        })
        .optional(),
      blocker: z
        .object({
          reason: z.string().nullable().optional(),
          details: z.string().nullable().optional(),
        })
        .optional(),
    },
    async (args) => {
      await ensureMcpDir();

      const postback: Postback = {
        id: args.id,
        at: new Date().toISOString(),
        from: "cursor",
        module: args.module,
        portion: args.portion,
        status: args.status,
        summary: args.summary,
        git: args.git,
        checks: args.checks,
        blocker: args.blocker,
      };

      await appendJsonl(POSTBACK_FILE, postback);

      return {
        content: [
          {
            type: "text",
            text: `Recorded postback for ${args.id} with status ${args.status}.`,
          },
        ],
      };
    }
  );

  // ---------- Tools: queue_latest ----------

  server.tool(
    "queue_latest",
    "Show the latest N tasks and their last known status.",
    {
      limit: z.number().int().positive().max(50).optional().default(5),
    },
    async (args) => {
      await ensureMcpDir();
      const items = await readJsonl<QueueItem>(QUEUE_FILE);
      const postbacks = await readJsonl<Postback>(POSTBACK_FILE);

      const lastItems = items.slice(-args.limit);
      const byId = new Map<string, Postback>();

      for (const pb of postbacks) {
        byId.set(pb.id, pb);
      }

      const summary = lastItems.map((item) => {
        const pb = byId.get(item.id);
        return {
          id: item.id,
          module: item.module,
          portion: item.portion,
          title: item.title,
          queueStatus: item.status,
          lastPostbackStatus: pb?.status ?? null,
          lastSummary: pb?.summary ?? null,
        };
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    }
  );

  // ---------- Tools: debug_paths ----------

  server.tool(
    "debug_paths",
    "Debug path resolution for repo root and MCP directory.",
    {},
    async () => {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ok: true,
              repo_root: REPO_ROOT,
              mcp_dir: MCP_DIR,
              cwd: process.cwd(),
              env_BENT_REPO_ROOT: process.env.BENT_REPO_ROOT ?? null,
            }, null, 2),
          },
        ],
      };
    }
  );

  // ---------- Tools: intake_put ----------

  server.tool(
    "intake_put",
    "Write assistant intake markdown to bootstrap file.",
    {
      assistant_intake_md: z.string().describe("Assistant intake markdown content"),
      created_at_iso: z.string().optional(),
    },
    async (args) => {
      await ensureMcpDir();
      const BOOTSTRAP_DIR = path.join(MCP_DIR, "bootstrap");
      await fs.mkdir(BOOTSTRAP_DIR, { recursive: true });
      const INTAKE_FILE = path.join(BOOTSTRAP_DIR, "intake.json");

      const created_at_iso = args.created_at_iso || new Date().toISOString();
      const intakeData = {
        created_at_iso,
        assistant_intake_md: args.assistant_intake_md,
      };

      await fs.writeFile(INTAKE_FILE, JSON.stringify(intakeData, null, 2), "utf8");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ok: true,
              path: ".mcp/bootstrap/intake.json",
              absolute_path: INTAKE_FILE,
              created_at_iso,
            }, null, 2),
          },
        ],
      };
    }
  );

  // ---------- Tools: intake_get ----------

  server.tool(
    "intake_get",
    "Read assistant intake markdown from bootstrap file.",
    {},
    async () => {
      await ensureMcpDir();
      const BOOTSTRAP_DIR = path.join(MCP_DIR, "bootstrap");
      const INTAKE_FILE = path.join(BOOTSTRAP_DIR, "intake.json");

      try {
        const content = await fs.readFile(INTAKE_FILE, "utf8");
        const intakeData = JSON.parse(content);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                ok: true,
                created_at_iso: intakeData.created_at_iso,
                assistant_intake_md: intakeData.assistant_intake_md,
              }, null, 2),
            },
          ],
        };
      } catch (err: any) {
        if (err.code === "ENOENT") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  ok: false,
                  error: "No intake published",
                }, null, 2),
              },
            ],
          };
        }
        throw err;
      }
    }
  );

  return server;
}

export function getBentQueuePaths(): { repoRoot: string; mcpDir: string } {
  if (_REPO_ROOT === null || _MCP_DIR === null) {
    throw new Error("BentQueueServer not initialized. Call createBentQueueServer() first.");
  }
  return { repoRoot: _REPO_ROOT, mcpDir: _MCP_DIR };
}
