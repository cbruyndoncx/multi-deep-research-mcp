# MCP Server Interactive Test Script

## Overview

The `test-mcp.sh` script provides an interactive command-line interface for testing the Multi-Provider Deep Research MCP server. It communicates directly with the MCP server via stdio (standard input/output), just like Claude Desktop would.

## Prerequisites

- **Node.js** (v18 or higher)
- **jq** - JSON processor for formatting output
  - Ubuntu/Debian: `sudo apt-get install jq`
  - macOS: `brew install jq`
  - Fedora: `sudo dnf install jq`

## Usage

1. Make sure your API keys are set in environment variables:
   ```bash
   export OPENAI_API_KEY="your-openai-key"
   export DEEPSEEK_API_KEY="your-deepseek-key"
   ```

2. Run the test script:
   ```bash
   ./test-mcp.sh
   ```

3. Choose from the interactive menu:

## Menu Options

### 1. List Available Tools
Lists all MCP tools registered by the server. This shows the available endpoints you can call.

### 2. List Reasoning Models
Shows all available models from all configured providers (OpenAI, DeepSeek, etc.) with their metadata including:
- Model ID
- Provider
- Supported features (background jobs, code interpreter, reasoning)
- Parameter schemas
- Parameter descriptions

### 3. List Reasoning Providers
Shows provider status including:
- Provider ID and display name
- Credential status (configured/not configured)
- Environment variable names
- Whether the provider requires background polling

### 4. Create Research Request (OpenAI)
Interactive prompt to submit a research query to OpenAI. You can:
- Enter your research question
- Specify a model (or use default: o4-mini)
- Get a request ID to check status later

### 5. Create Research Request (DeepSeek)
Interactive prompt to submit a research query to DeepSeek. DeepSeek requests complete synchronously, so you get results immediately.

### 6. Check Request Status
Check the status of a previously created request using its request ID.

### 7. Get Research Results
Retrieve the full results (report, citations, etc.) for a completed request.

### 8. Custom JSON Request
Send your own custom JSON-RPC request. Useful for testing edge cases or new features.

### 9. Quick Test
Runs a complete end-to-end test with DeepSeek:
1. Submits a simple query ("What is 2+2?")
2. Extracts the request ID
3. Retrieves the results
4. Displays the report

This is the fastest way to verify everything is working.

### 0. Exit
Quit the test script.

## How It Works

The script:
1. Formats your input as a JSON-RPC 2.0 request
2. Sends it to the MCP server via stdin
3. Captures the JSON response from stdout
4. Parses and pretty-prints the response with colors

## Example Session

```bash
$ ./test-mcp.sh

╔════════════════════════════════════════════════╗
║   Multi-Provider Deep Research MCP Tester      ║
╚════════════════════════════════════════════════╝

Using stdio communication with MCP server

1) List available tools
2) List reasoning models
3) List reasoning providers
4) Create research request (OpenAI)
5) Create research request (DeepSeek)
6) Check request status
7) Get research results
8) Custom JSON request
9) Quick test (simple query)
0) Exit

Choose an option: 9

=== Quick Test (DeepSeek) ===

Testing with DeepSeek (synchronous)...
Query: What is 2+2? Answer in one sentence.
Model: deepseek-reasoner

Creating research request...
{
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"request_id\":\"chatcmpl-...\",\"provider\":\"deepseek\",\"model\":\"deepseek-reasoner\",\"status\":\"completed\",...}"
      }
    ]
  },
  "jsonrpc": "2.0",
  "id": 1
}

Request ID: chatcmpl-...

Getting results...
{
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"requestId\":\"chatcmpl-...\",\"provider\":\"deepseek\",\"model\":\"deepseek-reasoner\",\"results\":{\"report\":\"2+2 equals 4.\",...}}"
      }
    ]
  },
  "jsonrpc": "2.0",
  "id": 2
}

Report:
2+2 equals 4.
```

## Troubleshooting

### "jq: command not found"
Install jq using your package manager (see Prerequisites section).

### "Cannot find module 'dist/server.js'"
Run `npm run build` to build the project first.

### "API_KEY environment variable is required"
Set the appropriate API key environment variables (OPENAI_API_KEY, DEEPSEEK_API_KEY, etc.).

### Responses show deprecation warnings
The script automatically filters Node.js deprecation warnings. If you still see them, make sure you're using the latest version of the script.

## Tips

- Use **option 9 (Quick test)** first to verify everything works
- DeepSeek requests are synchronous and faster for testing
- OpenAI requests may be asynchronous - you'll need to poll status and retrieve results separately
- The script shows both the request and response for transparency
- All communication happens via stdio, exactly like Claude Desktop uses
