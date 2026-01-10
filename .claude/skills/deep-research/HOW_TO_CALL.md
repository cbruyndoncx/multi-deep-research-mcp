# How to Call the Research Scripts

## The Simple Answer

Use `uvx` with the `--from` flag pointing to the skill directory:

```bash
uvx --from ~/.claude/skills/deep-research research "your query" --provider deepseek
```

That's it! No installation needed.

---

## Full Setup (5 minutes)

### Step 1: One-time Installation
```bash
pip install uv
```

### Step 2: Add API Keys to Shell Config

Add to `~/.bashrc` or `~/.zshrc`:
```bash
export OPENAI_API_KEY="your-key-here"
export DEEPSEEK_API_KEY="your-key-here"
```

Then:
```bash
source ~/.bashrc  # or ~/.zshrc
```

### Step 3: Verify Setup
```bash
# Test the command
uvx --from ~/.claude/skills/deep-research research --help
```

### Step 4: Create Alias (Optional)

Add to `~/.bashrc` or `~/.zshrc`:
```bash
alias research='uvx --from ~/.claude/skills/deep-research research'
```

Then use simply:
```bash
research "your query"
```

---

## How It Works

The structure is:
```
~/.claude/skills/deep-research/
├── src/
│   └── deep_research/
│       ├── research.py         (Main entry point)
│       ├── providers/          (OpenAI, DeepSeek implementations)
│       └── shared/             (Base classes, utilities)
└── pyproject.toml              (Configuration with entry point)
```

When you run:
```bash
uvx --from ~/.claude/skills/deep-research research "query"
```

uvx:
1. Reads `pyproject.toml` from `~/.claude/skills/deep-research/`
2. Finds the entry point: `research = "deep_research.research:main"`
3. Installs dependencies (httpx) in an isolated environment
4. Runs the `main()` function from `src/deep_research/research.py`
5. Passes your arguments to the script

---

## Command Reference

### Basic Syntax
```bash
uvx --from ~/.claude/skills/deep-research research [QUERY] [OPTIONS]
```

### Most Common Commands

**Quick research (DeepSeek)**
```bash
uvx --from ~/.claude/skills/deep-research research "What is X?"
```

**Complex research (OpenAI with polling)**
```bash
uvx --from ~/.claude/skills/deep-research research \
  "Explain X in detail" \
  --provider openai \
  --poll
```

**Read from file, save to file**
```bash
uvx --from ~/.claude/skills/deep-research research \
  --query-file input.txt \
  --output output.md \
  --provider openai \
  --poll
```

**Check status of running request**
```bash
uvx --from ~/.claude/skills/deep-research research \
  --check-status request_123 \
  --provider openai
```

**Get results of completed request**
```bash
uvx --from ~/.claude/skills/deep-research research \
  --get-results request_123 \
  --provider openai
```

---

## Options Reference

| Option | Purpose | Example |
|--------|---------|---------|
| `--query-file FILE` | Read query from file | `--query-file query.txt` |
| `--provider {openai,deepseek}` | Choose provider | `--provider openai` |
| `--model MODEL` | Specific model to use | `--model o1-mini` |
| `--poll` | Auto-poll until complete | `--poll` |
| `--poll-interval N` | Seconds between polls (default: 10) | `--poll-interval 15` |
| `--max-polls N` | Max poll attempts (default: 180) | `--max-polls 360` |
| `--output FILE` | Save report to file | `--output report.md` |
| `--check-status ID` | Check request status | `--check-status xyz` |
| `--get-results ID` | Get completed results | `--get-results xyz` |
| `--verbose` | Show detailed output | `--verbose` |

---

## Use in Claude Code Skill

The skill is designed to be called from Claude Code:

```
/deep-research "What are the latest AI trends?" --provider deepseek
```

This internally runs:
```bash
uvx --from ~/.claude/skills/deep-research research "What are the latest AI trends?" --provider deepseek
```

---

## Using with Alias (Recommended)

Create a shorter alias for easier typing:

```bash
# Add to ~/.bashrc or ~/.zshrc
alias research='uvx --from ~/.claude/skills/deep-research research'
```

Then use it like:
```bash
research "What is quantum computing?"
research --query-file query.txt --output results.md --provider openai --poll
research --check-status abc123 --provider openai
```

---

## Troubleshooting

**"command not found: uvx"**
```bash
pip install uv
```

**"cannot find package"**
- Verify path: `ls ~/.claude/skills/deep-research/pyproject.toml`
- Should exist at: `~/.claude/skills/deep-research/`

**"API key not configured"**
```bash
export OPENAI_API_KEY="your-key"
export DEEPSEEK_API_KEY="your-key"
# Or add to ~/.bashrc / ~/.zshrc
```

**"cannot find entry point 'research'"**
- Check `pyproject.toml`: `grep research ~/.claude/skills/deep-research/pyproject.toml`
- Should contain: `research = "deep_research.research:main"`

---

## Summary

**TL;DR:**

1. `pip install uv` (one-time)
2. Set API keys in environment
3. Run: `uvx --from ~/.claude/skills/deep-research research "query"`
4. Optional: Create alias `alias research='uvx --from ~/.claude/skills/deep-research research'`
5. Use: `research "query" --provider deepseek`

No pip install of the skill needed. uvx handles everything!
