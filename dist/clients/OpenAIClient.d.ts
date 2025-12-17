/**
 * OpenAI API client wrapper
 * Wraps the official OpenAI SDK to maintain consistent interface
 */
import type { APIClientConfig } from "./BaseAPIClient.js";
export interface OpenAIModel {
    id: string;
    [key: string]: unknown;
}
export interface OpenAIResponse {
    id: string;
    status: string;
    model: string;
    created_at: number;
    output?: unknown[];
    [key: string]: unknown;
}
/**
 * OpenAI client wrapper
 * Uses the official OpenAI SDK internally
 */
export declare class OpenAIClient {
    private readonly client;
    constructor(config: APIClientConfig);
    /**
     * List available models
     */
    listModels(): Promise<OpenAIModel[]>;
    /**
     * Create a background response/research request
     */
    createResponse(params: {
        model: string;
        input: unknown[];
        tools?: unknown[];
        background?: boolean;
        reasoning?: unknown;
        temperature?: number;
        top_p?: number;
        max_output_tokens?: number;
    }): Promise<OpenAIResponse>;
    /**
     * Retrieve a response by ID
     */
    retrieveResponse(responseId: string): Promise<OpenAIResponse>;
}
//# sourceMappingURL=OpenAIClient.d.ts.map