#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  createRequestSchema,
  statusSchema,
  listModelsSchema,
  listProvidersSchema,
  handleCreateTool,
  handleStatusTool,
  handleResultsTool,
  reasoningModelsHandler,
  reasoningProvidersHandler,
} from "./handlers.js";
import { SERVER_NAME, SERVER_VERSION } from "./constants.js";

const server = new McpServer({
  name: SERVER_NAME,
  version: SERVER_VERSION,
});

server.registerTool(
  "research_request_create",
  {
    title: "Create Research Request",
    description: "Create a new research request on OpenAI, DeepSeek, or another configured reasoning provider.",
    inputSchema: createRequestSchema.shape,
  },
  (inputs) => handleCreateTool(inputs)
);

server.registerTool(
  "research_request_check_status",
  {
    title: "Check Research Request Status",
    description: "Check the status of a research request for any provider.",
    inputSchema: statusSchema.shape,
  },
  (inputs) => handleStatusTool(inputs)
);

server.registerTool(
  "research_request_get_results",
  {
    title: "Get Research Results",
    description: "Retrieve the results of a completed research request for any provider.",
    inputSchema: statusSchema.shape,
  },
  (inputs) => handleResultsTool(inputs)
);

server.registerTool(
  "reasoning_models_list",
  {
    title: "List Reasoning Models",
    description: "List reasoning/thinking models available across all configured providers.",
    inputSchema: listModelsSchema.shape,
  },
  (inputs) => reasoningModelsHandler(inputs)
);

server.registerTool(
  "reasoning_providers_list",
  {
    title: "List Reasoning Providers",
    description: "List configured reasoning providers, credential status, and related environment keys.",
    inputSchema: listProvidersSchema.shape,
  },
  () => reasoningProvidersHandler()
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

process.on("SIGINT", () => {
  process.exit(0);
});

process.on("SIGTERM", () => {
  process.exit(0);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
