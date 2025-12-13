import { ProviderId, ReasoningProvider } from "./types.js";
export declare function getProvider(providerId?: string): ReasoningProvider;
export declare function listProviderMetadata(): {
    id: string;
    displayName: string;
}[];
export declare function getAvailableProviderIds(): ProviderId[];
//# sourceMappingURL=index.d.ts.map