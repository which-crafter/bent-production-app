import "dotenv/config";
import { type Request, type Response, type NextFunction } from "express";
import express from "express";
import process from "node:process";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { createBentQueueServer } from "./serverCore.js";

const API_KEY = process.env.BENT_MCP_API_KEY;

if (!API_KEY) {
  console.error("BENT_MCP_API_KEY is not set. Refusing to start HTTP MCP server.");
  process.exit(1);
}

const server = createBentQueueServer();

const app = express();

app.use(express.json());

// Stateless transport: no server-issued sessions.
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
});

// Connect MCP server to transport
server.connect(transport).catch((err: unknown) => {
  console.error("Failed to connect MCP server transport:", err);
  process.exit(1);
});

app.options("/mcp", (_req, res) => {
  res.sendStatus(204);
});

app.get("/mcp", async (req, res) => {
  const accept = String(req.headers["accept"] ?? "");
  // Only invoke MCP SSE behavior if the client explicitly accepts it.
  if (accept.includes("text/event-stream")) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await transport.handleRequest(req as any, res as any, undefined);
    return;
  }
  // App builder may probe with plain GET; return OK instead of 406.
  res.status(200).json({ ok: true });
});

app.post("/mcp", async (req, res) => {
  const body: any = (req as any).body;

  // If this isn't a JSON-RPC MCP request, treat it as a harmless probe.
  if (!body || body.jsonrpc !== "2.0") {
    res.status(200).json({ ok: true });
    return;
  }

  try {
    // Forward all JSON-RPC requests (initialize/tools/list/tools/call/etc)
    // to the MCP transport. ChatGPT Apps won't send custom auth headers.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await transport.handleRequest(req as any, res as any, body);
  } catch (err: unknown) {
    console.error("Error handling /mcp request:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

const PORT = 8000;
const HOST = "127.0.0.1";

app.listen(PORT, HOST, () => {
  console.log(`Bent MCP HTTP server listening at http://${HOST}:${PORT}/mcp`);
});
