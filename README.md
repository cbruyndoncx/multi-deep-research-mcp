# Multi-Provider Deep Research MCP Server

A TypeScript MCP (Model Context Protocol) server that can route research queries to OpenAI Deep Research models or DeepSeek reasoning models, with room for future providers.

**Based on the original work by [fbettag/openai-deep-research-mcp](https://github.com/fbettag/openai-deep-research-mcp)** - extended to support multiple AI providers.

## Features

- **research_request_create**: Create new research requests across providers (OpenAI, DeepSeek, more soon)
- **research_request_check_status**: Check request state for any provider  
- **research_request_get_results**: Retrieve completed research output with citations when provided, and save a Markdown transcript locally for reference
- **reasoning_models_list**: Inspect dynamic provider model catalogs with favorite/default hints
- **reasoning_providers_list**: Discover configured providers, credential status, and relevant env keys

## Quick Start

```bash
npx github:cbruyndoncx/multi-deep-research-mcp
```

## Quick Setup with Claude CLI

```bash
claude mcp add multi-deep-research -s user npx github:cbruyndoncx/multi-deep-research-mcp -e OPENAI_API_KEY=sk-your-openai-api-key-here
```

Replace `sk-your-openai-api-key-here` with your actual OpenAI API key.

## Claude Desktop Setup (Manual)

Add to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "multi-deep-research": {
      "command": "npx",
      "args": ["github:cbruyndoncx/multi-deep-research-mcp"],
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
Returns a request identifier and initial status. DeepSeek completes synchronously, so the report and citations (plus the saved Markdown path) are included in this response.

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
Retrieves completed results, writes the report and citations to a Markdown file (default directory `research-results/`), and returns the filename so you can open it locally.

### List Reasoning Models
```typescript
reasoning_models_list({ provider?: "deepseek" })
```
Returns provider catalogs with favorite/default env keys, parameter descriptions, and capability hints.

### List Reasoning Providers
```typescript
reasoning_providers_list({})
```
Returns each configured provider, credential status, and the env var keys to set favorites/defaults.

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
  - `RESEARCH_RESULTS_DIR`: directory for saved Markdown exports (defaults to `research-results/`)

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

Provide at least one of `OPENAI_API_KEY`/`TEST_OPENAI_API_KEY` or `DEEPSEEK_API_KEY` before running so the related provider flow executes. Set `OPENAI_TEST_MODEL` (default `o4-mini`) if you want to force the OpenAI tests to use a specific model—handy for avoiding long-running deep research jobs.

## License

MIT
