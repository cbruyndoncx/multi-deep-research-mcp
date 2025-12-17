#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getAvailableProviderIds, getProvider } from "./providers/index.js";
import { ProviderId, ReasoningModel, ResearchResult } from "./providers/types.js";
import { SERVER_NAME, SERVER_VERSION, DEFAULT_PROVIDER, REQUEST_STATUS } from "./constants.js";
import {
  parseListEnv,
  toEnvPrefix,
  createErrorResponse,
  createSuccessResponse,
} from "./utils/helpers.js";

const server = new McpServer({
  name: SERVER_NAME,
  version: SERVER_VERSION,
});

const requestProviderMap = new Map<string, ProviderId>();
const RESULTS_DIR = path.resolve(process.cwd(), process.env.RESEARCH_RESULTS_DIR || "research-results");

const createRequestSchema = z.object({
  provider: z.string().optional().describe("Provider to use (openai, deepseek, ...). Defaults to env or OpenAI."),
  model: z.string().optional().describe("Model identifier for the selected provider. Leave blank to auto-select favorites or provider defaults."),
  query: z.string().min(1).describe("The research question or topic to investigate"),
  system_message: z.string().optional().describe("Optional system message to guide the research approach"),
  include_code_interpreter: z.boolean().default(false).describe("Whether to include the code interpreter tool (if supported by the model)"),
  parameters: z.record(z.any()).optional().describe("Model-specific parameters validated against the selected model."),
});

const statusSchema = z.object({
  request_id: z.string().min(1).describe("The provider response/request identifier"),
  provider: z.string().optional().describe("Provider to use (openai, deepseek, ...). Defaults to previous provider used for the request."),
});

const listModelsSchema = z.object({
  provider: z.string().optional().describe("Optional provider filter. Leave blank to list every provider."),
});

const listProvidersSchema = z.object({});

type CreateInputs = z.infer<typeof createRequestSchema>;
type StatusInputs = z.infer<typeof statusSchema>;

function normalizeProviderId(provider?: string): ProviderId {
  return (provider || process.env.REASONING_DEFAULT_PROVIDER || process.env.OPENAI_DEFAULT_PROVIDER || DEFAULT_PROVIDER).toLowerCase() as ProviderId;
}

function getFavoriteModels(providerId: ProviderId): string[] {
  const prefix = toEnvPrefix(providerId);
  return parseListEnv(process.env[`${prefix}_FAVORITE_MODELS`]);
}

function getDefaultModel(providerId: ProviderId): string | undefined {
  const prefix = toEnvPrefix(providerId);
  return process.env[`${prefix}_DEFAULT_MODEL`];
}

function summarizeModel(model: ReasoningModel) {
  return {
    id: model.id,
    label: model.label,
    provider: model.provider,
    description: model.description,
    supports_background_jobs: model.supportsBackgroundJobs ?? false,
    supports_code_interpreter: model.supportsCodeInterpreter ?? false,
    supports_reasoning: model.supportsReasoning ?? null,
    parameter_descriptions: model.parameterDescriptions || {},
    has_parameter_schema: Boolean(model.parameterSchema),
  };
}

function buildProviderMetadata(providerId: ProviderId) {
  const provider = getProvider(providerId);
  const envKeys = provider.envKeys || [];
  const missingKeys = envKeys.filter((key) => !process.env[key]);
  const enabled = missingKeys.length === 0;
  const favoritesKey = `${toEnvPrefix(providerId)}_FAVORITE_MODELS`;
  const defaultModelKey = `${toEnvPrefix(providerId)}_DEFAULT_MODEL`;
  return {
    id: providerId,
    display_name: provider.displayName,
    env_keys: envKeys,
    enabled,
    missing_keys: missingKeys,
    favorites_env_key: favoritesKey,
    favorites_value: process.env[favoritesKey] || null,
    default_model_env_key: defaultModelKey,
    default_model_value: process.env[defaultModelKey] || null,
    requires_background_polling: provider.requiresBackgroundPolling,
  };
}

async function resolveModelSelection(providerId: ProviderId, desiredModel?: string) {
  const provider = getProvider(providerId);
  const catalog = await provider.listModels();
  if (!catalog.length) {
    throw new Error(`Provider '${provider.displayName}' returned no models.`);
  }
  const favorites = getFavoriteModels(providerId).filter((fav) => catalog.some((model) => model.id === fav));
  const defaultModelId = desiredModel || getDefaultModel(providerId) || favorites[0] || catalog.find((model) => model.default)?.id;
  const resolvedModel = defaultModelId
    ? catalog.find((model) => model.id === defaultModelId)
    : catalog[0];
  if (!resolvedModel) {
    throw new Error(`Unable to resolve model for provider '${providerId}'.`);
  }
  if (desiredModel && resolvedModel.id !== desiredModel) {
    throw new Error(`Model '${desiredModel}' is not available for provider '${providerId}'.`);
  }
  return { provider, model: resolvedModel, catalog, favorites };
}

function validateModelParameters(model: ReasoningModel, parameters?: Record<string, unknown>) {
  if (!parameters || Object.keys(parameters).length === 0) {
    return undefined;
  }
  if (!model.parameterSchema) {
    throw new Error(`Model '${model.id}' does not accept custom parameters.`);
  }
  return model.parameterSchema.parse(parameters);
}

function rememberRequestProvider(providerId: ProviderId, requestId: string) {
  requestProviderMap.set(requestId, providerId);
}

function detectProviderForRequest(requestId: string, explicitProvider?: string): ProviderId {
  if (explicitProvider) {
    return normalizeProviderId(explicitProvider);
  }
  const fromMap = requestProviderMap.get(requestId);
  if (fromMap) {
    return fromMap;
  }
  return normalizeProviderId();
}

function sanitizeFilenameSegment(value: string) {
  const base = value ? value.toString() : "";
  const cleaned = base.replace(/[^a-z0-9-_]+/gi, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  return cleaned.slice(0, 48) || "result";
}

async function persistResearchResult(result: ResearchResult) {
  await fs.mkdir(RESULTS_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const baseName = [
    sanitizeFilenameSegment(result.provider),
    sanitizeFilenameSegment(result.model),
    sanitizeFilenameSegment(result.requestId),
    timestamp,
  ]
    .filter(Boolean)
    .join("_");
  const fileName = `${baseName}.md`;
  const filePath = path.join(RESULTS_DIR, fileName);
  const relativePath = path.relative(process.cwd(), filePath);
  const structuredResults = (result.results || {}) as Record<string, any>;
  const reportText =
    typeof structuredResults.report === "string" && structuredResults.report.trim().length
      ? structuredResults.report.trim()
      : JSON.stringify(structuredResults, null, 2);
  const citations = Array.isArray(structuredResults.citations) ? structuredResults.citations : [];
  const citationLines = citations.length
    ? citations.map((citation, index) => {
        const title = citation?.title || `Citation ${index + 1}`;
        const link = citation?.url ? ` (${citation.url})` : "";
        const snippet = citation?.snippet ? ` — ${citation.snippet}` : "";
        return `${index + 1}. ${title}${link}${snippet}`;
      })
    : ["- No citations provided."];
  const markdown = [
    "# Research Results",
    `- Request ID: ${result.requestId}`,
    `- Provider: ${result.provider}`,
    `- Model: ${result.model}`,
    `- Generated At: ${new Date().toISOString()}`,
    "",
    "## Report",
    reportText,
    "",
    "## Citations",
    citationLines.join("\n"),
  ].join("\n");
  await fs.writeFile(filePath, `${markdown}\n`, "utf8");
  return {
    absolutePath: filePath,
    relativePath,
    fileName,
  };
}

async function runWithProvider<T>(providerId: ProviderId, action: (providerId: ProviderId) => Promise<T>): Promise<T> {
  try {
    return await action(providerId);
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }
}

async function handleCreateTool(inputs: CreateInputs) {
  try {
    const providerId = normalizeProviderId(inputs.provider);
    const { provider, model, favorites } = await resolveModelSelection(providerId, inputs.model);
    const validatedParameters = validateModelParameters(model, inputs.parameters);
    const result = await provider.createRequest({
      query: inputs.query,
      systemMessage: inputs.system_message,
      includeCodeInterpreter: inputs.include_code_interpreter,
      parameters: validatedParameters,
      model,
    });
    rememberRequestProvider(provider.id, result.requestId);
    let synchronousResultPayload: Record<string, unknown> | undefined;
    if (result.status === REQUEST_STATUS.COMPLETED && result.extra?.synchronousResult) {
      const researchResult = result.extra.synchronousResult as ResearchResult;
      const fileInfo = await persistResearchResult(researchResult);
      synchronousResultPayload = {
        results: researchResult.results,
        result_file: fileInfo.absolutePath,
        result_file_relative: fileInfo.relativePath,
        result_file_name: fileInfo.fileName,
      };
    }
    return createSuccessResponse({
      request_id: result.requestId,
      provider: result.provider,
      model: result.model,
      status: result.status,
      favorites,
      parameters: validatedParameters || model.defaultParameters || {},
      ...(synchronousResultPayload || {}),
      message: "Research request created successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Failed to create research request: ${message}`, REQUEST_STATUS.FAILED);
  }
}

async function fetchStatus(inputs: StatusInputs) {
  const providerId = detectProviderForRequest(inputs.request_id, inputs.provider);
  const provider = getProvider(providerId);
  const response = await runWithProvider(providerId, async () => provider.checkStatus(inputs.request_id));
  rememberRequestProvider(providerId, response.requestId);
  return response;
}

async function fetchResults(inputs: StatusInputs) {
  const providerId = detectProviderForRequest(inputs.request_id, inputs.provider);
  const provider = getProvider(providerId);
  const response = await runWithProvider(providerId, async () => provider.getResults(inputs.request_id));
  rememberRequestProvider(providerId, response.requestId);
  return response;
}

async function handleStatusTool(inputs: StatusInputs) {
  try {
    const status = await fetchStatus(inputs);
    return createSuccessResponse({
      request_id: status.requestId,
      provider: status.provider,
      model: status.model,
      status: status.status,
      created_at: status.createdAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Failed to check status: ${message}`, REQUEST_STATUS.ERROR);
  }
}

async function handleResultsTool(inputs: StatusInputs) {
  try {
    const result = await fetchResults(inputs);
    const fileInfo = await persistResearchResult(result);
    return createSuccessResponse({
      request_id: result.requestId,
      provider: result.provider,
      model: result.model,
      results: result.results,
      result_file: fileInfo.absolutePath,
      result_file_relative: fileInfo.relativePath,
      result_file_name: fileInfo.fileName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Failed to get results: ${message}`, REQUEST_STATUS.ERROR);
  }
}

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

async function listModels(providerFilter?: string) {
  const providerIds = providerFilter ? [normalizeProviderId(providerFilter)] : getAvailableProviderIds();
  const details = [];
  for (const id of providerIds) {
    try {
      const provider = getProvider(id);
      const catalog = await provider.listModels();
      const favorites = getFavoriteModels(id).filter((fav) => catalog.some((model) => model.id === fav));
      details.push({
        provider: id,
        display_name: provider.displayName,
        favorites,
        models: catalog.map(summarizeModel),
        env: {
          favorites_key: `${toEnvPrefix(id)}_FAVORITE_MODELS`,
          default_model_key: `${toEnvPrefix(id)}_DEFAULT_MODEL`,
        },
      });
    } catch (error) {
      details.push({
        provider: id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return details;
}

async function reasoningModelsHandler(inputs: z.infer<typeof listModelsSchema>, _extra?: unknown) {
  const catalog = await listModels(inputs.provider);
  return createSuccessResponse({
    providers: catalog,
  });
}

server.registerTool(
  "reasoning_models_list",
  {
    title: "List Reasoning Models",
    description: "List reasoning/thinking models available across all configured providers.",
    inputSchema: listModelsSchema.shape,
  },
  reasoningModelsHandler
);

server.registerTool(
  "reasoning_providers_list",
  {
    title: "List Reasoning Providers",
    description: "List configured reasoning providers, credential status, and related environment keys.",
    inputSchema: listProvidersSchema.shape,
  },
  async () => {
    const providerIds = getAvailableProviderIds();
    const providers = providerIds.map(buildProviderMetadata);
    return createSuccessResponse({
      default_provider: normalizeProviderId(),
      providers,
    });
  }
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
