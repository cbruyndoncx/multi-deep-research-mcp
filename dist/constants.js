/**
 * Constants used across the multi-deep-research MCP server
 */
// Server configuration
export const SERVER_NAME = "multi-deep-research";
export const SERVER_VERSION = "1.0.0";
export const DEFAULT_PROVIDER = "openai";
// Request status values
export const REQUEST_STATUS = {
    QUEUED: "queued",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
    FAILED: "failed",
    ERROR: "error",
    UNKNOWN: "unknown",
};
// Common parameter constraints
export const PARAMETER_CONSTRAINTS = {
    TEMPERATURE: { MIN: 0, MAX: 2 },
    TOP_P: { MIN: 0, MAX: 1 },
    MAX_TOKENS_OPENAI: { MIN: 32, MAX: 128000 },
    MAX_TOKENS_DEEPSEEK: { MIN: 32, MAX: 16384 },
};
// Common parameter descriptions
export const COMMON_PARAMETER_DESCRIPTIONS = {
    temperature: "0-2. Lower values = deterministic responses.",
    top_p: "0-1 nucleus sampling.",
    max_output_tokens: "Maximum tokens for the response.",
    max_tokens: "Maximum tokens in the reply.",
};
// Default timeouts (in milliseconds)
export const DEFAULT_TIMEOUT = 600000; // 10 minutes
//# sourceMappingURL=constants.js.map