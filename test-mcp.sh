#!/bin/bash

# Interactive MCP Server Testing Script
# This script allows you to test MCP endpoints interactively from the command line

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Output directory setup
OUTPUT_DIR="test-outputs"
SESSION_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SESSION_DIR="${OUTPUT_DIR}/${SESSION_TIMESTAMP}"

# Create output directory
mkdir -p "${SESSION_DIR}"

# Counter for requests in this session
REQUEST_COUNTER=0

# Helper to compact JSON arguments onto one line for stdio transport
compact_json() {
    local input="$1"
    if [ -z "$input" ]; then
        echo "{}"
        return
    fi

    if echo "$input" | jq '.' >/dev/null 2>&1; then
        echo "$input" | jq -c '.'
    else
        # Fallback: strip newlines so the MCP server still receives a single line
        echo "$input" | tr -d '\n'
    fi
}

# Helper function to save output
save_output() {
    local test_name="$1"
    local request="$2"
    local response="$3"

    REQUEST_COUNTER=$((REQUEST_COUNTER + 1))
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local filename="${SESSION_DIR}/${REQUEST_COUNTER}_${timestamp}_${test_name}"

    # Save request
    echo "$request" | jq '.' > "${filename}_request.json" 2>/dev/null || echo "$request" > "${filename}_request.txt"

    # Save response (try to extract nested JSON first)
    if [ -z "$response" ]; then
        echo "ERROR: Empty response" > "${filename}_response.txt"
        echo -e "${RED}Warning: Empty response received${NC}" >&2
    else
        local nested_json=$(echo "$response" | jq -r '.result.content[0].text' 2>/dev/null)
        if [ -n "$nested_json" ] && [ "$nested_json" != "null" ] && echo "$nested_json" | jq '.' >/dev/null 2>&1; then
            echo "$nested_json" | jq '.' > "${filename}_response.json"
        else
            echo "$response" | jq '.' > "${filename}_response.json" 2>/dev/null || echo "$response" > "${filename}_response.txt"
        fi
    fi

    echo -e "${CYAN}📁 Saved to: ${filename}_*.json${NC}"
}

# Send MCP request via stdio
send_mcp_request() {
    local method="$1"
    local test_name="${3:-mcp_request}"
    local id=$RANDOM

    local params=$(compact_json "$2")

    local request=$(printf '{"jsonrpc":"2.0","id":%s,"method":"%s","params":%s}' "$id" "$method" "$params")

    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Request:${NC}"
    echo "$request" | jq '.' 2>/dev/null || echo "$request"
    echo ""

    echo -e "${YELLOW}Response:${NC}"
    # Send request and capture output, filter Node.js warnings
    local response=$(echo "$request" | NODE_NO_WARNINGS=1 node dist/server.js 2>&1 | grep -v "^(node:\|^Use \`node")

    # Try to parse as JSON, if it fails show raw output
    local json_line=$(echo "$response" | grep '^{')

    if echo "$json_line" | jq '.' >/dev/null 2>&1; then
        # Try to extract nested JSON from result.content[0].text
        local nested_json=$(echo "$json_line" | jq -r '.result.content[0].text' 2>/dev/null)

        if [ -n "$nested_json" ] && [ "$nested_json" != "null" ] && echo "$nested_json" | jq '.' >/dev/null 2>&1; then
            # Display the nested JSON content
            echo "$nested_json" | jq '.'
        else
            # Display the full MCP response
            echo "$json_line" | jq '.'
        fi
    else
        echo "$response"
    fi

    # Save output to file
    save_output "$test_name" "$request" "$json_line"

    echo ""
}

# Interactive menu
show_menu() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     Multi-Provider Deep Research MCP Tester    ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "1) List available tools"
    echo "2) List reasoning models"
    echo "3) List reasoning providers"
    echo "4) Create research request (OpenAI)"
    echo "5) Create research request (DeepSeek)"
    echo "6) Check request status"
    echo "7) Get research results"
    echo "0) Exit"
    echo ""
    echo -n "Choose an option: "
}

# Test functions
test_list_tools() {
    echo -e "\n${GREEN}=== Listing MCP Tools ===${NC}\n"
    send_mcp_request "tools/list" "{}" "list_tools"
}

test_list_models() {
    echo -e "\n${GREEN}=== Listing Reasoning Models ===${NC}\n"
    send_mcp_request "tools/call" '{
        "name": "reasoning_models_list",
        "arguments": {}
    }' "list_models"
}

test_list_providers() {
    echo -e "\n${GREEN}=== Listing Reasoning Providers ===${NC}\n"
    send_mcp_request "tools/call" '{
        "name": "reasoning_providers_list",
        "arguments": {}
    }' "list_providers"
}

test_create_openai() {
    echo -e "\n${GREEN}=== Creating OpenAI Research Request ===${NC}\n"
    echo -n "Enter your query: "
    read query

    echo -n "Enter model (press Enter for o4-mini): "
    read model

    if [ -z "$model" ]; then
        model="o4-mini"
    fi

    # Escape quotes in query
    query=$(echo "$query" | sed 's/"/\\"/g')

    send_mcp_request "tools/call" "{
        \"name\": \"research_request_create\",
        \"arguments\": {
            \"query\": \"$query\",
            \"model\": \"$model\"
        }
    }" "create_openai"
}

test_create_deepseek() {
    echo -e "\n${GREEN}=== Creating DeepSeek Research Request ===${NC}\n"
    echo -n "Enter your query: "
    read query

    echo -n "Enter model (press Enter for deepseek-reasoner): "
    read model

    if [ -z "$model" ]; then
        model="deepseek-reasoner"
    fi

    # Escape quotes in query
    query=$(echo "$query" | sed 's/"/\\"/g')

    send_mcp_request "tools/call" "{
        \"name\": \"research_request_create\",
        \"arguments\": {
            \"provider\": \"deepseek\",
            \"query\": \"$query\",
            \"model\": \"$model\"
        }
    }" "create_deepseek"
}

test_check_status() {
    echo -e "\n${GREEN}=== Checking Request Status ===${NC}\n"
    echo -n "Enter request ID: "
    read request_id

    send_mcp_request "tools/call" "{
        \"name\": \"research_request_check_status\",
        \"arguments\": {
            \"request_id\": \"$request_id\"
        }
    }" "check_status"
}

test_get_results() {
    echo -e "\n${GREEN}=== Getting Research Results ===${NC}\n"
    echo -n "Enter request ID: "
    read request_id

    send_mcp_request "tools/call" "{
        \"name\": \"research_request_get_results\",
        \"arguments\": {
            \"request_id\": \"$request_id\"
        }
    }" "get_results"
}

# Main function
main() {
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}Error: jq is required but not installed.${NC}"
        echo "Install it with:"
        echo "  Ubuntu/Debian: sudo apt-get install jq"
        echo "  macOS: brew install jq"
        echo "  Fedora: sudo dnf install jq"
        exit 1
    fi

    # Check if dist exists
    if [ ! -d "dist" ]; then
        echo -e "${YELLOW}Build directory not found. Running npm run build...${NC}"
        npm run build
    fi

    # Check if node is available
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: node is required but not found.${NC}"
        exit 1
    fi

    echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   Multi-Provider Deep Research MCP Tester      ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Using stdio communication with MCP server${NC}"
    echo -e "${CYAN}Session output directory: ${SESSION_DIR}${NC}"
    echo ""

    while true; do
        show_menu
        read choice

        case $choice in
            1) test_list_tools ;;
            2) test_list_models ;;
            3) test_list_providers ;;
            4) test_create_openai ;;
            5) test_create_deepseek ;;
            6) test_check_status ;;
            7) test_get_results ;;
            0)
                echo -e "\n${GREEN}Session Summary:${NC}"
                echo -e "${CYAN}Total requests: ${REQUEST_COUNTER}${NC}"
                echo -e "${CYAN}Output saved to: ${SESSION_DIR}${NC}"
                echo -e "\n${GREEN}Goodbye!${NC}"
                exit 0
                ;;
            *) echo -e "${RED}Invalid option${NC}" ;;
        esac

        echo -e "\n${BLUE}Press Enter to continue...${NC}"
        read
    done
}

# Run main
main
