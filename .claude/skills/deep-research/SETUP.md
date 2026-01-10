# Deep Research Skill - Setup Guide

## Installation

### Option 1: Skill Only (Recommended for Most Users)

The skill is completely self-contained - you don't need to keep the repo:

```bash
git clone https://github.com/YOUR_GITHUB/multi-deep-research-mcp.git
cp -r multi-deep-research-mcp/.claude/skills/deep-research ~/.claude/skills/
rm -rf multi-deep-research-mcp  # You can delete this - the skill doesn't need it
```

Then set your API keys:
```bash
export OPENAI_API_KEY="sk-proj-your-key"
export DEEPSEEK_API_KEY="sk-your-key"
```

### Option 2: With CLI (If You Want to Use `npx` Commands)

Keep the repository so you can use `npx` commands:

```bash
git clone https://github.com/YOUR_GITHUB/multi-deep-research-mcp.git
cd multi-deep-research-mcp
npm install
npm run build
cp -r .claude/skills/deep-research ~/.claude/skills/
```

Then set your API keys:
```bash
export OPENAI_API_KEY="sk-proj-your-key"
export DEEPSEEK_API_KEY="sk-your-key"
```

Now you can run commands from the repo directory:
```bash
cd /path/to/multi-deep-research-mcp
npx multi-deep-research-cli reasoning_providers_list
npx multi-deep-research-cli research_request_create --query-file query.txt
```

### Option 3: Automated Installation (One-Liner for CLI Users)

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_GITHUB/multi-deep-research-mcp/main/scripts/install.sh | bash
```

This automatically clones, builds, and copies the skill. Then set API keys:
```bash
export OPENAI_API_KEY="sk-proj-your-key"
export DEEPSEEK_API_KEY="sk-your-key"
```

## Configuration

### Step 1: Obtain API Keys

**OpenAI:**
1. Go to https://platform.openai.com/account/api-keys
2. Create a new API key
3. Copy the key

**DeepSeek:**
1. Go to https://platform.deepseek.com/api_keys
2. Create a new API key
3. Copy the key

### Step 2: Set Environment Variables

**Linux/macOS (add to `~/.bashrc`, `~/.zshrc`, or `~/.profile`):**

```bash
export OPENAI_API_KEY="sk-proj-..."
export DEEPSEEK_API_KEY="sk-..."
export REASONING_DEFAULT_PROVIDER="openai"  # or "deepseek"
```

Then reload your shell:
```bash
source ~/.bashrc
```

**Windows (PowerShell):**

```powershell
[Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "sk-proj-...", "User")
[Environment]::SetEnvironmentVariable("DEEPSEEK_API_KEY", "sk-...", "User")
[Environment]::SetEnvironmentVariable("REASONING_DEFAULT_PROVIDER", "openai", "User")
```

**Windows (Command Prompt):**

```cmd
setx OPENAI_API_KEY "sk-proj-..."
setx DEEPSEEK_API_KEY "sk-..."
setx REASONING_DEFAULT_PROVIDER "openai"
```

### Step 3: Verify Setup

```bash
multi-deep-research-cli reasoning_providers_list
```

Expected output:
```json
{
  "status": "success",
  "providers": {
    "openai": {
      "configured": true,
      "available_models": ["o1", "o1-mini", "gpt-4o"]
    },
    "deepseek": {
      "configured": true,
      "available_models": ["deepseek-reasoner"]
    }
  }
}
```

## Claude Code Integration

### Option A: Skills Folder (Recommended)

Copy the skill directory to Claude Code's skills folder:

```bash
# Linux/macOS
cp -r .claude/skills/deep-research ~/.claude/skills/

# Windows
xcopy .claude\skills\deep-research %USERPROFILE%\.claude\skills\ /E
```

The skill will be available immediately on next Claude invocation.

### Option B: Project-Level Skills

If working in this repository, skills in `.claude/skills/` are automatically available to Claude Code when working in this project.

## Troubleshooting Setup

### Issue: "Command not found" or "npx: command not found"

**Solution 1: Verify Node.js and npm are installed**
```bash
node --version  # Should be 18+
npm --version
```

**Solution 2: Reinstall Node.js**
- Download from https://nodejs.org/
- Requires Node.js 18.0.0 or higher

**Solution 3: Make sure you're in the repository directory**
```bash
cd /path/to/multi-deep-research-mcp
npx multi-deep-research-mcp reasoning_providers_list
```

### Issue: "API key not configured"

**Check environment variables:**
```bash
# Linux/macOS
echo $OPENAI_API_KEY
echo $DEEPSEEK_API_KEY

# Windows PowerShell
$env:OPENAI_API_KEY
$env:DEEPSEEK_API_KEY
```

**If empty, set them:**
```bash
export OPENAI_API_KEY="your-key-here"
export DEEPSEEK_API_KEY="your-key-here"
```

### Issue: API key works in terminal but not in Claude

**Reason:** Claude Code runs in a separate environment.

**Solution:** Add to Claude Code environment settings:

1. Create/edit `.claude/settings.json` in your project:
```json
{
  "environment": {
    "OPENAI_API_KEY": "sk-proj-...",
    "DEEPSEEK_API_KEY": "sk-...",
    "REASONING_DEFAULT_PROVIDER": "openai"
  }
}
```

2. Or configure globally in `~/.claude/settings.json`:
```json
{
  "environment": {
    "OPENAI_API_KEY": "sk-proj-...",
    "DEEPSEEK_API_KEY": "sk-..."
  }
}
```

### Issue: "npx: ERR! code ENOENT" or similar

**Solution:** Make sure you're in the correct repository directory:
```bash
# Navigate to the repository
cd /path/to/multi-deep-research-mcp

# Then run commands
npx multi-deep-research-cli reasoning_providers_list
```

## Advanced Configuration

### Custom Provider Endpoints

Point to self-hosted or proxy endpoints:

```bash
export OPENAI_BASE_URL="https://proxy.example.com/openai"
export DEEPSEEK_BASE_URL="https://proxy.example.com/deepseek"
```

### Custom Output Directory

Change where research reports are saved:

```bash
export RESEARCH_RESULTS_DIR="/path/to/reports/"
```

### Default Model Selection

Set preferred models:

```bash
export OPENAI_DEFAULT_MODEL="o1-mini"  # Faster, cheaper
export DEEPSEEK_DEFAULT_MODEL="deepseek-reasoner"
```

### Favorite Models

Restrict available models:

```bash
export OPENAI_FAVORITE_MODELS="o1,o1-mini"
export DEEPSEEK_FAVORITE_MODELS="deepseek-reasoner"
```

## Next Steps

1. **Test a simple research request:**
   ```bash
   echo "What are the latest advances in quantum computing?" > query.txt
   multi-deep-research-cli research_request_create \
     --query-file query.txt \
     --provider deepseek
   ```

2. **Review the [SKILL.md](SKILL.md) for usage examples**

3. **Check [REFERENCE.md](REFERENCE.md) for detailed API docs**

4. **Start using with Claude Code or any agent!**
