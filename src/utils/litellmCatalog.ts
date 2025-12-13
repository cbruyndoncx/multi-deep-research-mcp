const DEFAULT_LITELLM_SOURCE = "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json";

export interface LiteLLMModelMetadata {
  id: string;
  provider?: string;
  supports_reasoning?: boolean;
  raw?: Record<string, unknown>;
}

type CatalogMap = Map<string, LiteLLMModelMetadata>;

function normalizeCandidates(id: string): string[] {
  const normalized = id.toLowerCase();
  const candidates = new Set<string>([normalized]);
  const slashIndex = normalized.lastIndexOf("/");
  if (slashIndex >= 0 && slashIndex < normalized.length - 1) {
    candidates.add(normalized.slice(slashIndex + 1));
  }
  const colonIndex = normalized.lastIndexOf(":");
  if (colonIndex >= 0 && colonIndex < normalized.length - 1) {
    candidates.add(normalized.slice(colonIndex + 1));
  }
  return Array.from(candidates);
}

function addEntryToMap(map: CatalogMap, key: string, entry: any, providerHint?: string) {
  if (!entry || typeof entry !== "object") {
    return;
  }
  const providerValue = (entry.litellm_provider || entry.provider || "").toString().toLowerCase();
  if (providerHint && providerHint.length && !providerValue.includes(providerHint.toLowerCase())) {
    return;
  }
  const id = (entry.model_id || entry.model || entry.id || key)?.toString();
  if (!id) {
    return;
  }
  const metadata: LiteLLMModelMetadata = {
    id,
    provider: entry.litellm_provider || entry.provider,
    supports_reasoning: entry.supports_reasoning === true,
    raw: entry,
  };
  for (const candidate of normalizeCandidates(id)) {
    map.set(candidate, metadata);
  }
}

function flattenCatalog(raw: any, providerHint?: string): CatalogMap {
  const map: CatalogMap = new Map();
  if (Array.isArray(raw)) {
    raw.forEach((entry, index) => addEntryToMap(map, `entry_${index}`, entry, providerHint));
    return map;
  }
  if (raw && typeof raw === "object") {
    Object.entries(raw).forEach(([key, value]) => addEntryToMap(map, key, value, providerHint));
  }
  return map;
}

export async function fetchLiteLLMReasoningCatalog(providerHint = "openrouter"): Promise<CatalogMap> {
  const source = process.env.LITELLM_MODEL_SOURCE || DEFAULT_LITELLM_SOURCE;
  const response = await fetch(source, { headers: { "User-Agent": "openai-deep-research-mcp" } });
  if (!response.ok) {
    throw new Error(`Failed to fetch LiteLLM catalog (${response.status})`);
  }
  const payload = await response.json();
  return flattenCatalog(payload, providerHint);
}

export function findLiteLLMMetadata(catalog: CatalogMap | undefined, modelId: string): LiteLLMModelMetadata | undefined {
  if (!catalog || !modelId) {
    return undefined;
  }
  for (const candidate of normalizeCandidates(modelId)) {
    const entry = catalog.get(candidate);
    if (entry) {
      return entry;
    }
  }
  return undefined;
}
