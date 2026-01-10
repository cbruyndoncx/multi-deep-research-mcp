# Claude Code Skills

This directory contains reusable Claude Code skills for the multi-deep-research-mcp project.

## Available Skills

### deep-research
**Primary skill for conducting research with OpenAI and DeepSeek reasoning models.**

- **Skill Name:** `deep-research`
- **Files:**
  - `deep-research/SKILL.md` - Main skill definition and usage guide
  - `deep-research/SETUP.md` - Installation and configuration instructions
  - `deep-research/REFERENCE.md` - Complete API reference documentation

**Quick Start:**
```bash
# 1. Copy skill to Claude Code
cp -r deep-research ~/.claude/skills/

# 2. Set up API keys
export OPENAI_API_KEY="your-key"
export DEEPSEEK_API_KEY="your-key"

# 3. Start using with Claude!
```

## Installation Options

### Option A: Copy to Personal Skills Folder (All Projects)
```bash
cp -r deep-research ~/.claude/skills/
```
Available across all Claude Code projects.

### Option B: Keep in Project (Team Collaboration)
Leave in `.claude/skills/` - automatically available when working in this repository.
Commit to git so team members have it.

### Option C: Distribute as Package
When published to npm:
```bash
npm install -g multi-deep-research-mcp
```
Users can then copy skills folder to their Claude setup.

## Directory Structure

```
.claude/skills/
├── README.md                    # This file
└── deep-research/
    ├── SKILL.md                 # Skill definition (required)
    ├── SETUP.md                 # Setup & installation guide
    └── REFERENCE.md             # Complete API docs
```

## How Skills Work

1. **Claude discovers skills** by reading `SKILL.md` in `~/.claude/skills/` and `.claude/skills/`
2. **Claude reads the metadata** (name, description) to know when to suggest the skill
3. **When invoked**, Claude executes the instructions in the skill
4. **The skill wraps CLI commands** that call `multi-deep-research-cli`

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **yarn** for package management
- **API Keys:**
  - OpenAI API key (for OpenAI models)
  - DeepSeek API key (for DeepSeek models)
- **CLI installed:**
  ```bash
  npm install -g multi-deep-research-mcp
  ```

## Quick Integration Checklist

- [ ] Install the CLI: `npm install -g multi-deep-research-mcp`
- [ ] Set `OPENAI_API_KEY` environment variable
- [ ] Set `DEEPSEEK_API_KEY` environment variable
- [ ] Copy skill: `cp -r deep-research ~/.claude/skills/`
- [ ] Verify: `multi-deep-research-cli reasoning_providers_list`
- [ ] Restart Claude Code
- [ ] Try invoking with `/deep-research` or naturally in conversation

## Troubleshooting

**Skill not appearing in Claude?**
- Ensure files are in `~/.claude/skills/deep-research/`
- Check `SKILL.md` has valid YAML frontmatter
- Restart Claude Code
- Verify CLI is installed: `which multi-deep-research-cli`

**API key errors?**
- Check environment variables: `echo $OPENAI_API_KEY`
- May need to set in `.claude/settings.json` as well
- See [SETUP.md](deep-research/SETUP.md) for detailed configuration

**CLI not found?**
- Reinstall: `npm install -g multi-deep-research-mcp`
- Or use with npx: `npx multi-deep-research-mcp <command>`

## Next Steps

1. Read [deep-research/SETUP.md](deep-research/SETUP.md) for installation
2. Review [deep-research/SKILL.md](deep-research/SKILL.md) for usage
3. Check [deep-research/REFERENCE.md](deep-research/REFERENCE.md) for API details
4. Start researching!

## Adding More Skills

To add additional skills:

1. Create a new directory: `mkdir .claude/skills/new-skill`
2. Add `SKILL.md` with metadata and instructions
3. Reference supporting docs (e.g., REFERENCE.md, EXAMPLES.md)
4. Commit and share with team

See the `deep-research` skill for a complete example.
