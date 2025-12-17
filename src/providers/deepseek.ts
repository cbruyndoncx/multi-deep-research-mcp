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
import { PARAMETER_CONSTRAINTS, COMMON_PARAMETER_DESCRIPTIONS, REQUEST_STATUS } from "../constants.js";
import { buildMessages } from "../utils/helpers.js";
import { DeepSeekClient } from "../clients/DeepSeekClient.js";
const PARAMETER_SCHEMA = z.object({
  temperature: z.number().min(PARAMETER_CONSTRAINTS.TEMPERATURE.MIN).max(PARAMETER_CONSTRAINTS.TEMPERATURE.MAX).optional(),
  top_p: z.number().min(PARAMETER_CONSTRAINTS.TOP_P.MIN).max(PARAMETER_CONSTRAINTS.TOP_P.MAX).optional(),
  max_tokens: z.number().min(PARAMETER_CONSTRAINTS.MAX_TOKENS_DEEPSEEK.MIN).max(PARAMETER_CONSTRAINTS.MAX_TOKENS_DEEPSEEK.MAX).optional(),
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
    parameterDescriptions: COMMON_PARAMETER_DESCRIPTIONS,
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

async function fetchModels(): Promise<ReasoningModel[]> {
  // DeepSeek currently does not expose a models listing API that mirrors OpenAI's responses.
  // Return the fallback set for now so contributors have a starting point.
  return [...FALLBACK_MODELS];
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

export function createDeepSeekProvider(config: ProviderConfig): ReasoningProvider {
  const client = new DeepSeekClient(config);
  const resultCache = new Map<string, ResearchResult>();

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
      const overrides = (args.parameters || {}) as Record<string, any>;
      const params = {
        model: args.model.id,
        messages: buildMessages(args.query, args.systemMessage, "deepseek") as any[],
        stream: false,
        ...(typeof overrides.temperature === "number" && { temperature: overrides.temperature }),
        ...(typeof overrides.top_p === "number" && { top_p: overrides.top_p }),
        ...(typeof overrides.max_tokens === "number" && { max_tokens: overrides.max_tokens }),
      };
      const data = await client.createChatCompletion(params);
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
        status: REQUEST_STATUS.COMPLETED,
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
        status: REQUEST_STATUS.COMPLETED,
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
