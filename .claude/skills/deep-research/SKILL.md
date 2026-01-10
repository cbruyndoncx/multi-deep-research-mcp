---
name: deep-research
description: Conduct deep research with OpenAI and DeepSeek reasoning models. Use when you need comprehensive, well-reasoned analysis of complex topics.
allowed-tools:
  - Bash
  - Read
  - Write
context: fork
agent: general-purpose
user-invocable: true
---

# Deep Research

Conducts comprehensive research using OpenAI's Deep Research and DeepSeek's reasoning models. Unified workflow: create request → poll if needed → return formatted markdown report.

## Quick Start

### 1. Copy the Skill

```bash
git clone https://github.com/YOUR_GITHUB/multi-deep-research-mcp.git
cp -r multi-deep-research-mcp/.claude/skills/deep-research ~/.claude/skills/
```

### 2. Install uvx (One-time Setup)

```bash
pip install uv
```

### 3. Set API Keys

```bash
export OPENAI_API_KEY="your-key-here"
export DEEPSEEK_API_KEY="your-key-here"
```

Add to `~/.bashrc` or `~/.zshrc` to persist across sessions.

### 4. Use in Claude Code

Just use the skill:

```
/deep-research "What are the latest AI breakthroughs?" --provider deepseek
```

### 5. Or Use from Command Line

```bash
uvx --from ~/.claude/skills/deep-research research \
  "What is quantum computing?" \
  --provider deepseek
```

The skill will:
1. Submit your research query
2. Poll for completion (if needed)
3. Return a formatted markdown report with citations
4. Save the report to `~/research-results/`

---

## CLI Usage (via uvx)

Use uvx to run the research tool from anywhere without installation:

### Quick Research

```bash
uvx --from ~/.claude/skills/deep-research research "What is quantum computing?" --provider deepseek
```

### Research with OpenAI (auto-polls)

```bash
uvx --from ~/.claude/skills/deep-research research "Analyze recent AI trends" --provider openai --poll
```

### Research from File and Save Output

```bash
uvx --from ~/.claude/skills/deep-research research \
  --query-file query.txt \
  --provider openai \
  --output results.md \
  --poll
```

### Check Status or Get Results

```bash
# Check status of running request
uvx --from ~/.claude/skills/deep-research research --check-status <request-id> --provider openai

# Retrieve completed results
uvx --from ~/.claude/skills/deep-research research --get-results <request-id> --provider openai
```

### Create an Alias (Optional)

For easier typing, add to your shell config (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
alias research='uvx --from ~/.claude/skills/deep-research research'

# Then use simply:
research "your query" --provider deepseek --output report.md
```

## Supported Providers

| Provider | Speed | Cost | Default Model | Polling |
|----------|-------|------|---------------|---------|
| **DeepSeek** | Fast ⚡ | Low 💰 | deepseek-reasoner | No (sync) |
| **OpenAI** | Slower 🔄 | Higher 💸 | o1 | Yes (async) |

Both providers return results as formatted markdown with citations saved to `~/research-results/`.

## Command Line Options

```bash
research "Your research question" [OPTIONS]
```

### Options:

| Option | Description | Default |
|--------|-------------|---------|
| `--query-file <path>` | Read query from file instead of CLI | - |
| `--provider <name>` | Provider: `deepseek` or `openai` | `deepseek` |
| `--model <name>` | Specific model to use | provider default |
| `--poll` | Auto-poll until complete (OpenAI only) | true |
| `--poll-interval <sec>` | Seconds between status checks | 10 |
| `--max-polls <n>` | Maximum polling attempts | 180 (~30 min) |
| `--output <path>` | Save markdown report to file | - |
| `--check-status <id>` | Check status of existing request | - |
| `--get-results <id>` | Retrieve results of completed request | - |
| `--verbose` | Show detailed output | false |

### Examples:

```bash
# Quick research with DeepSeek (synchronous)
research "What are neural networks?" --provider deepseek

# Complex research with OpenAI (auto-polls)
research "Analyze recent AI trends" --provider openai --poll

# Read query from file
research --query-file my-query.txt --provider openai --output results.md

# Use specific model
research "Quantum computing basics" --provider openai --model o1-mini

# Check status of running request
research --check-status "deepseek_xyz..." --provider openai

# Retrieve completed results
research --get-results "deepseek_xyz..." --provider openai

# Save output to file
research "Your question" --provider deepseek --output report.md
```

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `OPENAI_API_KEY` | - | OpenAI API authentication (required for OpenAI) |
| `DEEPSEEK_API_KEY` | - | DeepSeek API authentication (required for DeepSeek) |
| `REASONING_DEFAULT_PROVIDER` | `openai` | Default provider when not specified |
| `OPENAI_DEFAULT_MODEL` | `o1` | Default OpenAI model |
| `DEEPSEEK_DEFAULT_MODEL` | `deepseek-reasoner` | Default DeepSeek model |
| `RESEARCH_RESULTS_DIR` | `./research-results/` | Where to save reports |

## Workflow Examples

### Quick Research (DeepSeek - Synchronous)

```bash
# Single command, immediate results
uvx --from ~/.claude/skills/deep-research research \
  "What are the latest breakthroughs in quantum computing?" \
  --provider deepseek

# Results automatically saved to ~/research-results/deepseek_*.md
```

### Complex Research (OpenAI - Async with Auto-Polling)

```bash
# Command auto-polls until complete
uvx --from ~/.claude/skills/deep-research research \
  "Comprehensive analysis of transformer architecture evolution" \
  --provider openai \
  --model o1 \
  --poll-interval 10

# Outputs: markdown report with citations
# Saves to: ~/research-results/openai_*.md
```

### Manual Status Checking

```bash
# Submit request without polling
uvx --from ~/.claude/skills/deep-research research \
  "Your question" \
  --provider openai
# Returns: request_id

# Check status later
uvx --from ~/.claude/skills/deep-research research \
  --check-status <request-id> \
  --provider openai

# Get results when ready
uvx --from ~/.claude/skills/deep-research research \
  --get-results <request-id> \
  --provider openai
```

## Troubleshooting

**"command not found: uvx"**
- Install uvx: `pip install uv` (or follow [uvx installation guide](https://docs.astral.sh/uv/))
- Verify: `uvx --version`

**"API key not configured"**
- Check: `echo $OPENAI_API_KEY` or `echo $DEEPSEEK_API_KEY`
- Set: `export OPENAI_API_KEY="sk-proj-..."` and `export DEEPSEEK_API_KEY="sk-..."`
- Persist in shell config: Add the above lines to `~/.bashrc` or `~/.zshrc`

**"cannot find package or entry point"**
- Ensure skill is in correct location: `~/.claude/skills/deep-research/`
- Verify `pyproject.toml` exists with entry point: `grep "research =" ~/.claude/skills/deep-research/pyproject.toml`
- Try with explicit path: `uvx --from ~/.claude/skills/deep-research research "query"`

**OpenAI request timing out**
- Increase poll interval: `--poll-interval 20` (default: 10 seconds)
- Increase max polls: `--max-polls 360` (default: 180, ~30 minutes)
- Use `--verbose` to see polling progress

**DeepSeek API errors**
- Verify API key is valid: `echo $DEEPSEEK_API_KEY`
- Check rate limits (DeepSeek has usage tiers)
- Try a simpler query to test connectivity

## Requirements

- **uvx** - Install with: `pip install uv`
- **Python 3.10+** - Required for the research script (uvx handles this)
- **API Keys** - Set `OPENAI_API_KEY` and/or `DEEPSEEK_API_KEY`
- **~50MB disk** - For research reports in `~/research-results/`
- **Internet connection** - For API calls to OpenAI or DeepSeek

## See Also

- Repository: `multi-deep-research-mcp` on GitHub
- TypeScript MCP Server (optional): For Claude Desktop integration
- API Documentation: OpenAI Deep Research, DeepSeek API
