# Multi-Deep-Research MCP Architecture

Complete guide to understanding how the MCP server, CLI, and Claude Code skills work together.

## Overview

This repository provides three complementary interfaces to the same research functionality:

```
┌─────────────────────────────────────────────────────────────┐
│                    Research Capabilities                     │
│   (OpenAI Deep Research + DeepSeek Reasoning Models)        │
└─────────────────────────────────────────────────────────────┘
                             ▲
                    ┌────────┴────────┐
                    │                 │
         ┌──────────▼──────────┐   ┌──▼─────────────┐
         │   MCP Server        │   │  CLI Binary    │
         │ (server.ts)         │   │  (cli.ts)      │
         │                     │   │                │
         │ - 5 MCP Tools      │   │ - Commands    │
         │ - Protocol Wrapper  │   │ - Flag parsing │
         └──────────┬──────────┘   └──┬─────────────┘
                    │                 │
         ┌──────────▴─────┬───────────┴──┐
         │                │               │
    ┌────▼────┐    ┌──────▼──────┐   ┌───▼──────┐
    │ Claude  │    │  Shell      │   │  Direct  │
    │ Desktop │    │  Scripts    │   │  Scripts │
    │   MCP   │    │             │   │  (Bash)  │
    └─────────┘    └─────────────┘   └──────────┘
         │                │               │
         ├─ (MCP Protocol)│ (invoke)      │ (invoke)
         │                │               │
    ┌────▴────────────────▴───────────────▴────┐
    │  Claude Code Skills (.claude/skills/)    │
    │  - deep-research skill                    │
    │  - Wraps CLI invocations                 │
    └─────────────────────────────────────────┘
```

## Components

### 1. Core Research Engine (`src/`)

**Responsibility:** Business logic for all research operations

#### Files:
- **`handlers.ts`** - Handler functions for 5 MCP tools
  - `handleCreateTool()` - Create research request
  - `handleStatusTool()` - Check request status
  - `handleResultsTool()` - Retrieve results
  - `reasoningModelsHandler()` - List models
  - `reasoningProvidersHandler()` - List providers

- **`providers/`** - Provider implementations (pluggable architecture)
  - `openai.ts` - OpenAI Deep Research (async polling)
  - `deepseek.ts` - DeepSeek reasoning (synchronous)
  - `index.ts` - Provider factory and registry

- **`clients/`** - HTTP API wrappers
  - `BaseAPIClient.ts` - Base HTTP client
  - `OpenAIClient.ts` - OpenAI API wrapper
  - `DeepSeekClient.ts` - DeepSeek API wrapper

- **`utils/`** - Shared utilities
  - `helpers.ts` - Common functions
  - `litellmCatalog.ts` - Dynamic model catalog

### 2. MCP Server Interface (`src/server.ts`)

**Responsibility:** Expose research tools through Model Context Protocol

**What it does:**
1. Registers 5 MCP tools
2. Listens for tool invocations from Claude Desktop
3. Routes to handler functions
4. Returns formatted responses

**When to use:**
- Claude Desktop with MCP configuration
- Other MCP-compatible agents/platforms
- Integrations expecting MCP protocol

**Invocation:**
```bash
# Run MCP server (listens on stdio)
node dist/server.js
```

### 3. CLI Binary (`src/cli.ts`)

**Responsibility:** Command-line interface for local usage

**What it does:**
1. Parses command-line arguments and flags
2. Validates inputs
3. Calls handler functions directly
4. Returns JSON responses

**When to use:**
- Scripts and automation
- Local development
- Claude Code skills
- Shell/bash workflows

**Invocation:**
```bash
npx multi-deep-research-cli research_request_create \
  --query-file query.txt \
  --provider openai
```

### 4. Claude Code Skills (`.claude/skills/`)

**Responsibility:** User-friendly interface for Claude Code

**What it does:**
1. Wraps CLI invocations for easy use
2. Provides natural language instructions
3. Handles file I/O and result processing
4. Documents usage examples

**When to use:**
- Interactive research with Claude
- Ad-hoc queries in conversation
- Quick prototyping

**Structure:**
```
.claude/skills/deep-research/
├── SKILL.md      # Skill definition + usage guide
├── SETUP.md      # Installation & configuration
├── REFERENCE.md  # Complete API reference
└── EXAMPLES.md   # Practical examples
```

## Data Flow Examples

### Example 1: Claude Desktop Integration

```
User Query in Claude Desktop
    ↓
Claude recognizes this is a research task
    ↓
Claude invokes research_request_create (MCP tool)
    ↓
MCP Server (server.ts) receives tool call
    ↓
Handler function calls provider
    ↓
Provider (OpenAI/DeepSeek) executes research
    ↓
Result returned through MCP
    ↓
Claude displays research report to user
```

### Example 2: Claude Code Skill

```
Claude Code user types: "research quantum computing"
    ↓
Claude matches to deep-research skill
    ↓
Skill instructions tell Claude to run CLI command
    ↓
Claude runs: npx multi-deep-research-cli research_request_create ...
    ↓
CLI (cli.ts) parses arguments
    ↓
Handler function calls provider
    ↓
Provider executes research
    ↓
JSON response printed to stdout
    ↓
Claude parses and displays results
```

### Example 3: Direct CLI Usage

```
User runs: npx multi-deep-research-cli research_request_create --query-file query.txt
    ↓
CLI (cli.ts) parses arguments
    ↓
Handler function (handlers.ts) validates inputs
    ↓
Provider selected and called
    ↓
API request sent to OpenAI/DeepSeek
    ↓
Response parsed and formatted
    ↓
JSON printed to stdout
    ↓
User gets result or request_id (for OpenAI polling)
```

## Request Lifecycle

### DeepSeek (Synchronous)

```
Create Request
    ↓
POST to DeepSeek API
    ↓
Wait for response (~5-60 seconds)
    ↓
Return complete result immediately
    ↓
No polling needed ✓
```

### OpenAI (Asynchronous)

```
Create Request
    ↓
POST to OpenAI API
    ↓
Returns request_id immediately
    ↓
┌─ Client polls status (every 10-30 seconds)
│
│  GET /research_request/{request_id}/status
│
│  Response: "in_progress" (with progress details)
│
│  Loop until status = "completed"
│
└─ Client retrieves results

   GET /research_request/{request_id}/result

   Returns complete report with citations
```

## Configuration

### Environment Variables

All configuration through `.env` or shell environment:

```bash
# Authentication
OPENAI_API_KEY="sk-proj-..."
DEEPSEEK_API_KEY="sk-..."

# Defaults
REASONING_DEFAULT_PROVIDER="openai"
OPENAI_DEFAULT_MODEL="o1"
DEEPSEEK_DEFAULT_MODEL="deepseek-reasoner"

# Output
RESEARCH_RESULTS_DIR="./research-results/"

# Advanced
OPENAI_BASE_URL="https://api.openai.com/v1"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
```

### Per-Project Override (`.claude/settings.json`)

```json
{
  "environment": {
    "REASONING_DEFAULT_PROVIDER": "deepseek",
    "OPENAI_API_KEY": "sk-proj-..."
  }
}
```

## Usage Patterns

### Pattern 1: MCP Server (Claude Desktop)

**Setup:**
1. Add to Claude Desktop config:
   ```json
   {
     "mcpServers": {
       "multi-deep-research": {
         "command": "node",
         "args": ["/path/to/dist/server.js"],
         "env": {
           "OPENAI_API_KEY": "sk-proj-...",
           "DEEPSEEK_API_KEY": "sk-..."
         }
       }
     }
   }
   ```

2. Restart Claude Desktop

**Usage:**
```
User: "Research the latest AI developments"
Claude: (automatically uses research tools through MCP)
```

### Pattern 2: Claude Code Skill

**Setup:**
1. `cp -r .claude/skills/deep-research ~/.claude/skills/`
2. `npm install -g multi-deep-research-mcp`
3. Set environment variables

**Usage:**
```
In Claude Code:
/deep-research "quantum computing breakthroughs"
```

Or naturally:
```
"Can you research recent developments in gene editing?"
(Claude automatically uses the skill)
```

### Pattern 3: Direct CLI

**Setup:**
1. `npm install -g multi-deep-research-mcp`
2. Set environment variables

**Usage:**
```bash
# Create research request
npx multi-deep-research-cli research_request_create \
  --query-file query.txt \
  --provider deepseek

# Or in scripts
#!/bin/bash
query="$1"
echo "$query" | npx multi-deep-research-cli research_request_create \
  --query-file /dev/stdin
```

### Pattern 4: Embedded in Applications

**For developers integrating this:**

```typescript
import { handleCreateTool } from "multi-deep-research-mcp";

const result = await handleCreateTool({
  query: "Research topic",
  provider: "openai",
  model: "o1"
});

console.log(result.request_id);
```

## Adding New Providers

To add a new reasoning provider (e.g., Anthropic Claude, Google Gemini):

### 1. Create Provider Implementation

**File: `src/providers/newprovider.ts`**
```typescript
import { BaseProvider, ResearchRequestResult, RequestStatusResult } from "./types.js";

export class NewProvider extends BaseProvider {
  async createRequest(query: string, model?: string): Promise<ResearchRequestResult> {
    // Implement API call
  }

  async checkStatus(requestId: string): Promise<RequestStatusResult> {
    // Implement status check
  }

  async getResults(requestId: string) {
    // Implement result retrieval
  }

  async listModels() {
    // Return available models
  }
}
```

### 2. Register Provider

**File: `src/providers/index.ts`**
```typescript
import { NewProvider } from "./newprovider.js";

export function getProvider(name: string): BaseProvider {
  switch (name.toLowerCase()) {
    case "openai":
      return new OpenAIProvider();
    case "deepseek":
      return new DeepSeekProvider();
    case "newprovider":
      return new NewProvider();
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}
```

### 3. Update Documentation

- Add provider to REFERENCE.md capabilities table
- Document API key configuration
- Update SETUP.md with new environment variables

### 4. Test

- Add tests in `tests/test-suite.js`
- Verify all 5 tools work with new provider
- Document differences in behavior

## Performance Characteristics

| Component | Latency | Throughput | Scalability |
|-----------|---------|-----------|------------|
| CLI startup | <1s | N/A | Direct binary execution |
| MCP server startup | 1-2s | Single connection | Stateless, scales with multiple connections |
| DeepSeek request | 5-60s end-to-end | 1 req/sec | Provider-rate-limited |
| OpenAI request | 2-15 min total | 1 req/min (polling) | Provider-rate-limited |

## Troubleshooting

### MCP Server Issues

**Tool not appearing in Claude Desktop:**
- Verify config in Claude settings
- Check JSON syntax
- Ensure `OPENAI_API_KEY` set in environment
- Restart Claude

**Server crashes:**
- Check logs: `tail -f ~/.claude/logs/`
- Verify Node.js version: `node --version` (needs 18+)
- Reinstall: `npm install`

### CLI Issues

**Command not found:**
```bash
npm install -g multi-deep-research-mcp
# Or use with npx
npx multi-deep-research-mcp <command>
```

**API errors:**
- Verify API keys: `echo $OPENAI_API_KEY`
- Check provider status: `npx multi-deep-research-cli reasoning_providers_list`
- Review error message for rate limits or quota issues

### Skill Issues

**Skill not triggering:**
- Check `.claude/skills/deep-research/SKILL.md` exists
- Verify YAML frontmatter
- Restart Claude Code
- Check description matches user intent

**CLI not found from skill:**
- Ensure global installation: `npm list -g multi-deep-research-mcp`
- May need to set in `.claude/settings.json`

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run MCP server locally
npm run dev

# Run CLI in development
npx ts-node src/cli.ts research_request_create --help
```

### Testing

```bash
# Run integration tests
npm test

# Test MCP server
./test-mcp.sh

# Test individual provider
OPENAI_API_KEY=sk-... npm test
```

### Publishing

```bash
# Update version
npm version patch|minor|major

# Build
npm run build

# Publish to npm
npm publish

# Skills are automatically available after `npm install -g`
```

## Architecture Decisions

### Why Multiple Interfaces?

- **MCP Server** - Deep integration with Claude Desktop and other MCP clients
- **CLI** - Scriptability and flexibility for automation
- **Skills** - Natural language interface for interactive use

### Why Pluggable Providers?

- **Flexibility** - Support multiple AI providers with same interface
- **Future-proof** - Easy to add new providers (Claude, Gemini, etc.)
- **Provider comparison** - Use best tool for each task

### Why Async for OpenAI?

- OpenAI's Deep Research is genuinely async (takes minutes)
- Polling allows monitoring progress
- Fits natural MCP pattern of long-running operations

### Why Sync for DeepSeek?

- DeepSeek's reasoning models respond in seconds
- Simpler UX for quick research
- No polling overhead

## See Also

- [README.md](README.md) - User guide
- [.claude/skills/README.md](.claude/skills/README.md) - Skills setup
- [.claude/skills/deep-research/REFERENCE.md](.claude/skills/deep-research/REFERENCE.md) - API reference
- [AGENTS.md](AGENTS.md) - Development guide
