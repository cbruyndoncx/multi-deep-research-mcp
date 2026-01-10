#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="${REPO_URL:-https://github.com/YOUR_GITHUB/multi-deep-research-mcp}"
BRANCH="${BRANCH:-main}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.multi-deep-research-mcp}"
SKILL_DIR="$HOME/.claude/skills/deep-research"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Multi-Deep-Research MCP Installation Script           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check Node.js
echo -e "${BLUE}[1/6]${NC} Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js 18+ required (found v$(node -v))${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) found${NC}"
echo -e "${GREEN}✓ npm $(npm -v) found${NC}"
echo ""

# Step 2: Clone repository
echo -e "${BLUE}[2/6]${NC} Setting up repository..."

if [ -d "$INSTALL_DIR" ]; then
    echo "  Repository already exists at $INSTALL_DIR"
    echo "  Updating to latest version..."
    cd "$INSTALL_DIR"
    git fetch origin
    git checkout "$BRANCH"
    git pull
else
    echo "  Cloning repository from $REPO_URL..."
    git clone --branch "$BRANCH" "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

echo -e "${GREEN}✓ Repository ready at $INSTALL_DIR${NC}"
echo ""

# Step 3: Install dependencies
echo -e "${BLUE}[3/6]${NC} Installing dependencies..."
npm install > /dev/null 2>&1
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 4: Build project
echo -e "${BLUE}[4/6]${NC} Building project..."
npm run build > /dev/null 2>&1
echo -e "${GREEN}✓ Project built${NC}"
echo ""

# Step 5: Install skill
echo -e "${BLUE}[5/6]${NC} Installing Claude Code skill..."
mkdir -p "$(dirname "$SKILL_DIR")"
cp -r ".claude/skills/deep-research" "$SKILL_DIR"
echo -e "${GREEN}✓ Skill installed to $SKILL_DIR${NC}"
echo ""

# Step 6: Verify installation
echo -e "${BLUE}[6/6]${NC} Verifying installation..."
cd "$INSTALL_DIR"

if npx multi-deep-research-cli reasoning_providers_list > /dev/null 2>&1; then
    echo -e "${GREEN}✓ CLI verified and working${NC}"
else
    echo -e "${YELLOW}⚠ CLI test failed (this may be normal if API keys aren't set)${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Installation Complete! ✓                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo "1. Set your API keys:"
echo "   ${BLUE}export OPENAI_API_KEY=\"sk-proj-your-key\"${NC}"
echo "   ${BLUE}export DEEPSEEK_API_KEY=\"sk-your-key\"${NC}"
echo ""
echo "2. Restart Claude Code"
echo ""
echo "3. Start using the skill:"
echo "   ${BLUE}/deep-research${NC} or mention 'research' naturally"
echo ""
echo -e "${YELLOW}For CLI usage (optional):${NC}"
echo "   cd $INSTALL_DIR"
echo "   npx multi-deep-research-cli research_request_create ..."
echo ""
echo -e "${YELLOW}Locations:${NC}"
echo "  Skill: $SKILL_DIR"
echo "  Repo (optional): $INSTALL_DIR"
echo ""
echo "For more information, see:"
echo "  Setup guide: $INSTALL_DIR/.claude/skills/deep-research/SETUP.md"
echo "  Examples: $INSTALL_DIR/.claude/skills/deep-research/EXAMPLES.md"
echo ""
