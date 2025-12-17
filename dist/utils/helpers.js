/**
 * Common helper functions used across providers
 */
/**
 * Builds messages array for API requests
 * Supports both OpenAI and DeepSeek message formats
 */
export function buildMessages(query, systemMessage, format = "deepseek") {
    const messages = [];
    if (systemMessage) {
        if (format === "openai") {
            messages.push({
                role: "developer",
                content: [{ type: "input_text", text: systemMessage }],
            });
        }
        else {
            messages.push({ role: "system", content: systemMessage });
        }
    }
    if (format === "openai") {
        messages.push({
            role: "user",
            content: [{ type: "input_text", text: query }],
        });
    }
    else {
        messages.push({ role: "user", content: query });
    }
    return messages;
}
/**
 * Parses a comma-separated list from an environment variable
 */
export function parseListEnv(value) {
    if (!value) {
        return [];
    }
    return value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
}
/**
 * Gets timeout value from environment variable with fallback
 */
export function getTimeout(envKey, defaultValue) {
    const value = process.env[envKey];
    if (!value) {
        return defaultValue;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}
/**
 * Converts provider ID to environment variable prefix
 */
export function toEnvPrefix(providerId) {
    return providerId.replace(/[^a-z0-9]/gi, "_").toUpperCase();
}
/**
 * Creates a standardized error response
 */
export function createErrorResponse(message, status = "error") {
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    error: message,
                    status,
                }, null, 2),
            },
        ],
    };
}
/**
 * Creates a standardized success response
 */
export function createSuccessResponse(data) {
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
}
/**
 * Removes duplicate values from an array while preserving order
 */
export function unique(values) {
    const seen = new Set();
    const ordered = [];
    for (const value of values) {
        if (!seen.has(value)) {
            seen.add(value);
            ordered.push(value);
        }
    }
    return ordered;
}
//# sourceMappingURL=helpers.js.map