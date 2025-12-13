import { z } from "zod";
const DEFAULT_BASE_URL = "https://api.deepseek.com";
const PARAMETER_SCHEMA = z.object({
    temperature: z.number().min(0).max(2).optional(),
    top_p: z.number().min(0).max(1).optional(),
    max_tokens: z.number().min(32).max(16384).optional(),
});
const FALLBACK_MODELS = [
    {
        id: "deepseek-reasoner",
        label: "deepseek-reasoner",
        provider: "deepseek",
        description: "DeepSeek reasoning model with detailed thinking traces.",
        supportsBackgroundJobs: false,
        supportsCodeInterpreter: false,
        parameterSchema: PARAMETER_SCHEMA,
        parameterDescriptions: {
            temperature: "0-2. Default 0.7.",
            top_p: "0-1 nucleus sampling.",
            max_tokens: "Maximum tokens in the reply.",
        },
    },
    {
        id: "deepseek-r1",
        label: "deepseek-r1",
        provider: "deepseek",
        description: "Latest DeepSeek R1 reasoning model.",
        supportsBackgroundJobs: false,
        supportsCodeInterpreter: false,
        parameterSchema: PARAMETER_SCHEMA,
    },
];
const resultCache = new Map();
function getConfig() {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
        throw new Error("DEEPSEEK_API_KEY environment variable is required for the DeepSeek provider.");
    }
    return {
        apiKey,
        baseUrl: process.env.DEEPSEEK_BASE_URL || DEFAULT_BASE_URL,
        timeout: parseInt(process.env.DEEPSEEK_TIMEOUT || "600000", 10),
    };
}
async function fetchModels() {
    // DeepSeek currently does not expose a models listing API that mirrors OpenAI's responses.
    // Return the fallback set for now so contributors have a starting point.
    return [...FALLBACK_MODELS];
}
async function postJSON(url, body, headers) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
    }
    return response.json();
}
function buildMessages(query, systemMessage) {
    const messages = [];
    if (systemMessage) {
        messages.push({ role: "system", content: systemMessage });
    }
    messages.push({ role: "user", content: query });
    return messages;
}
function extractReport(data) {
    const message = data?.choices?.[0]?.message;
    if (!message) {
        throw new Error("DeepSeek response missing message content.");
    }
    const content = Array.isArray(message.content)
        ? message.content.map((entry) => entry.text ?? entry).join("\n\n")
        : message.content;
    return typeof content === "string" ? content : JSON.stringify(content, null, 2);
}
export function createDeepSeekProvider() {
    return {
        id: "deepseek",
        displayName: "DeepSeek",
        envKeys: ["DEEPSEEK_API_KEY"],
        requiresBackgroundPolling: false,
        async listModels() {
            return fetchModels();
        },
        async createRequest(args) {
            if (args.includeCodeInterpreter) {
                throw new Error("DeepSeek models do not currently support the code interpreter tool.");
            }
            const config = getConfig();
            const url = `${config.baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
            const overrides = (args.parameters || {});
            const payload = {
                model: args.model.id,
                messages: buildMessages(args.query, args.systemMessage),
                stream: false,
            };
            if (typeof overrides.temperature === "number") {
                payload.temperature = overrides.temperature;
            }
            if (typeof overrides.top_p === "number") {
                payload.top_p = overrides.top_p;
            }
            if (typeof overrides.max_tokens === "number") {
                payload.max_tokens = overrides.max_tokens;
            }
            const data = await postJSON(url, payload, {
                Authorization: `Bearer ${config.apiKey}`,
            });
            const requestId = data?.id || `deepseek-${Date.now()}`;
            const report = extractReport(data);
            const result = {
                requestId,
                provider: "deepseek",
                model: args.model.id,
                results: {
                    report,
                    citations: [],
                    citation_count: 0,
                },
                raw: data,
            };
            resultCache.set(requestId, result);
            return {
                requestId,
                status: "completed",
                model: args.model.id,
                provider: "deepseek",
            };
        },
        async checkStatus(requestId) {
            if (!resultCache.has(requestId)) {
                throw new Error(`Unknown DeepSeek request: ${requestId}`);
            }
            const result = resultCache.get(requestId);
            return {
                requestId,
                status: "completed",
                provider: "deepseek",
                model: result.model,
            };
        },
        async getResults(requestId) {
            const result = resultCache.get(requestId);
            if (!result) {
                throw new Error(`Results unavailable for DeepSeek request ${requestId}.`);
            }
            return result;
        },
    };
}
//# sourceMappingURL=deepseek.js.map