/**
 * DeepSeek API client
 * Implements chat completion endpoint for DeepSeek reasoning models
 */
import { BaseAPIClient } from "./BaseAPIClient.js";
/**
 * DeepSeek API client
 * Extends base client with DeepSeek-specific endpoints
 */
export class DeepSeekClient extends BaseAPIClient {
    constructor(config) {
        super(config);
    }
    /**
     * Create a chat completion
     */
    async createChatCompletion(params) {
        return this.post("/v1/chat/completions", params);
    }
}
//# sourceMappingURL=DeepSeekClient.js.map