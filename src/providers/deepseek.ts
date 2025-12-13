import { z } from "zod";
import {
  CreateReasoningRequest,
  CreateRequestResult,
  ReasoningModel,
  ReasoningProvider,
  RequestStatusResult,
  ResearchResult,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const PARAMETER_SCHEMA = z.object({
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  max_tokens: z.number().min(32).max(16384).optional(),
});

const FALLBACK_MODELS: ReasoningModel[] = [
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

const resultCache = new Map<string, ResearchResult>();

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

async function fetchModels(): Promise<ReasoningModel[]> {
  // DeepSeek currently does not expose a models listing API that mirrors OpenAI's responses.
  // Return the fallback set for now so contributors have a starting point.
  return [...FALLBACK_MODELS];
}

async function postJSON(url: string, body: Record<string, unknown>, headers: Record<string, string>) {
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

function buildMessages(query: string, systemMessage?: string) {
  const messages: Array<{ role: string; content: string }> = [];
  if (systemMessage) {
    messages.push({ role: "system", content: systemMessage });
  }
  messages.push({ role: "user", content: query });
  return messages;
}

function extractReport(data: any) {
  const message = data?.choices?.[0]?.message;
  if (!message) {
    throw new Error("DeepSeek response missing message content.");
  }
  const content = Array.isArray(message.content)
    ? message.content.map((entry: any) => entry.text ?? entry).join("\n\n")
    : message.content;
  return typeof content === "string" ? content : JSON.stringify(content, null, 2);
}

export function createDeepSeekProvider(): ReasoningProvider {
  return {
    id: "deepseek",
    displayName: "DeepSeek",
    envKeys: ["DEEPSEEK_API_KEY"],
    requiresBackgroundPolling: false,
    async listModels() {
      return fetchModels();
    },
    async createRequest(args: CreateReasoningRequest): Promise<CreateRequestResult> {
      if (args.includeCodeInterpreter) {
        throw new Error("DeepSeek models do not currently support the code interpreter tool.");
      }
      const config = getConfig();
      const url = `${config.baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
      const overrides = (args.parameters || {}) as Record<string, any>;
      const payload: Record<string, unknown> = {
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
      const data = await postJSON(
        url,
        payload,
        {
          Authorization: `Bearer ${config.apiKey}`,
        }
      );
      const requestId = data?.id || `deepseek-${Date.now()}`;
      const report = extractReport(data);
      const result: ResearchResult = {
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
    async checkStatus(requestId: string): Promise<RequestStatusResult> {
      if (!resultCache.has(requestId)) {
        throw new Error(`Unknown DeepSeek request: ${requestId}`);
      }
      const result = resultCache.get(requestId)!;
      return {
        requestId,
        status: "completed",
        provider: "deepseek",
        model: result.model,
      };
    },
    async getResults(requestId: string): Promise<ResearchResult> {
      const result = resultCache.get(requestId);
      if (!result) {
        throw new Error(`Results unavailable for DeepSeek request ${requestId}.`);
      }
      return result;
    },
  };
}
