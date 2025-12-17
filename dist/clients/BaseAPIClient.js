/**
 * Base API client for making HTTP requests to AI provider APIs
 */
export class APIError extends Error {
    status;
    response;
    constructor(status, message, response) {
        super(message);
        this.status = status;
        this.response = response;
        this.name = "APIError";
    }
}
export class BaseAPIClient {
    baseUrl;
    apiKey;
    timeout;
    constructor(config) {
        this.baseUrl = config.baseUrl ? config.baseUrl.replace(/\/$/, "") : ""; // Remove trailing slash
        this.apiKey = config.apiKey;
        this.timeout = config.timeout;
    }
    /**
     * Make a POST request to the API
     */
    async post(endpoint, body, additionalHeaders) {
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
                throw new APIError(response.status, `API request failed (${response.status}): ${errorText}`, errorText);
            }
            return response.json();
        }
        catch (error) {
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
    async get(endpoint, additionalHeaders) {
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
                throw new APIError(response.status, `API request failed (${response.status}): ${errorText}`, errorText);
            }
            return response.json();
        }
        catch (error) {
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
//# sourceMappingURL=BaseAPIClient.js.map