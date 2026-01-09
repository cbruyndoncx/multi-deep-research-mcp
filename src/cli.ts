#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  createRequestSchema,
  statusSchema,
  listModelsSchema,
  handleCreateTool,
  handleStatusTool,
  handleResultsTool,
  reasoningModelsHandler,
  reasoningProvidersHandler,
} from "./handlers.js";
import { createErrorResponse } from "./utils/helpers.js";
import { REQUEST_STATUS } from "./constants.js";

type ParsedArgs = {
  command: string | null;
  flags: Record<string, string | boolean>;
};

function parseArgs(argv: string[]): ParsedArgs {
  const flags: Record<string, string | boolean> = {};
  let command: string | null = null;
  const args = [...argv];
  while (args.length > 0) {
    const token = args.shift();
    if (!token) {
      continue;
    }
    if (!command && !token.startsWith("-")) {
      command = token;
      continue;
    }
    if (token.startsWith("--")) {
      const [rawKey, inlineValue] = token.slice(2).split("=", 2);
      if (!rawKey) {
        continue;
      }
      if (inlineValue !== undefined) {
        flags[rawKey] = inlineValue;
        continue;
      }
      const next = args[0];
      if (!next || next.startsWith("-")) {
        flags[rawKey] = true;
        continue;
      }
      flags[rawKey] = args.shift() as string;
      continue;
    }
  }
  return { command, flags };
}

function getStringFlag(flags: Record<string, string | boolean>, key: string) {
  const value = flags[key];
  return typeof value === "string" ? value : undefined;
}

function getBooleanFlag(flags: Record<string, string | boolean>, key: string) {
  const value = flags[key];
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return undefined;
}

async function readFileIfProvided(filePath?: string) {
  if (!filePath) {
    return undefined;
  }
  return fs.readFile(filePath, "utf8");
}

async function readParametersFile(filePath?: string) {
  if (!filePath) {
    return undefined;
  }
  const contents = await fs.readFile(filePath, "utf8");
  return JSON.parse(contents) as Record<string, unknown>;
}

async function writeOutput(outputPath: string | undefined, payload: unknown) {
  const content = JSON.stringify(payload, null, 2);
  if (!outputPath) {
    process.stdout.write(`${content}\n`);
    return;
  }
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${content}\n`, "utf8");
  process.stdout.write(`Wrote output to ${outputPath}\n`);
}

async function run() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  if (!command) {
    throw new Error("Missing command. Expected one of: research_request_create, research_request_check_status, research_request_get_results, reasoning_models_list, reasoning_providers_list.");
  }

  if (command === "research_request_create") {
    const queryFile = getStringFlag(flags, "query-file");
    if (!queryFile) {
      throw new Error("Missing --query-file for research_request_create.");
    }
    const parametersFile = getStringFlag(flags, "parameters-file");
    const query = await readFileIfProvided(queryFile);
    if (!query || !query.trim()) {
      throw new Error(`Query file is empty: ${queryFile}`);
    }
    const inputs = createRequestSchema.parse({
      provider: getStringFlag(flags, "provider"),
      model: getStringFlag(flags, "model"),
      query,
      system_message: await readFileIfProvided(getStringFlag(flags, "system-message-file")),
      include_code_interpreter: getBooleanFlag(flags, "include-code-interpreter") ?? false,
      parameters: await readParametersFile(parametersFile),
    });
    const response = await handleCreateTool(inputs);
    await writeOutput(getStringFlag(flags, "output"), response);
    return;
  }

  if (command === "research_request_check_status") {
    const inputs = statusSchema.parse({
      request_id: getStringFlag(flags, "request-id"),
      provider: getStringFlag(flags, "provider"),
    });
    const response = await handleStatusTool(inputs);
    await writeOutput(getStringFlag(flags, "output"), response);
    return;
  }

  if (command === "research_request_get_results") {
    const inputs = statusSchema.parse({
      request_id: getStringFlag(flags, "request-id"),
      provider: getStringFlag(flags, "provider"),
    });
    const response = await handleResultsTool(inputs);
    await writeOutput(getStringFlag(flags, "output"), response);
    return;
  }

  if (command === "reasoning_models_list") {
    const inputs = listModelsSchema.parse({
      provider: getStringFlag(flags, "provider"),
    });
    const response = await reasoningModelsHandler(inputs);
    await writeOutput(getStringFlag(flags, "output"), response);
    return;
  }

  if (command === "reasoning_providers_list") {
    const response = await reasoningProvidersHandler();
    await writeOutput(getStringFlag(flags, "output"), response);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

run().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error);
  const response = createErrorResponse(message, REQUEST_STATUS.ERROR);
  await writeOutput(getStringFlag(parseArgs(process.argv.slice(2)).flags, "output"), response);
  process.exitCode = 1;
});
