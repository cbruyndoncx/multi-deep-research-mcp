import { z } from "zod";
export type ProviderId = "openai" | "deepseek" | string;
export interface ReasoningModel {
    id: string;
    label: string;
    provider: ProviderId;
    description?: string;
    supportsBackgroundJobs?: boolean;
    supportsCodeInterpreter?: boolean;
    supportsReasoning?: boolean;
    default?: boolean;
    tags?: string[];
    parameterSchema?: z.ZodTypeAny;
    parameterDescriptions?: Record<string, string>;
    defaultParameters?: Record<string, unknown>;
    sourceMetadata?: Record<string, unknown>;
}
export interface CreateReasoningRequest {
    query: string;
    systemMessage?: string;
    includeCodeInterpreter?: boolean;
    parameters?: Record<string, unknown>;
    model: ReasoningModel;
}
export interface CreateRequestResult {
    requestId: string;
    status: string;
    model: string;
    provider: ProviderId;
    extra?: Record<string, unknown>;
}
export interface RequestStatusResult {
    requestId: string;
    status: string;
    provider: ProviderId;
    model: string;
    createdAt?: string;
    raw?: unknown;
}
export interface ResearchResult {
    requestId: string;
    provider: ProviderId;
    model: string;
    results: Record<string, unknown>;
    raw?: unknown;
}
export interface ReasoningProvider {
    id: ProviderId;
    displayName: string;
    envKeys: string[];
    requiresBackgroundPolling: boolean;
    listModels(): Promise<ReasoningModel[]>;
    createRequest(args: CreateReasoningRequest): Promise<CreateRequestResult>;
    checkStatus(requestId: string): Promise<RequestStatusResult>;
    getResults(requestId: string): Promise<ResearchResult>;
}
//# sourceMappingURL=types.d.ts.map