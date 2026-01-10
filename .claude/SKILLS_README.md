# Claude Code Skills for multi-deep-research-mcp

Your repository is now fully organized as a complete skill package ready to be dropped into Claude Code.

## 📁 What Was Created

```
.claude/
├── ARCHITECTURE.md              ← System architecture overview
├── SKILLS_INTEGRATION.md        ← This integration guide
├── SKILLS_README.md             ← (This file)
└── skills/
    ├── README.md                ← Skills directory overview
    └── deep-research/           ← THE MAIN SKILL
        ├── SKILL.md             ← ⭐ Skill definition (required)
        ├── SETUP.md             ← Installation & configuration
        ├── REFERENCE.md         ← Complete API reference
        └── EXAMPLES.md          ← 10+ practical examples
```

## 🚀 Quickest Setup (2 minutes)

**For the skill only - no extra files needed:**

```bash
# Clone and copy the skill folder
git clone https://github.com/YOUR_GITHUB/multi-deep-research-mcp.git
cp -r multi-deep-research-mcp/.claude/skills/deep-research ~/.claude/skills/

# Delete the cloned folder (optional - you don't need it)
rm -rf multi-deep-research-mcp

# Set API keys
export OPENAI_API_KEY="sk-proj-your-key-here"
export DEEPSEEK_API_KEY="sk-your-key-here"
```

Restart Claude Code and you're done! Use `/deep-research` or mention "research" naturally.

---

## 🚀 With CLI Option (One-Line)

**If you also want to use the CLI with `npx` commands:**

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_GITHUB/multi-deep-research-mcp/main/scripts/install.sh | bash
export OPENAI_API_KEY="sk-proj-your-key-here"
export DEEPSEEK_API_KEY="sk-your-key-here"
```

This keeps the repo so you can run:
```bash
cd ~/.multi-deep-research-mcp
npx multi-deep-research-cli research_request_create --query-file query.txt
```

---

## 🚀 Full Manual Setup

### Step 1: Verify Prerequisites

Ensure you have Node.js 18+ installed:
```bash
node --version  # Should be v18.0.0 or higher
```

### Step 2: Configure API Keys

```bash
export OPENAI_API_KEY="sk-proj-your-key-here"
export DEEPSEEK_API_KEY="sk-your-key-here"
```

### Step 3: Clone the Repository

```bash
git clone <repo-url>
cd multi-deep-research-mcp
npm install
npm run build
```

### Step 4: Copy Skill to Claude Code

```bash
# Copy the skill to your personal skills folder
cp -r .claude/skills/deep-research ~/.claude/skills/

# Or keep it in this repo for team access
# (.claude/skills/ is automatically found by Claude Code)
```

### Step 5: Verify Setup

```bash
# Test CLI works (from the repo directory)
npx multi-deep-research-cli reasoning_providers_list

# Restart Claude Code
# Now try using /deep-research or mentioning research naturally!
```

## 📚 Documentation Structure

Your repository now has organized documentation at multiple levels:

### For Users (Skill Documentation)

Start here if you want to **use** the skill:

1. **[.claude/skills/deep-research/SETUP.md](skills/deep-research/SETUP.md)**
   - Installation instructions
   - API key configuration
   - Environment setup for your OS (Windows/Mac/Linux)
   - Troubleshooting common setup issues

2. **[.claude/skills/deep-research/SKILL.md](skills/deep-research/SKILL.md)**
   - Quick start guide
   - Command reference for all 5 operations
   - Provider comparison (DeepSeek vs OpenAI)
   - Basic workflow examples

3. **[.claude/skills/deep-research/EXAMPLES.md](skills/deep-research/EXAMPLES.md)**
   - 10+ practical examples
   - Scripts for common tasks
   - Batch processing patterns
   - Provider comparison workflows
   - Error handling examples

4. **[.claude/skills/deep-research/REFERENCE.md](skills/deep-research/REFERENCE.md)**
   - Complete API documentation
   - All parameters and response formats
   - Environment variable reference
   - Performance considerations

### For Developers (Architecture & Integration)

Start here if you want to **understand** or **extend** the system:

1. **[.claude/ARCHITECTURE.md](ARCHITECTURE.md)** (Recommended First Read)
   - System overview with diagrams
   - How MCP Server, CLI, and Skills interact
   - Data flow examples for each interface
   - Request lifecycle (DeepSeek vs OpenAI)
   - Performance characteristics
   - Adding new providers

2. **[.claude/SKILLS_INTEGRATION.md](SKILLS_INTEGRATION.md)**
   - Distribution options (npm, repo, zip)
   - How skills discovery works
   - Publishing checklist
   - Adding more skills to the repository
   - Integration with other MCP servers

3. **[.claude/skills/README.md](skills/README.md)**
   - Skills folder overview
   - Installation options
   - Quick integration checklist

### For the Whole Project

- **[README.md](../README.md)** - Main user guide
- **[AGENTS.md](../AGENTS.md)** - Developer guidelines
- **[package.json](../package.json)** - npm configuration

## 🎯 Three Ways to Use This Repository

### 1. As a Skill for Claude Code (Recommended for Users)

```bash
npm install -g multi-deep-research-mcp
cp -r .claude/skills/deep-research ~/.claude/skills/
export OPENAI_API_KEY="sk-..."
export DEEPSEEK_API_KEY="sk-..."
# Now use /deep-research or mention research naturally
```

### 2. As an MCP Server for Claude Desktop

Add to Claude Desktop config:
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

### 3. As a CLI Tool for Scripts

```bash
npm install -g multi-deep-research-mcp

# Use in scripts
multi-deep-research-cli research_request_create \
  --query-file query.txt \
  --provider deepseek

# Or in loops, pipelines, etc.
for query in queries/*.txt; do
  multi-deep-research-cli research_request_create --query-file "$query"
done
```

## 📋 Quick Navigation

### I want to...

**Use the skill:**
→ Start with [SETUP.md](skills/deep-research/SETUP.md)

**See usage examples:**
→ Check [EXAMPLES.md](skills/deep-research/EXAMPLES.md)

**Know all the parameters:**
→ Read [REFERENCE.md](skills/deep-research/REFERENCE.md)

**Understand how everything works:**
→ Read [ARCHITECTURE.md](ARCHITECTURE.md)

**Publish this as a package:**
→ Follow [SKILLS_INTEGRATION.md](SKILLS_INTEGRATION.md)

**Add another skill:**
→ See section in [SKILLS_INTEGRATION.md](SKILLS_INTEGRATION.md)

**Configure environment variables:**
→ See SETUP.md environment section

**Troubleshoot an issue:**
→ Check the Troubleshooting section in relevant doc

## ✨ Key Features of This Setup

✅ **Self-Contained** - Everything in one repo, ready to drop in
✅ **Well-Documented** - Docs for users, developers, and operators
✅ **Multi-Level** - Works as MCP server, CLI, and skill
✅ **Team-Friendly** - Can commit `.claude/` folder to git
✅ **Easy Distribution** - Can be published to npm and/or distributed as package
✅ **Extensible** - Template for adding more skills
✅ **Best Practices** - Follows Claude Code skill conventions

## 🔧 Customization

### Add Your Own Skills

To add another skill to this repository:

```bash
mkdir -p .claude/skills/my-skill/
# Create SKILL.md with your definition
cp .claude/skills/deep-research/SKILL.md .claude/skills/my-skill/SKILL.md
# Edit it to match your new skill
```

### Change Skill Description

Edit [.claude/skills/deep-research/SKILL.md](skills/deep-research/SKILL.md) line 3:
```yaml
description: Your custom description here - use keywords Claude will recognize
```

### Add Environment Variables

Update SETUP.md with any new environment variables and their purpose.

## 📦 Distribution

### Option 1: Let users clone your repo
Users can clone and copy the skill folder:
```bash
git clone your-repo
cp -r your-repo/.claude/skills/deep-research ~/.claude/skills/
```

### Option 2: Publish to npm
Then users can:
```bash
npm install -g multi-deep-research-mcp
# Copy skills from installed package
```

### Option 3: Distribute as zip
Include skill folder in releases for easy download

## 🎓 Next Steps

1. **Read [ARCHITECTURE.md](ARCHITECTURE.md)** for system overview (10 min read)

2. **Follow [SETUP.md](skills/deep-research/SETUP.md)** to install (5 min)

3. **Try [EXAMPLES.md](skills/deep-research/EXAMPLES.md)** to test (10 min)

4. **Explore [REFERENCE.md](skills/deep-research/REFERENCE.md)** for complete API (as needed)

5. **Read [SKILLS_INTEGRATION.md](SKILLS_INTEGRATION.md)** if publishing/extending (15 min)

## ❓ FAQ

**Q: Do I need both MCP server and skills?**
A: No! Choose what works for you:
- Skills are easiest for Claude Code users
- MCP server is best for Claude Desktop
- CLI is best for scripting

**Q: Can I use both together?**
A: Yes! They're complementary and can coexist.

**Q: Where should I commit `.claude/`?**
A: Yes! Include it in git so teammates have access to skills.

**Q: How do I get API keys?**
A: See [SETUP.md](skills/deep-research/SETUP.md) - has links to both providers.

**Q: Can I add more skills?**
A: Absolutely! Follow the template in [SKILLS_INTEGRATION.md](SKILLS_INTEGRATION.md).

**Q: Is this secure?**
A: API keys should never be committed to git. Use environment variables or `.claude/settings.json` instead.

## 📞 Support

Check the troubleshooting sections in:
- [SETUP.md](skills/deep-research/SETUP.md) - Setup issues
- [SKILL.md](skills/deep-research/SKILL.md) - Usage questions
- [REFERENCE.md](skills/deep-research/REFERENCE.md) - API details
- [ARCHITECTURE.md](ARCHITECTURE.md) - System understanding

---

**You're all set!** Your repository is now a complete, well-documented skill package ready for Claude Code.

Start by reading [ARCHITECTURE.md](ARCHITECTURE.md) to understand how everything fits together. 🚀
