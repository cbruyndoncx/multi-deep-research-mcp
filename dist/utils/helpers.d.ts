/**
 * Common helper functions used across providers
 */
/**
 * Builds messages array for API requests
 * Supports both OpenAI and DeepSeek message formats
 */
export declare function buildMessages(query: string, systemMessage?: string, format?: "openai" | "deepseek"): any[];
/**
 * Parses a comma-separated list from an environment variable
 */
export declare function parseListEnv(value?: string): string[];
/**
 * Gets timeout value from environment variable with fallback
 */
export declare function getTimeout(envKey: string, defaultValue: number): number;
/**
 * Converts provider ID to environment variable prefix
 */
export declare function toEnvPrefix(providerId: string): string;
/**
 * Creates a standardized error response
 */
export declare function createErrorResponse(message: string, status?: string): {
    content: {
        type: "text";
        text: string;
    }[];
};
/**
 * Creates a standardized success response
 */
export declare function createSuccessResponse(data: Record<string, unknown>): {
    content: {
        type: "text";
        text: string;
    }[];
};
/**
 * Removes duplicate values from an array while preserving order
 */
export declare function unique<T>(values: T[]): T[];
//# sourceMappingURL=helpers.d.ts.map