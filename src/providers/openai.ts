import { z } from "zod";
import {
  CreateReasoningRequest,
  CreateRequestResult,
  ReasoningModel,
  ReasoningProvider,
  RequestStatusResult,
  ResearchResult,
  ProviderConfig,
} from "./types.js";
import { fetchLiteLLMReasoningCatalog, findLiteLLMMetadata, LiteLLMModelMetadata } from "../utils/litellmCatalog.js";
import { PARAMETER_CONSTRAINTS, COMMON_PARAMETER_DESCRIPTIONS, REQUEST_STATUS } from "../constants.js";
import { buildMessages, unique } from "../utils/helpers.js";
import { OpenAIClient } from "../clients/OpenAIClient.js";

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
  temperature: z.number().min(PARAMETER_CONSTRAINTS.TEMPERATURE.MIN).max(PARAMETER_CONSTRAINTS.TEMPERATURE.MAX).optional(),
  top_p: z.number().min(PARAMETER_CONSTRAINTS.TOP_P.MIN).max(PARAMETER_CONSTRAINTS.TOP_P.MAX).optional(),
  max_output_tokens: z.number().min(PARAMETER_CONSTRAINTS.MAX_TOKENS_OPENAI.MIN).max(PARAMETER_CONSTRAINTS.MAX_TOKENS_OPENAI.MAX).optional(),
  reasoning: z
    .object({
      effort: z.enum(["medium", "high"]).optional(),
      summary: z.enum(["auto", "none"]).optional(),
    })
    .optional(),
});

const PARAMETER_DESCRIPTIONS: Record<string, string> = {
  ...COMMON_PARAMETER_DESCRIPTIONS,
  "reasoning.effort": "medium/high reasoning effort.",
  "reasoning.summary": "auto/none reasoning summaries.",
};

function filterModelIds(ids: string[]): string[] {
  return unique(ids.filter((id) => MODEL_PATTERNS.some((pattern) => pattern.test(id))));
}

async function fetchModelIds(client: OpenAIClient): Promise<string[]> {
  const models = await client.listModels();
  const ids = models.map((m) => m.id);
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

async function loadModels(client: OpenAIClient): Promise<ReasoningModel[]> {
  const ids = await fetchModelIds(client);
  let liteCatalog: Map<string, LiteLLMModelMetadata> | undefined;
  try {
    liteCatalog = await fetchLiteLLMReasoningCatalog("openrouter");
  } catch (error) {
    console.warn("Warning: Unable to fetch LiteLLM catalog:", error);
  }
  return ids.map((id) => buildModelEntry(id, findLiteLLMMetadata(liteCatalog, id)));
}


function appendCitationsFromContent(contentItem: any, bucket: Citation[]) {
  const annotations = Array.isArray(contentItem?.annotations) ? contentItem.annotations : [];
  for (const annotation of annotations) {
    bucket.push({
      id: bucket.length + 1,
      title: annotation?.title || "Unknown",
      url: annotation?.url,
      snippet: annotation?.snippet,
    });
  }
}

function extractTextFromContent(contentItem: any): string | null {
  if (!contentItem) {
    return null;
  }
  if (typeof contentItem === "string") {
    return contentItem;
  }
  if (typeof contentItem?.text === "string") {
    return contentItem.text;
  }
  if (Array.isArray(contentItem?.text)) {
    const flattened = contentItem.text
      .map((entry: any) => {
        if (typeof entry === "string") {
          return entry;
        }
        if (typeof entry?.text === "string") {
          return entry.text;
        }
        return null;
      })
      .filter((value: string | null): value is string => Boolean(value))
      .join("");
    if (flattened) {
      return flattened;
    }
  }
  if (Array.isArray(contentItem?.content)) {
    const nested = contentItem.content
      .map((child: any) => extractTextFromContent(child))
      .filter((value: string | null): value is string => Boolean(value))
      .join("");
    if (nested) {
      return nested;
    }
  }
  if (typeof contentItem?.value === "string") {
    return contentItem.value;
  }
  return null;
}

function extractReport(response: any) {
  const output = response?.output;
  if (!Array.isArray(output) || !output.length) {
    return null;
  }

  const sections: string[] = [];
  const citations: Citation[] = [];

  for (const message of output) {
    const contents = Array.isArray(message?.content)
      ? message.content
      : message?.content
        ? [message.content]
        : [];
    for (const contentItem of contents) {
      const chunk = extractTextFromContent(contentItem);
      if (chunk && chunk.trim()) {
        sections.push(chunk.trim());
      }
      appendCitationsFromContent(contentItem, citations);
    }
  }

  if (!sections.length) {
    return null;
  }

  return {
    report: sections.join("\n\n"),
    citations,
  };
}

export function createOpenAIProvider(config: ProviderConfig): ReasoningProvider {
  const client = new OpenAIClient(config);

  return {
    id: "openai",
    displayName: "OpenAI",
    envKeys: ["OPENAI_API_KEY"],
    requiresBackgroundPolling: true,
    async listModels() {
      return loadModels(client);
    },
    async createRequest(args: CreateReasoningRequest): Promise<CreateRequestResult> {
      const tools: any[] = [{ type: "web_search_preview" }];
      if (args.includeCodeInterpreter) {
        tools.push({ type: "code_interpreter" });
      }
      const baseParams = (args.model.defaultParameters || {}) as Record<string, any>;
      const overrides = (args.parameters || {}) as Record<string, any>;
      const requestPayload: any = {
        model: args.model.id,
        input: buildMessages(args.query, args.systemMessage, "openai"),
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
      const response = await client.createResponse(requestPayload);
      return {
        requestId: response.id,
        status: response.status || REQUEST_STATUS.QUEUED,
        model: response.model || args.model.id,
        provider: "openai",
      };
    },
    async checkStatus(requestId: string): Promise<RequestStatusResult> {
      const response = await client.retrieveResponse(requestId);
      return {
        requestId: response.id,
        status: response.status || REQUEST_STATUS.UNKNOWN,
        provider: "openai",
        model: response.model || REQUEST_STATUS.UNKNOWN,
        createdAt: new Date(response.created_at * 1000).toISOString(),
        raw: response,
      };
    },
    async getResults(requestId: string): Promise<ResearchResult> {
      const response = await client.retrieveResponse(requestId);
      const extracted = extractReport(response);
      if (!extracted) {
        throw new Error("Unable to extract report from OpenAI response.");
      }
      return {
        requestId: response.id,
        provider: "openai",
        model: response.model || REQUEST_STATUS.UNKNOWN,
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
