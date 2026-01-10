# Installation Guide

Quick installation methods for multi-deep-research-mcp.

## ⚡ Fastest Method: One-Line Install

If you want both the **skill** AND the **CLI**:

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_GITHUB/multi-deep-research-mcp/main/scripts/install.sh | bash
```

This will:
1. Check Node.js 18+ is installed
2. Clone the repository to `~/.multi-deep-research-mcp`
3. Install dependencies and build
4. Copy the skill to Claude Code
5. Verify installation

**Then set your API keys:**
```bash
export OPENAI_API_KEY="sk-proj-your-key"
export DEEPSEEK_API_KEY="sk-your-key"
```

**Restart Claude Code and you're done!**

---

## ⚡ Minimal Setup: Skill Only

If you **only want the Claude Code skill** (recommended for most users):

```bash
# 1. Clone just to get the skill files
git clone https://github.com/YOUR_GITHUB/multi-deep-research-mcp.git
cd multi-deep-research-mcp

# 2. Copy the skill folder (that's all you need)
cp -r .claude/skills/deep-research ~/.claude/skills/

# 3. Set API keys
export OPENAI_API_KEY="sk-proj-your-key"
export DEEPSEEK_API_KEY="sk-your-key"

# 4. Restart Claude Code - done!
```

You can delete the cloned folder after copying the skill - **the skill folder is completely standalone**.

---

## 📝 Manual Installation

### Step 1: Prerequisites

Ensure Node.js 18+ is installed:
```bash
node --version  # Should be v18.0.0 or higher
```

Download from https://nodejs.org/ if needed.

### Step 2: Clone Repository

```bash
git clone https://github.com/YOUR_GITHUB/multi-deep-research-mcp.git
cd multi-deep-research-mcp
```

### Step 3: Install Dependencies

```bash
npm install
npm run build
```

### Step 4: Copy Skill to Claude Code

```bash
cp -r .claude/skills/deep-research ~/.claude/skills/
```

### Step 5: Configure API Keys

```bash
export OPENAI_API_KEY="sk-proj-your-key"
export DEEPSEEK_API_KEY="sk-your-key"
```

### Step 6: Verify Installation

```bash
npx multi-deep-research-cli reasoning_providers_list
```

### Step 7: Restart Claude Code

Restart Claude Code to load the new skill.

---

## 🐳 Docker Installation (Optional)

If you want to run the MCP server in Docker:

```dockerfile
FROM node:18-alpine

WORKDIR /app

RUN git clone https://github.com/YOUR_GITHUB/multi-deep-research-mcp.git .
RUN npm install
RUN npm run build

ENV OPENAI_API_KEY=""
ENV DEEPSEEK_API_KEY=""

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

---

## 🔄 Updating Installation

### If you used the one-liner install:

```bash
cd ~/.multi-deep-research-mcp
git pull
npm install
npm run build
```

### If you manually cloned:

```bash
cd /path/to/multi-deep-research-mcp
git pull
npm install
npm run build
```

---

## ❓ Troubleshooting Installation

### "Node.js not found"
- Install Node.js 18+ from https://nodejs.org/
- Verify: `node --version`

### "git: command not found"
- Install Git from https://git-scm.com/
- Or download the repository as ZIP and extract it

### "npm install fails"
- Try clearing npm cache: `npm cache clean --force`
- Then retry: `npm install`

### "Permission denied" on install.sh
- Make it executable: `chmod +x scripts/install.sh`
- Then run: `bash scripts/install.sh`

### "Skill doesn't appear in Claude Code"
- Verify it was copied: `ls ~/.claude/skills/deep-research/SKILL.md`
- Restart Claude Code completely
- Check `.claude/SKILLS_README.md` for troubleshooting

### "npx: command not found"
- Ensure Node.js is installed: `node --version`
- Try: `npm list -g npm`
- May need to restart your terminal after Node.js installation

---

## 📦 Installation Locations

After installation, you'll have:

| Location | Purpose |
|----------|---------|
| `~/.multi-deep-research-mcp/` | Repository with source code |
| `~/.claude/skills/deep-research/` | Skill files (for Claude Code) |

You can delete the repository folder if you only want the skill, but you'll need it to run commands with `npx`.

---

## 🔐 Securing API Keys

### Option 1: Environment Variables (Recommended)

```bash
export OPENAI_API_KEY="sk-proj-..."
export DEEPSEEK_API_KEY="sk-..."
```

### Option 2: .env File (Local Development)

Create `.env` in the repository:
```
OPENAI_API_KEY=sk-proj-...
DEEPSEEK_API_KEY=sk-...
```

**Never commit `.env` to git!**

### Option 3: Claude Code Settings

Edit `~/.claude/settings.json`:
```json
{
  "environment": {
    "OPENAI_API_KEY": "sk-proj-...",
    "DEEPSEEK_API_KEY": "sk-..."
  }
}
```

---

## 📚 Next Steps

1. **Read the Setup Guide:** `.claude/skills/deep-research/SETUP.md`
2. **Try Examples:** `.claude/skills/deep-research/EXAMPLES.md`
3. **Learn the API:** `.claude/skills/deep-research/REFERENCE.md`
4. **Understand System:** `.claude/ARCHITECTURE.md`

---

## 🆘 Need Help?

- Check the troubleshooting sections in the docs
- Review examples in `.claude/skills/deep-research/EXAMPLES.md`
- See common issues in `.claude/skills/deep-research/SETUP.md`
