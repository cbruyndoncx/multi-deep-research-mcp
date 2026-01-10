# Skills Integration Guide

How to use and distribute the multi-deep-research MCP repository with Claude Code skills.

## Quick Start (5 minutes)

### 1. Install the CLI

```bash
npm install -g multi-deep-research-mcp
```

### 2. Add Your API Keys

```bash
export OPENAI_API_KEY="sk-proj-..."
export DEEPSEEK_API_KEY="sk-..."
```

### 3. Copy Skills to Claude Code

```bash
cp -r .claude/skills/deep-research ~/.claude/skills/
```

### 4. Verify Setup

```bash
# Check CLI works
npx multi-deep-research-cli reasoning_providers_list

# Restart Claude Code
# Now you can use the deep-research skill!
```

## Repository Structure for Skills

This repository is organized to be a complete, self-contained skill package:

```
multi-deep-research-mcp/
│
├── src/                          # MCP Server & CLI implementation
│   ├── server.ts                 # MCP server (for Claude Desktop)
│   ├── cli.ts                    # CLI binary (for skills & scripts)
│   ├── handlers.ts               # Core business logic
│   ├── providers/                # Research providers (OpenAI, DeepSeek)
│   ├── clients/                  # API clients
│   └── utils/                    # Utilities
│
├── .claude/                      # Claude Code configuration
│   ├── ARCHITECTURE.md           # Complete architecture guide
│   ├── SKILLS_INTEGRATION.md     # This file
│   └── skills/
│       ├── README.md             # Skills overview
│       └── deep-research/        # ← Main skill package
│           ├── SKILL.md          # Skill definition (required)
│           ├── SETUP.md          # Installation guide
│           ├── REFERENCE.md      # API reference
│           └── EXAMPLES.md       # Usage examples
│
├── scripts/                      # Helper scripts
│   └── multi_deep_research_cli_agent.sh
│
├── tests/                        # Test suite
├── package.json                  # npm configuration
├── README.md                     # User documentation
├── AGENTS.md                     # Developer guide
└── tsconfig.json
```

## How Skills Integrate

### 1. Skill Discovery

Claude Code finds skills by reading:
- **Personal skills**: `~/.claude/skills/*/SKILL.md`
- **Project skills**: `.claude/skills/*/SKILL.md` (this repo)

### 2. Skill Invocation

When you invoke `/deep-research` or mention "research", Claude:
1. Reads `SKILL.md` instructions
2. Runs CLI commands: `npx multi-deep-research-cli research_request_create ...`
3. Processes results and displays them

### 3. CLI Execution

The CLI binary is called with:
```bash
npx multi-deep-research-cli <command> [flags]
```

This works because:
- Package is installed globally: `npm install -g`
- CLI is compiled to `dist/cli.js`
- Package.json has `bin` configuration pointing to it

## Distribution Options

### Option A: Users Clone Repository

**For open-source distribution:**

```bash
# User clones your repo
git clone https://github.com/yourname/multi-deep-research-mcp.git
cd multi-deep-research-mcp

# Install locally
npm install
npm run build

# Or install globally
npm install -g .

# Copy skill
cp -r .claude/skills/deep-research ~/.claude/skills/
```

**Pros:** Full control, easy to develop on
**Cons:** Users must clone, may see development branches

### Option B: Users Install from npm

**For distribution as a published package:**

```bash
# User installs from npm registry
npm install -g multi-deep-research-mcp

# Skill files included in published package
# User copies skill:
cp -r $(npm config get prefix)/lib/node_modules/multi-deep-research-mcp/.claude/skills/deep-research ~/.claude/skills/

# Or download from your docs
```

**Pros:** Clean installation, easier for non-developers
**Cons:** Must maintain npm registry

### Option C: Users Download Skill Directory Only

**For minimal setup:**

```bash
# User downloads just the skill folder
# (e.g., zip from releases, or curl from GitHub)

curl -L https://github.com/yourname/multi-deep-research-mcp/releases/download/v1.0/skills.zip -o skills.zip
unzip skills.zip -d ~/.claude/skills/

# But still need to install CLI separately
npm install -g multi-deep-research-mcp
```

**Pros:** Very lightweight
**Cons:** Skills don't work without CLI package

## Key Files for Skills

### SKILL.md (Required)

Contains:
- **Metadata** (YAML frontmatter):
  - `name` - Skill identifier
  - `description` - When Claude should use this skill
  - `allowed-tools` - Which tools Claude can use (Bash, Read, etc.)
- **Instructions** - How Claude should invoke the CLI

**Location:** `.claude/skills/deep-research/SKILL.md`

### Supporting Documentation

Optional but recommended:
- **SETUP.md** - Installation and configuration
- **REFERENCE.md** - Complete API documentation
- **EXAMPLES.md** - Practical usage examples

These are loaded on-demand by Claude, keeping SKILL.md focused.

## Environment Configuration

### For CLI Usage

Set environment variables in your shell:

```bash
export OPENAI_API_KEY="sk-proj-..."
export DEEPSEEK_API_KEY="sk-..."
```

### For Claude Code Usage

Claude Code may need environment configured in `.claude/settings.json`:

**Project-level** (`.claude/settings.json`):
```json
{
  "environment": {
    "OPENAI_API_KEY": "sk-proj-...",
    "DEEPSEEK_API_KEY": "sk-..."
  }
}
```

**User-level** (`~/.claude/settings.json`):
```json
{
  "environment": {
    "OPENAI_API_KEY": "sk-proj-...",
    "DEEPSEEK_API_KEY": "sk-..."
  }
}
```

## Publishing Checklist

If you're publishing this repository:

- [ ] **Update README.md** with your instructions
- [ ] **Review SKILL.md** for clarity and accuracy
- [ ] **Test locally:**
  ```bash
  cp -r .claude/skills/deep-research ~/.claude/skills/deep-research-test/
  # Manually test in Claude Code
  ```
- [ ] **Update package.json** with your details
- [ ] **Add CI/CD tests** (.github/workflows)
- [ ] **Create releases** with clear version numbers
- [ ] **Add installation instructions** to README
- [ ] **Document environment setup** in SETUP.md

## Extending with More Skills

To add more skills to this repository:

### 1. Create Skill Directory

```bash
mkdir -p .claude/skills/new-skill-name/
```

### 2. Create SKILL.md

```markdown
---
name: new-skill-name
description: What this skill does and when to use it
allowed-tools: Bash, Read, Write
---

# Skill Title

Instructions for Claude...
```

### 3. Add Supporting Docs

- SETUP.md (if there's setup needed)
- REFERENCE.md (for detailed API)
- EXAMPLES.md (for common patterns)

### 4. Update Skills README

Add entry to `.claude/skills/README.md` listing the new skill

**Example:** Add a skill for batch processing research:

```
.claude/skills/
├── deep-research/        # Interactive research
└── batch-research/       # Automated batch processing
    ├── SKILL.md
    ├── SETUP.md
    └── EXAMPLES.md
```

## Troubleshooting

### Skill Doesn't Appear in Claude Code

**Checklist:**
- [ ] File is at `~/.claude/skills/deep-research/SKILL.md`
- [ ] YAML frontmatter is valid (no invalid characters)
- [ ] File is named exactly `SKILL.md` (uppercase)
- [ ] Claude Code has been restarted
- [ ] Description mentions relevant keywords

### CLI Not Found When Skill Runs

**Solution:**
```bash
# Verify global installation
npm list -g multi-deep-research-mcp

# Reinstall if needed
npm install -g multi-deep-research-mcp@latest

# Or rebuild if installed from repo
cd /path/to/repo && npm install && npm run build
npm install -g .
```

### API Keys Not Working

**Try setting in .claude/settings.json:**

```json
{
  "environment": {
    "OPENAI_API_KEY": "sk-proj-your-key",
    "DEEPSEEK_API_KEY": "sk-your-key"
  }
}
```

**Or check environment in skill:**

Add to your skill debugging:
```bash
# This will output your env vars in the response
echo "OPENAI_API_KEY=${OPENAI_API_KEY:0:10}..."
```

### Skill Triggers Too Often/Not Often Enough

**Edit description in SKILL.md:**

Too often? → Make description more specific
Not often enough? → Add more keywords Claude might use

## Best Practices

### For Users

1. **Always set API keys** before using skills
2. **Test CLI directly** before blaming the skill
3. **Keep CLI updated** with `npm install -g -u multi-deep-research-mcp`
4. **Read SETUP.md** for your system (Windows/Mac/Linux differences)

### For Developers

1. **Keep SKILL.md concise** - Put details in REFERENCE.md
2. **Test skill invocation locally** before publishing
3. **Document all environment variables** in SETUP.md
4. **Provide examples** in EXAMPLES.md for common use cases
5. **Handle errors gracefully** - Provide helpful error messages in skills
6. **Version your changes** - Use semantic versioning

## Integration with Other MCP Servers

This repository can coexist with other MCP servers:

**Claude Desktop config:**
```json
{
  "mcpServers": {
    "multi-deep-research": {
      "command": "node",
      "args": ["/path/to/dist/server.js"],
      "env": {
        "OPENAI_API_KEY": "sk-proj-..."
      }
    },
    "other-server": {
      "command": "node",
      "args": ["/path/to/other/dist/index.js"]
    }
  }
}
```

Both MCP servers and skills can work together - use the one that fits your workflow best!

## See Also

- [.claude/skills/README.md](.claude/skills/README.md) - Skills overview
- [.claude/skills/deep-research/SKILL.md](.claude/skills/deep-research/SKILL.md) - Main skill
- [.claude/ARCHITECTURE.md](.claude/ARCHITECTURE.md) - System architecture
- [README.md](README.md) - User guide
- [AGENTS.md](AGENTS.md) - Developer guide
