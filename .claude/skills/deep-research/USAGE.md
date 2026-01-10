# Deep Research - Quick Usage Guide

## Call the Script with uvx

### One-time Setup

```bash
# Install uvx (if not already installed)
pip install uv

# Set your API keys (add to ~/.bashrc or ~/.zshrc to persist)
export OPENAI_API_KEY="sk-proj-..."
export DEEPSEEK_API_KEY="sk-..."
```

### Basic Commands

All commands use this pattern:
```bash
uvx --from ~/.claude/skills/deep-research research [OPTIONS] [QUERY]
```

### Quick Examples

**Quick research (DeepSeek - immediate)**
```bash
uvx --from ~/.claude/skills/deep-research research \
  "What is machine learning?"
```

**Research with OpenAI (auto-polls)**
```bash
uvx --from ~/.claude/skills/deep-research research \
  "Explain quantum computing" \
  --provider openai \
  --poll
```

**Read query from file, save output to file**
```bash
uvx --from ~/.claude/skills/deep-research research \
  --query-file query.txt \
  --output results.md \
  --provider openai \
  --poll
```

**Check status of running request**
```bash
uvx --from ~/.claude/skills/deep-research research \
  --check-status request_12345 \
  --provider openai
```

**Retrieve results of completed request**
```bash
uvx --from ~/.claude/skills/deep-research research \
  --get-results request_12345 \
  --provider openai
```

## Create an Alias (Optional - Easier Typing)

Add this to your `~/.bashrc` or `~/.zshrc`:

```bash
alias research='uvx --from ~/.claude/skills/deep-research research'
```

Then use it like:
```bash
research "your query" --provider deepseek --output report.md
```

## All Available Options

```
positional arguments:
  query                 Research query

options:
  --query-file FILE     Read query from file instead of command line
  --provider PROVIDER   Provider: openai, deepseek (default: deepseek)
  --model MODEL         Specific model (uses provider default if not specified)
  --poll                Auto-poll until complete (OpenAI only)
  --poll-interval SEC   Seconds between status checks (default: 10)
  --max-polls N         Maximum polling attempts (default: 180)
  --output FILE         Save markdown report to file
  --check-status ID     Check status of existing request
  --get-results ID      Retrieve results of completed request
  --verbose             Show detailed output
```

## Environment Variables

```bash
OPENAI_API_KEY          # OpenAI API key (required for OpenAI)
DEEPSEEK_API_KEY        # DeepSeek API key (required for DeepSeek)
REASONING_DEFAULT_PROVIDER  # Default provider (default: deepseek)
OPENAI_DEFAULT_MODEL    # Default OpenAI model (default: o1)
DEEPSEEK_DEFAULT_MODEL  # Default DeepSeek model (default: deepseek-reasoner)
RESEARCH_RESULTS_DIR    # Where to save reports (default: ~/research-results/)
```

## Examples with Explanations

### Example 1: Simple Query
```bash
uvx --from ~/.claude/skills/deep-research research "What is AI?"
# Uses DeepSeek (default), prints results, saves to ~/research-results/
```

### Example 2: File Input + File Output
```bash
# Create query file
echo "Analyze the history of neural networks" > my_query.txt

# Run with files
uvx --from ~/.claude/skills/deep-research research \
  --query-file my_query.txt \
  --output analysis.md \
  --provider openai \
  --poll
```

### Example 3: Long-running OpenAI Research
```bash
uvx --from ~/.claude/skills/deep-research research \
  "Comprehensive analysis of recent breakthroughs in AI" \
  --provider openai \
  --model o1 \
  --poll \
  --poll-interval 15 \
  --max-polls 240 \
  --output research.md
# Polls every 15 seconds for up to 4 hours
```

### Example 4: Manual Polling
```bash
# Submit research (doesn't wait)
uvx --from ~/.claude/skills/deep-research research \
  "Your complex question" \
  --provider openai
# Returns: request_xyz

# Later, check status
uvx --from ~/.claude/skills/deep-research research \
  --check-status request_xyz \
  --provider openai

# When ready, get results
uvx --from ~/.claude/skills/deep-research research \
  --get-results request_xyz \
  --provider openai \
  --output results.md
```

## Troubleshooting

**"command not found: uvx"**
- Install: `pip install uv` and try again

**"API key not configured"**
- Check: `echo $OPENAI_API_KEY`
- Set: `export OPENAI_API_KEY="your-key"`

**"cannot find package or entry point"**
- Verify skill location: `ls -la ~/.claude/skills/deep-research/`
- Verify `pyproject.toml` exists

**Results timing out**
- Increase `--poll-interval` and `--max-polls`
- Use `--verbose` to see what's happening

## Tips

1. **Use aliases** for shorter commands:
   ```bash
   alias research='uvx --from ~/.claude/skills/deep-research research'
   research "query" --provider deepseek
   ```

2. **Use files for long queries** to avoid shell escaping issues:
   ```bash
   research --query-file query.txt
   ```

3. **Save results to file** for processing later:
   ```bash
   research "query" --output report.md
   ```

4. **Use verbose mode** for debugging:
   ```bash
   research "query" --verbose
   ```

5. **Use DeepSeek for speed**, OpenAI for complex reasoning:
   - Quick answers: `--provider deepseek`
   - Deep analysis: `--provider openai --model o1`
