import { createDeepSeekProvider } from "./deepseek.js";
import { createOpenAIProvider } from "./openai.js";
import { getTimeout } from "../utils/helpers.js";
import { DEFAULT_TIMEOUT } from "../constants.js";
const factories = {
    openai: createOpenAIProvider,
    deepseek: createDeepSeekProvider,
};
const defaultBaseUrls = {
    deepseek: "https://api.deepseek.com",
};
const instances = new Map();
function normalizeProviderId(providerId) {
    return (providerId || "openai").toLowerCase();
}
function getProviderConfig(providerId) {
    const envPrefix = providerId.toUpperCase();
    const apiKey = process.env[`${envPrefix}_API_KEY`];
    if (!apiKey) {
        throw new Error(`${envPrefix}_API_KEY environment variable is required for the ${providerId} provider.`);
    }
    return {
        apiKey,
        baseUrl: process.env[`${envPrefix}_BASE_URL`] || defaultBaseUrls[providerId],
        timeout: getTimeout(`${envPrefix}_TIMEOUT`, DEFAULT_TIMEOUT),
    };
}
export function getProvider(providerId) {
    const id = normalizeProviderId(providerId);
    const factory = factories[id];
    if (!factory) {
        throw new Error(`Unsupported provider '${providerId}'. Available providers: ${Object.keys(factories).join(", ")}`);
    }
    if (!instances.has(id)) {
        const config = getProviderConfig(id);
        instances.set(id, factory(config));
    }
    return instances.get(id);
}
export function listProviderMetadata() {
    return Object.keys(factories).map((key) => ({
        id: key,
        displayName: getProvider(key).displayName,
    }));
}
export function getAvailableProviderIds() {
    return Object.keys(factories);
}
//# sourceMappingURL=index.js.map