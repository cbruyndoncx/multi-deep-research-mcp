/**
 * OpenAI API client wrapper
 * Wraps the official OpenAI SDK to maintain consistent interface
 */

import OpenAI from "openai";
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
export class OpenAIClient {
  private readonly client: OpenAI;

  constructor(config: APIClientConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      timeout: config.timeout,
      baseURL: config.baseUrl || undefined,
    });
  }

  /**
   * List available models
   */
  async listModels(): Promise<OpenAIModel[]> {
    const models: OpenAIModel[] = [];
    for await (const model of this.client.models.list()) {
      if (model?.id && typeof model.id === "string") {
        models.push({ ...model, id: model.id } as OpenAIModel);
      }
    }
    return models;
  }

  /**
   * Create a background response/research request
   */
  async createResponse(params: {
    model: string;
    input: unknown[];
    tools?: unknown[];
    background?: boolean;
    reasoning?: unknown;
    temperature?: number;
    top_p?: number;
    max_output_tokens?: number;
  }): Promise<OpenAIResponse> {
    const response = await this.client.responses.create(params as any);
    return response as unknown as OpenAIResponse;
  }

  /**
   * Retrieve a response by ID
   */
  async retrieveResponse(responseId: string): Promise<OpenAIResponse> {
    const response = await this.client.responses.retrieve(responseId);
    return response as unknown as OpenAIResponse;
  }
}
