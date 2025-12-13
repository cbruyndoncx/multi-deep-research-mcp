#!/usr/bin/env -S node --loader ts-node/esm
import { fetchLiteLLMReasoningCatalog } from "../src/utils/litellmCatalog.js";

async function main() {
  try {
    const catalog = await fetchLiteLLMReasoningCatalog("openrouter");
    console.log(`Fetched LiteLLM catalog with ${catalog.size} entries.`);
    const sample = Array.from(catalog.values()).slice(0, 5);
    console.log("Sample entries:", JSON.stringify(sample, null, 2));
  } catch (error) {
    console.error("Failed to fetch LiteLLM catalog:", error);
    process.exit(1);
  }
}

main();
