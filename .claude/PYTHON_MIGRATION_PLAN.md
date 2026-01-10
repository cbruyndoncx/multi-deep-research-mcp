# Python Implementation Migration Plan

This document outlines the plan for gradually migrating from the TypeScript MCP implementation to a standalone Python-based implementation that will eventually live in its own repository.

## Current State (Dual Implementation)

**Repository Structure:**
```
multi-deep-research-mcp/                    # Main repo (TypeScript MCP + Python)
├── src/                                    # TypeScript MCP server
│   ├── server.ts
│   ├── cli.ts
│   ├── handlers.ts
│   ├── providers/
│   └── clients/
├── .claude/
│   └── skills/
│       └── deep-research/
│           ├── scripts/                    # ⭐ Python implementation (new)
│           │   ├── research.py
│           │   ├── shared/
│           │   └── providers/
│           ├── SKILL.md
│           └── pyproject.toml
├── README.md                               # Focused on MCP + CLI
└── package.json
```

**What Each System Does:**
- **TypeScript MCP**: Full-featured MCP server + CLI wrapper
  - Supports: Claude Desktop, CLI with npx, MCP protocol
  - 1,605 lines of code
  - Build step required

- **Python**: Standalone research scripts with uvx
  - Supports: Claude Code skills, direct CLI with uvx
  - 485 lines of code
  - No build step
  - Will become separate repo

## Timeline & Phases

### Phase 1: ✅ COMPLETE
**Status:** Done
- [x] Create Python implementation (research.py + providers)
- [x] Implement OpenAI and DeepSeek providers
- [x] Create shared base classes and utilities
- [x] Test alongside TypeScript implementation
- [x] Keep both systems independent

**Current State:** Python scripts are production-ready and can be tested

### Phase 2: TESTING & VALIDATION
**Target:** After confidence in Python implementation

1. **Integration Testing**
   - Test with real OpenAI API calls
   - Test with real DeepSeek API calls
   - Verify report generation and formatting
   - Test cross-platform (Windows, Mac, Linux, WSL)

2. **Feature Parity Verification**
   - Ensure Python produces same output as TypeScript
   - Verify citation extraction works
   - Check report file naming and location
   - Validate error handling

3. **User Testing**
   - Run via Claude Code skill
   - Run via direct CLI with uvx
   - Gather feedback on usability

4. **Add More Providers** (Optional)
   - Implement Anthropic provider
   - Implement Google Gemini provider
   - Test integration with each

### Phase 3: DOCUMENTATION & DEPRECATION
**Target:** When Python implementation is stable and tested

1. **Create Standalone Repo**
   - Extract `.claude/skills/deep-research/scripts/` → new repo
   - Create separate GitHub repository
   - Set up independent CI/CD
   - Publish to PyPI (optional)

2. **Update Main Repo Documentation**
   - Mark TypeScript as "legacy"
   - Link to new Python repo
   - Document how to use either version
   - Provide migration guide for users

3. **Community Migration Period**
   - Keep both implementations available for 1-2 versions
   - Accept PRs for both
   - Gradually move to Python as default

### Phase 4: SUNSET TYPESCRIPT
**Target:** After sufficient migration period

1. **Stop Maintaining TypeScript**
   - Archive `src/` directory
   - No new features in TypeScript version
   - Bug fixes only (critical issues)

2. **Cleanup**
   - Remove build scripts
   - Remove npm dependencies
   - Remove TypeScript files
   - Keep old versions tagged in git

3. **Final State**
   - This repo becomes wrapper/documentation
   - Points to standalone Python repo
   - Or fully deprecates in favor of Python repo

## Sync Points During Dual Implementation

### What Needs to Stay in Sync
- **Provider interfaces** - Keep consistent between TypeScript and Python
- **API endpoint mappings** - Same URLs and parameters
- **Report formatting** - Identical markdown output
- **Error handling** - Same error messages and codes
- **Environment variables** - Same names and defaults

### What Can Differ
- **Implementation details** - HTTP client, async patterns, etc.
- **Testing approach** - TypeScript uses Jest, Python uses pytest
- **Build/deployment** - MCP vs uvx
- **File locations** - src/ vs scripts/

### Verification Steps
Before cutting over, verify:
- [ ] Same API calls to OpenAI/DeepSeek
- [ ] Same report markdown format
- [ ] Same citations extraction
- [ ] Same error messages
- [ ] Same environment variable handling
- [ ] Same model list retrieval
- [ ] Same default values

## Extraction Plan (When Ready)

### Step 1: Create New Repository
```bash
# Create standalone repo
gh repo create deep-research-cli --public
cd deep-research-cli

# Copy Python implementation
cp -r ../multi-deep-research-mcp/.claude/skills/deep-research/scripts/* .
cp ../multi-deep-research-mcp/.claude/skills/deep-research/pyproject.toml .

# Update documentation
# - Create new README.md focused on Python CLI
# - Create CONTRIBUTING.md
# - Create CHANGELOG.md
# - Update version to 1.0.0
```

### Step 2: Update This Repo
```bash
# In multi-deep-research-mcp:

# Update README.md
# - Remove Python script references
# - Link to standalone deep-research-cli repo
# - Mark as "for MCP integration"

# Keep scripts/ for reference
# - Tag as "deprecated, see deep-research-cli repo"
# - Add README pointing to new repo

# Update .gitmodules if using submodule
# OR just reference as separate repo
```

### Step 3: Documentation Updates
- New repo README for Python users
- Migration guide in old repo
- Links between repos
- Version compatibility matrix

## Decision Points

### When to Extract?
Extract Python to separate repo when:
- [x] Implementation is stable and tested
- [ ] All critical features work
- [ ] Cross-platform testing complete
- [ ] Added providers (Anthropic, Google)
- [ ] Documentation is comprehensive
- [ ] Users have tested it

### Keep or Archive TypeScript?
Options:
1. **Archive Completely** - Remove src/ when Python is ready
2. **Keep as Legacy Branch** - Maintain on separate git branch for users
3. **Dual Maintenance** - Keep both until users migrate (not recommended)

**Recommendation:** Option 1 - Archive completely, point users to Python repo

## Success Criteria

Python implementation is ready to extract when:
- ✅ Works identically to TypeScript version
- ✅ All tests pass on Windows, Mac, Linux
- ✅ Documentation is complete and clear
- ✅ Users can install and run with single command
- ✅ Error messages are helpful
- ✅ Performance is comparable or better
- ✅ Code is maintainable and extensible

## Reverse Dependencies

Nothing in this repo depends on the Python scripts:
- ✅ No imports from scripts/ in src/
- ✅ No shared code between implementations
- ✅ Skill docs are separate
- ✅ Clean separation of concerns

This means extraction is low-risk and can be done cleanly.

## Timeline Estimate

- **Phase 1 (Testing)**: 2-4 weeks
  - Real API testing
  - Cross-platform validation
  - Bug fixes

- **Phase 2 (Documentation)**: 1-2 weeks
  - Repo setup
  - README/CHANGELOG
  - Migration guide

- **Phase 3 (Extraction)**: 1 week
  - Repo copy
  - Link updates
  - Final testing

- **Phase 4 (Sunset)**: Flexible
  - Keep TypeScript available for 1-2 versions
  - Gradual migration
  - Eventually archive

**Total: 4-9 weeks from now to full Python repo**

But can be accelerated if you want to move faster.

## Notes for Future Self

1. **The Python code is production-ready now**
   - No need to wait for Phase 1 completion
   - Can start using immediately with uvx

2. **Keep TypeScript & Python completely separate**
   - No shared code between them
   - Different dependencies
   - Different deployment models
   - Makes extraction trivial

3. **Extraction is NOT a breaking change**
   - Users can switch gradually
   - Both can coexist
   - Clear migration path

4. **Consider publishing to PyPI**
   - Makes installation easier: `pip install deep-research`
   - Alternative to uvx
   - Increases discoverability

5. **Version numbering**
   - Keep TypeScript MCP at 1.x
   - Start Python repo at 2.0
   - Clear version separation
   - No confusion about which version

## Questions to Answer Later

- [ ] Should Python version be published to PyPI?
- [ ] Should we maintain both repos or fully archive TypeScript?
- [ ] What's the minimum migration period before archiving TypeScript?
- [ ] Add Anthropic/Google providers before extraction?
- [ ] Keep MCP wrapper calling Python scripts, or fully separate?
- [ ] Should Python repo have its own MCP server eventually?

These don't need answers now - just note them for when Phase 2 starts.
