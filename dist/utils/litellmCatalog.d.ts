export interface LiteLLMModelMetadata {
    id: string;
    provider?: string;
    supports_reasoning?: boolean;
    raw?: Record<string, unknown>;
}
type CatalogMap = Map<string, LiteLLMModelMetadata>;
export declare function fetchLiteLLMReasoningCatalog(providerHint?: string): Promise<CatalogMap>;
export declare function findLiteLLMMetadata(catalog: CatalogMap | undefined, modelId: string): LiteLLMModelMetadata | undefined;
export {};
//# sourceMappingURL=litellmCatalog.d.ts.map