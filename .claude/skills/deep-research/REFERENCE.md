# Deep Research API Reference

Complete technical documentation for all CLI commands and their parameters.

## CLI Commands

All commands use the format:
```bash
npx multi-deep-research-cli <command> [options]
```

### research_request_create

Initiates a research request with the specified provider and query.

**Syntax:**
```bash
npx multi-deep-research-cli research_request_create \
  --query-file <path> \
  [--provider <provider>] \
  [--model <model>] \
  [--system-message-file <path>] \
  [--include-code-interpreter <boolean>] \
  [--parameters-file <path>] \
  [--output <path>]
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query-file` | string | ✓ | Path to text file containing the research query |
| `provider` | string | | Provider: `openai` or `deepseek`. Falls back to `REASONING_DEFAULT_PROVIDER` env var, then `openai` |
| `model` | string | | Specific model name (e.g., `o1`, `deepseek-reasoner`). If not specified, uses provider default |
| `system-message-file` | string | | Path to file containing system prompt instructions |
| `include-code-interpreter` | boolean | | Enable code execution capabilities (default: `false`) |
| `parameters-file` | string | | Path to JSON file with additional provider-specific parameters |
| `output` | string | | Path to write JSON response (prints to stdout if omitted) |

**Response Format:**
```json
{
  "status": "success|error",
  "request_id": "request_2a8b9e7f5c...",
  "status_value": "created|error",
  "model": "o1|deepseek-reasoner",
  "provider": "openai|deepseek",
  "message": "Request created successfully" // Only on error
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Overall operation status: `success` or `error` |
| `request_id` | string | Unique identifier for this research request. Use with `check_status` and `get_results` |
| `status_value` | string | Request state: `created` (DeepSeek), `created`/`error` (OpenAI) |
| `model` | string | Model used for this request |
| `provider` | string | Provider that will execute this request |
| `message` | string | Error message (only present on error) |

**Example:**

File: `query.txt`
```
What are the latest breakthroughs in CRISPR gene therapy and how might they impact cancer treatment?
```

Command:
```bash
npx multi-deep-research-cli research_request_create \
  --query-file query.txt \
  --provider openai \
  --model o1 \
  --output response.json
```

Response:
```json
{
  "status": "success",
  "request_id": "request_2a8b9e7f5c4d6b",
  "status_value": "created",
  "model": "o1",
  "provider": "openai"
}
```

---

### research_request_check_status

Checks the status of an OpenAI research request. DeepSeek requests complete immediately, so this is only useful for OpenAI.

**Syntax:**
```bash
npx multi-deep-research-cli research_request_check_status \
  --request-id <id> \
  [--provider <provider>] \
  [--output <path>]
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `request-id` | string | ✓ | Request ID from `research_request_create` |
| `provider` | string | | Provider: currently only `openai`. Defaults to `REASONING_DEFAULT_PROVIDER` |
| `output` | string | | Path to write JSON response (prints to stdout if omitted) |

**Response Format (In Progress):**
```json
{
  "status": "success",
  "request_id": "request_2a8b9e7f5c...",
  "status_value": "in_progress",
  "data": {
    "status": "in_progress",
    "progress": "Analyzing the query structure...",
    "percentage_complete": 23
  }
}
```

**Response Format (Completed):**
```json
{
  "status": "success",
  "request_id": "request_2a8b9e7f5c...",
  "status_value": "completed",
  "data": {
    "status": "completed"
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Operation status: `success` or `error` |
| `request_id` | string | The request ID being checked |
| `status_value` | string | Request state: `in_progress`, `completed`, `failed` |
| `data` | object | Status details (varies by OpenAI response) |
| `data.progress` | string | Human-readable progress message |
| `data.percentage_complete` | number | Progress percentage (0-100) |

**Response Statuses:**

| Status | Meaning | Action |
|--------|---------|--------|
| `created` | Request accepted, processing starting | Poll again in 10-30 seconds |
| `in_progress` | Currently analyzing | Poll again in 10-30 seconds |
| `completed` | Research finished | Call `get_results` to retrieve report |
| `failed` | Research failed | Check error details, retry with different parameters |

**Example:**

```bash
# Check status every 10 seconds until complete
request_id="request_2a8b9e7f5c4d6b"
while true; do
  response=$(npx multi-deep-research-cli research_request_check_status \
    --request-id "$request_id" \
    --provider openai)

  status=$(echo "$response" | jq -r '.status_value')
  echo "Status: $status"

  if [ "$status" = "completed" ]; then
    echo "Research complete!"
    break
  fi

  sleep 10
done
```

---

### research_request_get_results

Retrieves the completed research report and saves it to the filesystem.

**Syntax:**
```bash
npx multi-deep-research-cli research_request_get_results \
  --request-id <id> \
  [--provider <provider>] \
  [--output <path>]
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `request-id` | string | ✓ | Request ID from `research_request_create` |
| `provider` | string | | Provider: `openai` or `deepseek`. Defaults to first configured provider |
| `output` | string | | Path to write JSON response (prints to stdout if omitted) |

**Response Format:**
```json
{
  "status": "success|error",
  "request_id": "request_2a8b9e7f5c...",
  "report": "# Research Report\n\n## Executive Summary\n\n...",
  "report_file": "research-results/report_2a8b9e7f5c4d6b.md",
  "citations": [
    {
      "id": "[1]",
      "url": "https://example.com/article",
      "title": "Article Title"
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Operation status: `success` or `error` |
| `request_id` | string | The request ID |
| `report` | string | Markdown-formatted research report with citations |
| `report_file` | string | Path where report was saved on disk |
| `citations` | array | List of sources cited in the report (OpenAI only) |

**Example:**

```bash
npx multi-deep-research-cli research_request_get_results \
  --request-id "request_2a8b9e7f5c4d6b" \
  --provider openai \
  --output result.json

# Extract just the report
cat result.json | jq -r '.report' > my-research.md

# View citations
cat result.json | jq '.citations'
```

---

### reasoning_models_list

Lists all available models for a specific provider or all providers.

**Syntax:**
```bash
npx multi-deep-research-cli reasoning_models_list \
  [--provider <provider>] \
  [--output <path>]
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `provider` | string | | Filter models: `openai` or `deepseek`. If omitted, lists all configured providers |
| `output` | string | | Path to write JSON response (prints to stdout if omitted) |

**Response Format:**
```json
{
  "status": "success",
  "models": {
    "openai": [
      {
        "id": "o1",
        "name": "OpenAI o1",
        "description": "Flagship reasoning model",
        "capabilities": ["reasoning", "code", "math"]
      },
      {
        "id": "o1-mini",
        "name": "OpenAI o1 mini",
        "description": "Faster, more cost-effective o1 variant",
        "capabilities": ["reasoning", "code", "math"]
      },
      {
        "id": "gpt-4o",
        "name": "GPT-4o",
        "description": "General-purpose model with vision",
        "capabilities": ["text", "vision", "code"]
      }
    ],
    "deepseek": [
      {
        "id": "deepseek-reasoner",
        "name": "DeepSeek Reasoner",
        "description": "Reasoning-focused model",
        "capabilities": ["reasoning", "code", "math"]
      }
    ]
  }
}
```

**Example:**

```bash
# List all models from all configured providers
npx multi-deep-research-cli reasoning_models_list

# List only OpenAI models
npx multi-deep-research-cli reasoning_models_list --provider openai

# Parse output
models=$(npx multi-deep-research-cli reasoning_models_list --provider openai)
echo "$models" | jq '.models.openai[].id'
# Output:
# o1
# o1-mini
# gpt-4o
```

---

### reasoning_providers_list

Lists all configured providers and their availability status.

**Syntax:**
```bash
npx multi-deep-research-cli reasoning_providers_list \
  [--output <path>]
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `output` | string | | Path to write JSON response (prints to stdout if omitted) |

**Response Format:**
```json
{
  "status": "success",
  "providers": {
    "openai": {
      "configured": true,
      "available": true,
      "available_models": ["o1", "o1-mini", "gpt-4o"]
    },
    "deepseek": {
      "configured": true,
      "available": true,
      "available_models": ["deepseek-reasoner"]
    }
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `configured` | boolean | API key is set in environment |
| `available` | boolean | Provider is reachable and operational |
| `available_models` | array | List of models available from this provider |

**Example:**

```bash
# Check which providers are available
npx multi-deep-research-cli reasoning_providers_list

# Use in conditional
providers=$(npx multi-deep-research-cli reasoning_providers_list)
if echo "$providers" | jq '.providers.openai.configured' | grep -q 'true'; then
  echo "OpenAI is configured"
fi
```

---

## Environment Variables Reference

### Authentication

| Variable | Default | Description | Example |
|----------|---------|-------------|---------|
| `OPENAI_API_KEY` | - | OpenAI API key (required for OpenAI) | `sk-proj-abc123xyz...` |
| `DEEPSEEK_API_KEY` | - | DeepSeek API key (required for DeepSeek) | `sk-abc123...` |

### Provider Selection

| Variable | Default | Description |
|----------|---------|-------------|
| `REASONING_DEFAULT_PROVIDER` | `openai` | Default provider when not specified in commands |

### Model Defaults

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_DEFAULT_MODEL` | `o1` | Default model for OpenAI requests |
| `DEEPSEEK_DEFAULT_MODEL` | `deepseek-reasoner` | Default model for DeepSeek requests |

### Model Filtering

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_FAVORITE_MODELS` | - | Comma-separated list of preferred OpenAI models |
| `DEEPSEEK_FAVORITE_MODELS` | - | Comma-separated list of preferred DeepSeek models |

**Example:**
```bash
export OPENAI_FAVORITE_MODELS="o1,o1-mini"
# Now only these models are available for OpenAI
```

### Endpoints

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | OpenAI API endpoint |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | DeepSeek API endpoint |

**Use Case:** Point to proxy or self-hosted endpoint

```bash
export OPENAI_BASE_URL="https://my-proxy.example.com/openai"
```

### Output

| Variable | Default | Description |
|----------|---------|-------------|
| `RESEARCH_RESULTS_DIR` | `./research-results/` | Directory to save research reports |

**Example:**
```bash
export RESEARCH_RESULTS_DIR="/home/user/Documents/research/"
```

---

## Error Handling

### Common Error Responses

**Missing API Key:**
```json
{
  "status": "error",
  "message": "API key not configured for provider: openai"
}
```

**Invalid Request:**
```json
{
  "status": "error",
  "message": "Query file is empty: /path/to/file"
}
```

**Provider Unavailable:**
```json
{
  "status": "error",
  "message": "Failed to connect to provider: openai"
}
```

**Request Failed:**
```json
{
  "status": "success",
  "request_id": "request_xyz",
  "status_value": "failed",
  "error": "Model rate limit exceeded"
}
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (check JSON response for details) |

---

## Advanced Usage

### Passing Custom Parameters

For advanced configurations, pass provider-specific parameters:

**File: `params.json`**
```json
{
  "temperature": 1,
  "max_thinking_length": 8000
}
```

**Command:**
```bash
npx multi-deep-research-cli research_request_create \
  --query-file query.txt \
  --parameters-file params.json
```

### Custom System Messages

Provide specialized instructions:

**File: `system.txt`**
```
You are an expert academic researcher. Focus on:
1. Primary sources and peer-reviewed literature
2. Statistical rigor and methodology
3. Limitations and caveats
```

**Command:**
```bash
npx multi-deep-research-cli research_request_create \
  --query-file query.txt \
  --system-message-file system.txt
```

### Batch Processing

Research multiple queries:

```bash
for query_file in queries/*.txt; do
  echo "Processing: $query_file"
  npx multi-deep-research-cli research_request_create \
    --query-file "$query_file" \
    --provider deepseek \
    --output "results/$(basename $query_file .txt).json"
done
```

---

## Performance Considerations

### OpenAI Timing

- **Initial creation:** ~1 second
- **Processing time:** 2-15 minutes depending on query complexity
- **Recommended polling interval:** 10-30 seconds
- **Max typical wait:** 30 minutes

### DeepSeek Timing

- **Complete request:** 5-60 seconds (synchronous)
- **No polling needed**
- **Cost per request:** ~$0.001-0.01 depending on query size

### Best Practices

1. **Use DeepSeek for quick research** - Synchronous, affordable
2. **Use OpenAI for complex analysis** - Better reasoning, more comprehensive
3. **Poll with exponential backoff** - Start at 10s, increase to 30-60s
4. **Implement timeout** - Set 30-45 min timeout for OpenAI requests
5. **Cache results** - Store reports locally to avoid re-running research
