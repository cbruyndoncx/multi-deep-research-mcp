/**
 * OpenAI API client wrapper
 * Wraps the official OpenAI SDK to maintain consistent interface
 */
import OpenAI from "openai";
/**
 * OpenAI client wrapper
 * Uses the official OpenAI SDK internally
 */
export class OpenAIClient {
    client;
    constructor(config) {
        this.client = new OpenAI({
            apiKey: config.apiKey,
            timeout: config.timeout,
            baseURL: config.baseUrl || undefined,
        });
    }
    /**
     * List available models
     */
    async listModels() {
        const models = [];
        for await (const model of this.client.models.list()) {
            if (model?.id && typeof model.id === "string") {
                models.push({ ...model, id: model.id });
            }
        }
        return models;
    }
    /**
     * Create a background response/research request
     */
    async createResponse(params) {
        const response = await this.client.responses.create(params);
        return response;
    }
    /**
     * Retrieve a response by ID
     */
    async retrieveResponse(responseId) {
        const response = await this.client.responses.retrieve(responseId);
        return response;
    }
}
//# sourceMappingURL=OpenAIClient.js.map