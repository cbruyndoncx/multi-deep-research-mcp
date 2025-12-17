/**
 * Base API client for making HTTP requests to AI provider APIs
 */

export interface APIClientConfig {
  baseUrl?: string;
  apiKey: string;
  timeout: number;
}

export class APIError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = "APIError";
  }
}

export abstract class BaseAPIClient {
  protected readonly baseUrl: string;
  protected readonly apiKey: string;
  protected readonly timeout: number;

  constructor(config: APIClientConfig) {
    this.baseUrl = config.baseUrl ? config.baseUrl.replace(/\/$/, "") : ""; // Remove trailing slash
    this.apiKey = config.apiKey;
    this.timeout = config.timeout;
  }

  /**
   * Make a POST request to the API
   */
  protected async post<TResponse>(
    endpoint: string,
    body: unknown,
    additionalHeaders?: Record<string, string>
  ): Promise<TResponse> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          ...additionalHeaders,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new APIError(
          response.status,
          `API request failed (${response.status}): ${errorText}`,
          errorText
        );
      }

      return response.json() as Promise<TResponse>;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new APIError(0, `Network error: ${error.message}`);
      }
      throw new APIError(0, `Unknown error: ${String(error)}`);
    }
  }

  /**
   * Make a GET request to the API
   */
  protected async get<TResponse>(
    endpoint: string,
    additionalHeaders?: Record<string, string>
  ): Promise<TResponse> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          ...additionalHeaders,
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new APIError(
          response.status,
          `API request failed (${response.status}): ${errorText}`,
          errorText
        );
      }

      return response.json() as Promise<TResponse>;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new APIError(0, `Network error: ${error.message}`);
      }
      throw new APIError(0, `Unknown error: ${String(error)}`);
    }
  }
}
