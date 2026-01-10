# Deep Research Skill - Examples

Practical examples for common use cases with the deep-research skill.

## Quick Research (DeepSeek - Recommended)

### Example 1: Simple Query

**Goal:** Get a quick overview of recent AI breakthroughs

```bash
# Create query file
cat > query.txt <<EOF
What are the most significant AI breakthroughs in 2025?
EOF

# Run research
npx multi-deep-research-cli research_request_create \
  --query-file query.txt \
  --provider deepseek

# Result includes report immediately
```

### Example 2: Save to File

**Goal:** Research with output saved

```bash
echo "Explain the current state of quantum error correction" > my_query.txt

npx multi-deep-research-cli research_request_create \
  --query-file my_query.txt \
  --provider deepseek \
  --output result.json

# Extract report
cat result.json | jq -r '.report' > research_report.md

# Open in editor
cat research_report.md
```

## Complex Research (OpenAI - More Thorough)

### Example 3: Deep Analysis with Polling

**Goal:** In-depth research on a complex topic

**Script: `research_with_polling.sh`**

```bash
#!/bin/bash

QUERY_FILE="query.txt"
PROVIDER="openai"
MODEL="o1"
POLL_INTERVAL=30
MAX_POLLS=120  # 60 minutes max

# Create query
cat > "$QUERY_FILE" <<EOF
Conduct a comprehensive analysis of:
1. Current landscape of quantum computing hardware
2. Key technical challenges and proposed solutions
3. Timeline for practical quantum advantage
4. Implications for cryptography and optimization
EOF

echo "🔍 Initiating deep research..."

# Create request
response=$(npx multi-deep-research-cli research_request_create \
  --query-file "$QUERY_FILE" \
  --provider "$PROVIDER" \
  --model "$MODEL")

request_id=$(echo "$response" | jq -r '.request_id')
echo "📋 Request ID: $request_id"

# Poll for completion
poll_count=0
while [ $poll_count -lt $MAX_POLLS ]; do
  ((poll_count++))

  status_response=$(npx multi-deep-research-cli research_request_check_status \
    --request-id "$request_id" \
    --provider "$PROVIDER")

  status=$(echo "$status_response" | jq -r '.status_value')
  progress=$(echo "$status_response" | jq -r '.data.progress // "Processing..."')

  echo "[$poll_count/$MAX_POLLS] Status: $status"
  echo "  Progress: $progress"

  if [ "$status" = "completed" ]; then
    echo "✅ Research complete!"
    break
  fi

  if [ "$status" = "failed" ]; then
    echo "❌ Research failed"
    exit 1
  fi

  # Wait before polling again
  sleep "$POLL_INTERVAL"
done

if [ $poll_count -ge $MAX_POLLS ]; then
  echo "⏱️  Timeout: Research taking too long"
  exit 1
fi

# Retrieve results
echo "📥 Retrieving results..."
result=$(npx multi-deep-research-cli research_request_get_results \
  --request-id "$request_id" \
  --provider "$PROVIDER" \
  --output "research_result_${request_id}.json")

report_file=$(echo "$result" | jq -r '.report_file')
echo "💾 Report saved to: $report_file"

# Display report
cat "$report_file"
```

**Usage:**
```bash
chmod +x research_with_polling.sh
./research_with_polling.sh
```

## Custom System Prompts

### Example 4: Academic Research Focus

**Goal:** Research formatted for academic writing

**File: `academic_system.txt`**
```
You are an expert academic researcher specializing in the field.
Your response should:

1. Follow academic writing conventions
2. Include a clear thesis statement
3. Provide structured argumentation with evidence
4. Cite authoritative sources with full references
5. Acknowledge limitations and counterarguments
6. Use formal academic language
7. Structure as: Abstract, Introduction, Body, Conclusion, References
```

**Command:**
```bash
echo "What are the latest developments in CRISPR gene editing?" > query.txt

npx multi-deep-research-cli research_request_create \
  --query-file query.txt \
  --provider openai \
  --model o1 \
  --system-message-file academic_system.txt \
  --output academic_research.json
```

### Example 5: Executive Summary Focus

**File: `executive_system.txt`**
```
You are a business intelligence analyst. Provide:

1. Executive Summary (2-3 sentences)
2. Key Findings (5-7 bullet points)
3. Business Implications (3-4 points)
4. Recommended Actions (prioritized list)
5. Risks and Opportunities

Keep language clear and direct. Focus on business value and actionable insights.
```

**Command:**
```bash
echo "What's the competitive landscape in AI assistants in 2025?" > query.txt

npx multi-deep-research-cli research_request_create \
  --query-file query.txt \
  --system-message-file executive_system.txt \
  --output executive_brief.json
```

## Batch Processing

### Example 6: Research Multiple Topics

**File: `topics.txt`**
```
Topics to research:
- Advances in fusion energy
- Latest developments in autonomous vehicles
- New AI models and their capabilities
```

**Script: `batch_research.sh`**
```bash
#!/bin/bash

TOPICS=(
  "What are current advances in fusion energy?"
  "Latest developments in autonomous vehicle technology"
  "New AI foundation models and their capabilities"
)

PROVIDER="deepseek"
OUTPUT_DIR="research_results"
mkdir -p "$OUTPUT_DIR"

for i in "${!TOPICS[@]}"; do
  topic="${TOPICS[$i]}"
  echo "[$((i+1))/${#TOPICS[@]}] Researching: $topic"

  # Save topic to temp file
  echo "$topic" > /tmp/query.txt

  # Request research
  result=$(npx multi-deep-research-cli research_request_create \
    --query-file /tmp/query.txt \
    --provider "$PROVIDER" \
    --output "$OUTPUT_DIR/result_$i.json")

  report=$(jq -r '.report' "$OUTPUT_DIR/result_$i.json")
  echo "$report" > "$OUTPUT_DIR/report_$i.md"

  echo "✓ Saved to $OUTPUT_DIR/report_$i.md"
  echo ""
done

echo "✅ Batch research complete!"
echo "Results in: $OUTPUT_DIR/"
```

**Usage:**
```bash
chmod +x batch_research.sh
./batch_research.sh
```

## Provider Comparison

### Example 7: Compare DeepSeek vs OpenAI

**Script: `compare_providers.sh`**
```bash
#!/bin/bash

QUERY="Explain blockchain technology and its applications"
echo "$QUERY" > query.txt

echo "Researching with DeepSeek..."
deepseek_result=$(npx multi-deep-research-cli research_request_create \
  --query-file query.txt \
  --provider deepseek \
  --output deepseek_result.json)

deepseek_report=$(jq -r '.report' deepseek_result.json)
echo "$deepseek_report" > deepseek_report.md

echo "Researching with OpenAI (polling)..."
openai_response=$(npx multi-deep-research-cli research_request_create \
  --query-file query.txt \
  --provider openai \
  --model o1-mini)

request_id=$(echo "$openai_response" | jq -r '.request_id')

# Simple polling (in production, use exponential backoff)
while true; do
  status=$(npx multi-deep-research-cli research_request_check_status \
    --request-id "$request_id" \
    --provider openai)

  if echo "$status" | jq -r '.status_value' | grep -q 'completed'; then
    break
  fi
  echo "Waiting for OpenAI... (status: $(echo $status | jq -r '.status_value'))"
  sleep 15
done

openai_result=$(npx multi-deep-research-cli research_request_get_results \
  --request-id "$request_id" \
  --provider openai \
  --output openai_result.json)

openai_report=$(jq -r '.report' openai_result.json)
echo "$openai_report" > openai_report.md

echo ""
echo "Comparison saved:"
echo "  DeepSeek: deepseek_report.md"
echo "  OpenAI: openai_report.md"
```

## Integration with Other Tools

### Example 8: Save Research with Metadata

**Script: `research_with_metadata.sh`**
```bash
#!/bin/bash

QUERY="$1"
TOPIC="$2"
PROVIDER="${3:-deepseek}"

if [ -z "$QUERY" ] || [ -z "$TOPIC" ]; then
  echo "Usage: $0 '<query>' '<topic>' [provider]"
  exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="research_${TOPIC}_${TIMESTAMP}.md"

echo "$QUERY" | npx multi-deep-research-cli research_request_create \
  --query-file /dev/stdin \
  --provider "$PROVIDER" \
  --output /tmp/raw_result.json

# Extract report with metadata
{
  echo "# Research Report"
  echo ""
  echo "**Topic:** $TOPIC"
  echo "**Date:** $(date)"
  echo "**Provider:** $PROVIDER"
  echo "**Query:** $QUERY"
  echo ""
  echo "---"
  echo ""
  jq -r '.report' /tmp/raw_result.json
} > "$OUTPUT_FILE"

echo "✅ Saved to: $OUTPUT_FILE"
cat "$OUTPUT_FILE"
```

**Usage:**
```bash
./research_with_metadata.sh \
  "What are quantum computers and when will they be practical?" \
  "quantum-computing" \
  openai
```

## Advanced: Custom Parameters

### Example 9: OpenAI with Extended Thinking

**File: `params.json`**
```json
{
  "budget_tokens": 10000
}
```

**Command:**
```bash
npx multi-deep-research-cli research_request_create \
  --query-file query.txt \
  --provider openai \
  --parameters-file params.json
```

## Error Handling

### Example 10: Robust Error Handling

```bash
#!/bin/bash

set -e  # Exit on error

handle_error() {
  local line=$1
  echo "❌ Error on line $line"
  exit 1
}

trap 'handle_error $LINENO' ERR

# Check prerequisites
if ! command -v npx multi-deep-research-cli &> /dev/null; then
  echo "Error: npx multi-deep-research-cli not installed"
  echo "Run: npm install -g multi-deep-research-mcp"
  exit 1
fi

# Check API keys
if [ -z "$OPENAI_API_KEY" ]; then
  echo "Error: OPENAI_API_KEY not set"
  exit 1
fi

# Check query file
QUERY_FILE="$1"
if [ ! -f "$QUERY_FILE" ]; then
  echo "Error: Query file not found: $QUERY_FILE"
  exit 1
fi

# Run research with error checking
if ! response=$(npx multi-deep-research-cli research_request_create \
  --query-file "$QUERY_FILE" \
  --provider openai 2>&1); then
  echo "Error running research:"
  echo "$response"
  exit 1
fi

echo "✅ Research initiated successfully"
echo "$response" | jq '.'
```

## Tips and Best Practices

1. **DeepSeek for quick iterations** - Use for brainstorming, first drafts, quick summaries
2. **OpenAI for thorough analysis** - Use for academic work, critical decisions, complex topics
3. **Monitor polling carefully** - Don't hammer the API, use 10-30 second intervals
4. **Save results** - Always save to JSON, then extract what you need
5. **Version control** - Check report markdown into git for tracking changes
6. **Custom prompts** - Tailor system messages to your specific use case
7. **Batch processing** - Use for comparing multiple topics or providers
