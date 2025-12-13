import OpenAI from "openai";
import { z } from "zod";
import {
  CreateReasoningRequest,
  CreateRequestResult,
  ReasoningModel,
  ReasoningProvider,
  RequestStatusResult,
  ResearchResult,
} from "./types.js";
import { fetchLiteLLMReasoningCatalog, findLiteLLMMetadata, LiteLLMModelMetadata } from "../utils/litellmCatalog.js";

interface Citation {
  id: number;
  title: string;
  url?: string;
  snippet?: string;
}

const MODEL_PATTERNS = [
  /^o[0-9]/i,
  /^gpt-4\.1/i,
  /^gpt-4o/i,
  /^gpt-5/i,
  /o4o/i,
  /deep-research/i,
  /reasoning/i,
  /thinking/i,
];

const PARAMETER_SCHEMA = z.object({
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  max_output_tokens: z.number().min(32).max(128000).optional(),
  reasoning: z
    .object({
      effort: z.enum(["medium", "high"]).optional(),
      summary: z.enum(["auto", "none"]).optional(),
    })
    .optional(),
});

const PARAMETER_DESCRIPTIONS: Record<string, string> = {
  temperature: "0-2. Lower values = deterministic responses.",
  top_p: "0-1 nucleus sampling.",
  max_output_tokens: "Maximum tokens for the response.",
  "reasoning.effort": "medium/high reasoning effort.",
  "reasoning.summary": "auto/none reasoning summaries.",
};

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required.");
  }
  const timeout = parseInt(process.env.OPENAI_TIMEOUT || "600000", 10);
  return new OpenAI({
    apiKey,
    timeout,
    baseURL: process.env.OPENAI_BASE_URL,
  });
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      ordered.push(value);
    }
  }
  return ordered;
}

function filterModelIds(ids: string[]): string[] {
  return unique(ids.filter((id) => MODEL_PATTERNS.some((pattern) => pattern.test(id))));
}

async function fetchModelIds(client: OpenAI): Promise<string[]> {
  const ids: string[] = [];
  for await (const model of client.models.list()) {
    if (model?.id && typeof model.id === "string") {
      ids.push(model.id);
    }
  }
  if (!ids.length) {
    throw new Error("OpenAI models.list returned no models");
  }
  return filterModelIds(ids);
}

function buildModelEntry(modelId: string, liteMeta?: LiteLLMModelMetadata): ReasoningModel {
  return {
    id: modelId,
    label: modelId,
    provider: "openai",
    description: "OpenAI reasoning model",
    supportsReasoning: liteMeta?.supports_reasoning === true ? true : undefined,
    parameterSchema: PARAMETER_SCHEMA,
    parameterDescriptions: PARAMETER_DESCRIPTIONS,
    defaultParameters: {
      reasoning: { summary: "auto" },
    },
    sourceMetadata: liteMeta?.raw
      ? {
          source: "litellm",
          provider: liteMeta.provider,
          supports_reasoning: liteMeta.supports_reasoning,
        }
      : undefined,
  };
}

async function loadModels(): Promise<ReasoningModel[]> {
  const client = getClient();
  const ids = await fetchModelIds(client);
  let liteCatalog: Map<string, LiteLLMModelMetadata> | undefined;
  try {
    liteCatalog = await fetchLiteLLMReasoningCatalog("openrouter");
  } catch (error) {
    console.warn("Warning: Unable to fetch LiteLLM catalog:", error);
  }
  return ids.map((id) => buildModelEntry(id, findLiteLLMMetadata(liteCatalog, id)));
}

function buildMessages(query: string, systemMessage?: string) {
  const messages: any[] = [];
  if (systemMessage) {
    messages.push({
      role: "developer",
      content: [{ type: "input_text", text: systemMessage }],
    });
  }
  messages.push({
    role: "user",
    content: [{ type: "input_text", text: query }],
  });
  return messages;
}

function extractCitations(mainContent: any): Citation[] {
  const citations: Citation[] = [];
  if (mainContent?.annotations) {
    mainContent.annotations.forEach((annotation: any, index: number) => {
      citations.push({
        id: index + 1,
        title: annotation.title || "Unknown",
        url: annotation.url,
        snippet: annotation.snippet,
      });
    });
  }
  return citations;
}

function extractReport(response: any) {
  const output = response?.output;
  if (!output || !Array.isArray(output) || !output.length) {
    return null;
  }
  const lastMessage = output[output.length - 1];
  const mainContent = lastMessage?.content?.[0];
  if (!mainContent) {
    return null;
  }
  return {
    report: mainContent.text || String(mainContent),
    citations: extractCitations(mainContent),
  };
}

export function createOpenAIProvider(): ReasoningProvider {
  return {
    id: "openai",
    displayName: "OpenAI",
    envKeys: ["OPENAI_API_KEY"],
    requiresBackgroundPolling: true,
    async listModels() {
      return loadModels();
    },
    async createRequest(args: CreateReasoningRequest): Promise<CreateRequestResult> {
      const client = getClient();
      const tools: any[] = [{ type: "web_search_preview" }];
      if (args.includeCodeInterpreter) {
        tools.push({ type: "code_interpreter" });
      }
      const baseParams = (args.model.defaultParameters || {}) as Record<string, any>;
      const overrides = (args.parameters || {}) as Record<string, any>;
      const requestPayload: any = {
        model: args.model.id,
        input: buildMessages(args.query, args.systemMessage),
        tools,
        background: true,
        reasoning: overrides.reasoning || baseParams.reasoning || { summary: "auto" },
      };
      if (typeof overrides.temperature === "number") {
        requestPayload.temperature = overrides.temperature;
      }
      if (typeof overrides.top_p === "number") {
        requestPayload.top_p = overrides.top_p;
      }
      if (typeof overrides.max_output_tokens === "number") {
        requestPayload.max_output_tokens = overrides.max_output_tokens;
      }
      const response = await client.responses.create(requestPayload);
      return {
        requestId: response.id,
        status: response.status || "queued",
        model: response.model || args.model.id,
        provider: "openai",
      };
    },
    async checkStatus(requestId: string): Promise<RequestStatusResult> {
      const client = getClient();
      const response = await client.responses.retrieve(requestId);
      return {
        requestId: response.id,
        status: response.status || "unknown",
        provider: "openai",
        model: response.model || "unknown",
        createdAt: new Date(response.created_at * 1000).toISOString(),
        raw: response,
      };
    },
    async getResults(requestId: string): Promise<ResearchResult> {
      const client = getClient();
      const response = await client.responses.retrieve(requestId);
      const extracted = extractReport(response);
      if (!extracted) {
        throw new Error("Unable to extract report from OpenAI response.");
      }
      return {
        requestId: response.id,
        provider: "openai",
        model: response.model || "unknown",
        results: {
          report: extracted.report,
          citations: extracted.citations,
          citation_count: extracted.citations.length,
        },
        raw: response,
      };
    },
  };
}
