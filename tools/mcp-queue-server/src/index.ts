import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createBentQueueServer } from "./serverCore.js";

const server = createBentQueueServer();

const transport = new StdioServerTransport();

server.connect(transport).catch((err: unknown) => {
  console.error("Failed to start MCP server:", err);
});
