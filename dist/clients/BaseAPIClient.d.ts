/**
 * Base API client for making HTTP requests to AI provider APIs
 */
export interface APIClientConfig {
    baseUrl?: string;
    apiKey: string;
    timeout: number;
}
export declare class APIError extends Error {
    readonly status: number;
    readonly response?: unknown | undefined;
    constructor(status: number, message: string, response?: unknown | undefined);
}
export declare abstract class BaseAPIClient {
    protected readonly baseUrl: string;
    protected readonly apiKey: string;
    protected readonly timeout: number;
    constructor(config: APIClientConfig);
    /**
     * Make a POST request to the API
     */
    protected post<TResponse>(endpoint: string, body: unknown, additionalHeaders?: Record<string, string>): Promise<TResponse>;
    /**
     * Make a GET request to the API
     */
    protected get<TResponse>(endpoint: string, additionalHeaders?: Record<string, string>): Promise<TResponse>;
}
//# sourceMappingURL=BaseAPIClient.d.ts.map