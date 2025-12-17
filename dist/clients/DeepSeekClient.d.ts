/**
 * DeepSeek API client
 * Implements chat completion endpoint for DeepSeek reasoning models
 */
import { BaseAPIClient, type APIClientConfig } from "./BaseAPIClient.js";
export interface DeepSeekMessage {
    role: string;
    content: string;
}
export interface DeepSeekChatCompletionParams {
    model: string;
    messages: DeepSeekMessage[];
    stream?: boolean;
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
}
export interface DeepSeekChatCompletionResponse {
    id: string;
    choices: Array<{
        message: {
            role: string;
            content: string | unknown[];
        };
        [key: string]: unknown;
    }>;
    [key: string]: unknown;
}
/**
 * DeepSeek API client
 * Extends base client with DeepSeek-specific endpoints
 */
export declare class DeepSeekClient extends BaseAPIClient {
    constructor(config: APIClientConfig);
    /**
     * Create a chat completion
     */
    createChatCompletion(params: DeepSeekChatCompletionParams): Promise<DeepSeekChatCompletionResponse>;
}
//# sourceMappingURL=DeepSeekClient.d.ts.map