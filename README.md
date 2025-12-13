# OpenAI Deep Research MCP Server

A TypeScript MCP (Model Context Protocol) server that can route research queries to OpenAI Deep Research models or DeepSeek reasoning models, with room for future providers.

## Features

- **research_request_create**: Create new research requests across providers (OpenAI, DeepSeek, more soon)
- **research_request_check_status**: Check request state for any provider  
- **research_request_get_results**: Retrieve completed research output with citations when provided
- **reasoning_models_list** / **openai_thinking_models_list**: Inspect dynamic provider model catalogs with favorite/default hints
- Legacy compatibility: `openai_deep_research_*` tools remain for OpenAI-only flows and now guard against non-OpenAI providers.

## Quick Start

```bash
npx github:fbettag/openai-deep-research-mcp
```

## Quick Setup with Claude CLI

```bash
claude mcp add openai-deep-research -s user npx github:fbettag/openai-deep-research-mcp -e OPENAI_API_KEY=sk-your-openai-api-key-here
```

Replace `sk-your-openai-api-key-here` with your actual OpenAI API key.

## Claude Desktop Setup (Manual)

Add to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "openai-deep-research": {
      "command": "npx",
      "args": ["github:fbettag/openai-deep-research-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-your-openai-api-key-here"
      }
    }
  }
}
```

## Available Functions

### Create Research Request
```typescript
research_request_create({
  provider?: "openai" | "deepseek",
  model?: "o4-mini",
  query: "Your research question",
  system_message?: "Optional guidance",
  include_code_interpreter?: false,
  parameters?: {
    temperature?: 0.3,
    reasoning?: { summary: "auto" }
  }
})
```

### Check Status
```typescript
research_request_check_status({
  request_id: "req_123...",
  provider?: "deepseek" // optional when request was created in this session
})
```

### Get Results
```typescript
research_request_get_results({
  request_id: "req_123...",
  provider?: "openai"
})
```

### List Reasoning Models
```typescript
reasoning_models_list({ provider?: "deepseek" })
```
Returns provider catalogs with favorite/default env keys, parameter descriptions, and capability hints.

## Models

- OpenAI: `o3-deep-research-2025-06-26`, `o4-mini-deep-research-2025-06-26`, `o4`, `o4-mini`, `o3`, `o1`, etc. (fetched dynamically)
- DeepSeek: `deepseek-reasoner`, `deepseek-r1` (more can be added via the provider registry)

## Requirements

- Node.js >= 18.0.0
- Provider credentials:
  - `OPENAI_API_KEY` (required for OpenAI provider)
  - `DEEPSEEK_API_KEY` (required to enable DeepSeek provider)
- Optional env vars:
  - `REASONING_DEFAULT_PROVIDER`: default provider id (`openai` by default)
  - `OPENAI_FAVORITE_MODELS`, `DEEPSEEK_FAVORITE_MODELS`: comma-separated priority lists
  - `OPENAI_DEFAULT_MODEL`, `DEEPSEEK_DEFAULT_MODEL`: default model per provider
  - `LITELLM_MODEL_SOURCE`: override URL for the LiteLLM catalog (defaults to the official GitHub JSON)
  - `OPENAI_TIMEOUT`, `DEEPSEEK_TIMEOUT`: request timeouts in ms
  - `OPENAI_BASE_URL`, `DEEPSEEK_BASE_URL`: override API endpoints when self-hosting

## Development

```bash
npm install
npm run dev
```

## Testing

1. Build once so the server binary exists: `npm run build`.
2. Run the integration harness: `npm test`.
3. For manual debugging of the LiteLLM catalog, run `node --loader ts-node/esm scripts/test-litellm-catalog.ts` (requires network access to GitHub).

The suite now logs:
- Active provider credentials/defaults and favorite env hints.
- Tool registration sanity checks.
- `reasoning_models_list` coverage to confirm provider catalogs expose models/favorites.
- Full OpenAI research lifecycle (create → status polling → results) when `OPENAI_API_KEY` (or `TEST_OPENAI_API_KEY`) is set.
- Full DeepSeek reasoning lifecycle (create/status/results) when `DEEPSEEK_API_KEY` is set. Tests are skipped with a clear note when credentials are missing.

Provide at least one of `OPENAI_API_KEY`/`TEST_OPENAI_API_KEY` or `DEEPSEEK_API_KEY` before running so the related provider flow executes. Set `OPENAI_TEST_MODEL` (default `o4-mini`) if you want to force the OpenAI tests to use a specific model—handy for avoiding long-running deep research jobs. The legacy `openai_deep_research_*` tools still exist but now enforce OpenAI-only usage; prefer the provider-neutral `research_request_*` tools going forward.

## License

MIT
