import { createDeepSeekProvider } from "./deepseek.js";
import { createOpenAIProvider } from "./openai.js";
import { ProviderId, ReasoningProvider } from "./types.js";

type ProviderFactory = () => ReasoningProvider;

const factories: Record<string, ProviderFactory> = {
  openai: createOpenAIProvider,
  deepseek: createDeepSeekProvider,
};

const instances = new Map<ProviderId, ReasoningProvider>();

function normalizeProviderId(providerId?: string): ProviderId {
  return (providerId || "openai").toLowerCase() as ProviderId;
}

export function getProvider(providerId?: string): ReasoningProvider {
  const id = normalizeProviderId(providerId);
  const factory = factories[id];
  if (!factory) {
    throw new Error(`Unsupported provider '${providerId}'. Available providers: ${Object.keys(factories).join(", ")}`);
  }
  if (!instances.has(id)) {
    instances.set(id, factory());
  }
  return instances.get(id)!;
}

export function listProviderMetadata() {
  return Object.keys(factories).map((key) => ({
    id: key,
    displayName: getProvider(key).displayName,
  }));
}

export function getAvailableProviderIds(): ProviderId[] {
  return Object.keys(factories) as ProviderId[];
}
