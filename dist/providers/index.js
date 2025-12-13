import { createDeepSeekProvider } from "./deepseek.js";
import { createOpenAIProvider } from "./openai.js";
const factories = {
    openai: createOpenAIProvider,
    deepseek: createDeepSeekProvider,
};
const instances = new Map();
function normalizeProviderId(providerId) {
    return (providerId || "openai").toLowerCase();
}
export function getProvider(providerId) {
    const id = normalizeProviderId(providerId);
    const factory = factories[id];
    if (!factory) {
        throw new Error(`Unsupported provider '${providerId}'. Available providers: ${Object.keys(factories).join(", ")}`);
    }
    if (!instances.has(id)) {
        instances.set(id, factory());
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