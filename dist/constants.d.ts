/**
 * Constants used across the multi-deep-research MCP server
 */
export declare const SERVER_NAME = "multi-deep-research";
export declare const SERVER_VERSION = "1.0.0";
export declare const DEFAULT_PROVIDER = "openai";
export declare const REQUEST_STATUS: {
    readonly QUEUED: "queued";
    readonly IN_PROGRESS: "in_progress";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly ERROR: "error";
    readonly UNKNOWN: "unknown";
};
export declare const PARAMETER_CONSTRAINTS: {
    readonly TEMPERATURE: {
        readonly MIN: 0;
        readonly MAX: 2;
    };
    readonly TOP_P: {
        readonly MIN: 0;
        readonly MAX: 1;
    };
    readonly MAX_TOKENS_OPENAI: {
        readonly MIN: 32;
        readonly MAX: 128000;
    };
    readonly MAX_TOKENS_DEEPSEEK: {
        readonly MIN: 32;
        readonly MAX: 16384;
    };
};
export declare const COMMON_PARAMETER_DESCRIPTIONS: {
    readonly temperature: "0-2. Lower values = deterministic responses.";
    readonly top_p: "0-1 nucleus sampling.";
    readonly max_output_tokens: "Maximum tokens for the response.";
    readonly max_tokens: "Maximum tokens in the reply.";
};
export declare const DEFAULT_TIMEOUT = 600000;
//# sourceMappingURL=constants.d.ts.map