#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getAvailableProviderIds, getProvider } from "./providers/index.js";
import { SERVER_NAME, SERVER_VERSION, DEFAULT_PROVIDER, REQUEST_STATUS } from "./constants.js";
import { parseListEnv, toEnvPrefix, createErrorResponse, createSuccessResponse, } from "./utils/helpers.js";
const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
});
const requestProviderMap = new Map();
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
function normalizeProviderId(provider) {
    return (provider || process.env.REASONING_DEFAULT_PROVIDER || process.env.OPENAI_DEFAULT_PROVIDER || DEFAULT_PROVIDER).toLowerCase();
}
function getFavoriteModels(providerId) {
    const prefix = toEnvPrefix(providerId);
    return parseListEnv(process.env[`${prefix}_FAVORITE_MODELS`]);
}
function getDefaultModel(providerId) {
    const prefix = toEnvPrefix(providerId);
    return process.env[`${prefix}_DEFAULT_MODEL`];
}
function summarizeModel(model) {
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
function buildProviderMetadata(providerId) {
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
async function resolveModelSelection(providerId, desiredModel) {
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
function validateModelParameters(model, parameters) {
    if (!parameters || Object.keys(parameters).length === 0) {
        return undefined;
    }
    if (!model.parameterSchema) {
        throw new Error(`Model '${model.id}' does not accept custom parameters.`);
    }
    return model.parameterSchema.parse(parameters);
}
function rememberRequestProvider(providerId, requestId) {
    requestProviderMap.set(requestId, providerId);
}
function detectProviderForRequest(requestId, explicitProvider) {
    if (explicitProvider) {
        return normalizeProviderId(explicitProvider);
    }
    const fromMap = requestProviderMap.get(requestId);
    if (fromMap) {
        return fromMap;
    }
    return normalizeProviderId();
}
function ensureProviderAllowed(inputProvider, forcedProvider) {
    if (!inputProvider) {
        return;
    }
    const normalized = normalizeProviderId(inputProvider);
    if (normalized !== forcedProvider) {
        throw new Error(`This tool is limited to provider '${forcedProvider}'. Use the provider-neutral research_request_* tools instead.`);
    }
}
function ensureRequestProviderMatches(requestId, expectedProvider) {
    const knownProvider = requestProviderMap.get(requestId);
    if (knownProvider && knownProvider !== expectedProvider) {
        throw new Error(`Request '${requestId}' belongs to provider '${knownProvider}'. Use the provider-neutral research_request_* tools or select the matching provider.`);
    }
}
async function runWithProvider(providerId, action) {
    try {
        return await action(providerId);
    }
    catch (error) {
        throw error instanceof Error ? error : new Error(String(error));
    }
}
async function handleCreateTool(inputs, forcedProvider) {
    try {
        if (forcedProvider) {
            ensureProviderAllowed(inputs.provider, forcedProvider);
        }
        const providerId = forcedProvider ?? normalizeProviderId(inputs.provider);
        const { provider, model, catalog, favorites } = await resolveModelSelection(providerId, inputs.model);
        const validatedParameters = validateModelParameters(model, inputs.parameters);
        const result = await provider.createRequest({
            query: inputs.query,
            systemMessage: inputs.system_message,
            includeCodeInterpreter: inputs.include_code_interpreter,
            parameters: validatedParameters,
            model,
        });
        rememberRequestProvider(provider.id, result.requestId);
        return createSuccessResponse({
            request_id: result.requestId,
            provider: result.provider,
            model: result.model,
            status: result.status,
            favorites,
            parameters: validatedParameters || model.defaultParameters || {},
            available_models: catalog.map(summarizeModel),
            message: "Research request created successfully",
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return createErrorResponse(`Failed to create research request: ${message}`, REQUEST_STATUS.FAILED);
    }
}
async function fetchStatus(inputs, forcedProvider) {
    let providerId;
    if (forcedProvider) {
        ensureProviderAllowed(inputs.provider, forcedProvider);
        ensureRequestProviderMatches(inputs.request_id, forcedProvider);
        providerId = forcedProvider;
    }
    else {
        providerId = detectProviderForRequest(inputs.request_id, inputs.provider);
    }
    const provider = getProvider(providerId);
    const response = await runWithProvider(providerId, async () => provider.checkStatus(inputs.request_id));
    rememberRequestProvider(providerId, response.requestId);
    return response;
}
async function fetchResults(inputs, forcedProvider) {
    let providerId;
    if (forcedProvider) {
        ensureProviderAllowed(inputs.provider, forcedProvider);
        ensureRequestProviderMatches(inputs.request_id, forcedProvider);
        providerId = forcedProvider;
    }
    else {
        providerId = detectProviderForRequest(inputs.request_id, inputs.provider);
    }
    const provider = getProvider(providerId);
    const response = await runWithProvider(providerId, async () => provider.getResults(inputs.request_id));
    rememberRequestProvider(providerId, response.requestId);
    return response;
}
async function handleStatusTool(inputs, forcedProvider) {
    try {
        const status = await fetchStatus(inputs, forcedProvider);
        return createSuccessResponse({
            request_id: status.requestId,
            provider: status.provider,
            model: status.model,
            status: status.status,
            created_at: status.createdAt,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return createErrorResponse(`Failed to check status: ${message}`, REQUEST_STATUS.ERROR);
    }
}
async function handleResultsTool(inputs, forcedProvider) {
    try {
        const result = await fetchResults(inputs, forcedProvider);
        return createSuccessResponse({
            request_id: result.requestId,
            provider: result.provider,
            model: result.model,
            results: result.results,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return createErrorResponse(`Failed to get results: ${message}`, REQUEST_STATUS.ERROR);
    }
}
server.registerTool("research_request_create", {
    title: "Create Research Request",
    description: "Create a new research request on OpenAI, DeepSeek, or another configured reasoning provider.",
    inputSchema: createRequestSchema.shape,
}, (inputs) => handleCreateTool(inputs));
server.registerTool("openai_deep_research_create", {
    title: "Create OpenAI Research Request (legacy alias)",
    description: "Legacy OpenAI-only alias. Use research_request_create for multi-provider support.",
    inputSchema: createRequestSchema.shape,
}, (inputs) => handleCreateTool(inputs, "openai"));
server.registerTool("research_request_check_status", {
    title: "Check Research Request Status",
    description: "Check the status of a research request for any provider.",
    inputSchema: statusSchema.shape,
}, (inputs) => handleStatusTool(inputs));
server.registerTool("openai_deep_research_check_status", {
    title: "Check OpenAI Research Request Status (legacy alias)",
    description: "Legacy OpenAI-only alias. Use research_request_check_status for multi-provider support.",
    inputSchema: statusSchema.shape,
}, (inputs) => handleStatusTool(inputs, "openai"));
server.registerTool("research_request_get_results", {
    title: "Get Research Results",
    description: "Retrieve the results of a completed research request for any provider.",
    inputSchema: statusSchema.shape,
}, (inputs) => handleResultsTool(inputs));
server.registerTool("openai_deep_research_get_results", {
    title: "Get OpenAI Research Results (legacy alias)",
    description: "Legacy OpenAI-only alias. Use research_request_get_results for multi-provider support.",
    inputSchema: statusSchema.shape,
}, (inputs) => handleResultsTool(inputs, "openai"));
async function listModels(providerFilter) {
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
        }
        catch (error) {
            details.push({
                provider: id,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    return details;
}
async function reasoningModelsHandler(inputs, _extra) {
    const catalog = await listModels(inputs.provider);
    return createSuccessResponse({
        providers: catalog,
    });
}
server.registerTool("reasoning_models_list", {
    title: "List Reasoning Models",
    description: "List reasoning/thinking models available across all configured providers.",
    inputSchema: listModelsSchema.shape,
}, reasoningModelsHandler);
server.registerTool("openai_thinking_models_list", {
    title: "List Reasoning Models (legacy alias)",
    description: "Legacy alias for reasoning_models_list. Lists available reasoning models.",
    inputSchema: listModelsSchema.shape,
}, reasoningModelsHandler);
server.registerTool("reasoning_providers_list", {
    title: "List Reasoning Providers",
    description: "List configured reasoning providers, credential status, and related environment keys.",
    inputSchema: listProvidersSchema.shape,
}, async () => {
    const providerIds = getAvailableProviderIds();
    const providers = providerIds.map(buildProviderMetadata);
    return createSuccessResponse({
        default_provider: normalizeProviderId(),
        providers,
    });
});
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
//# sourceMappingURL=server.js.map