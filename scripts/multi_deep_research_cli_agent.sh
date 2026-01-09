#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<EOF
Usage: multi_deep_research_cli_agent.sh --query-file FILE [options]

Required:
  --query-file FILE

Optional:
  --system-message-file FILE
  --parameters-file FILE
  --provider PROVIDER
  --model MODEL
  --include-code-interpreter
  --output-dir DIR (default: ./outputs)
  --poll-interval SECONDS (default: 10)
EOF
}

QUERY_FILE=""
SYSTEM_FILE=""
PARAMS_FILE=""
PROVIDER=""
MODEL=""
OUTPUT_DIR="./outputs"
POLL_INTERVAL="10"
INCLUDE_CODE_INTERPRETER="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --query-file) QUERY_FILE="$2"; shift 2;;
    --system-message-file) SYSTEM_FILE="$2"; shift 2;;
    --parameters-file) PARAMS_FILE="$2"; shift 2;;
    --provider) PROVIDER="$2"; shift 2;;
    --model) MODEL="$2"; shift 2;;
    --include-code-interpreter) INCLUDE_CODE_INTERPRETER="true"; shift;;
    --output-dir) OUTPUT_DIR="$2"; shift 2;;
    --poll-interval) POLL_INTERVAL="$2"; shift 2;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1"; usage; exit 1;;
  esac
done

if [[ -z "${QUERY_FILE}" ]]; then
  echo "Missing --query-file"
  usage
  exit 1
fi

mkdir -p "${OUTPUT_DIR}"

CREATE_ARGS=(research_request_create --query-file "${QUERY_FILE}" --output "${OUTPUT_DIR}/create.json")
if [[ -n "${SYSTEM_FILE}" ]]; then CREATE_ARGS+=(--system-message-file "${SYSTEM_FILE}"); fi
if [[ -n "${PARAMS_FILE}" ]]; then CREATE_ARGS+=(--parameters-file "${PARAMS_FILE}"); fi
if [[ -n "${PROVIDER}" ]]; then CREATE_ARGS+=(--provider "${PROVIDER}"); fi
if [[ -n "${MODEL}" ]]; then CREATE_ARGS+=(--model "${MODEL}"); fi
if [[ "${INCLUDE_CODE_INTERPRETER}" == "true" ]]; then CREATE_ARGS+=(--include-code-interpreter); fi

multi-deep-research-cli "${CREATE_ARGS[@]}"

REQUEST_ID=$(node -e "const fs=require('fs'); const res=JSON.parse(fs.readFileSync('${OUTPUT_DIR}/create.json','utf8')); const payload=JSON.parse(res.content[0].text); console.log(payload.request_id);")
STATUS=$(node -e "const fs=require('fs'); const res=JSON.parse(fs.readFileSync('${OUTPUT_DIR}/create.json','utf8')); const payload=JSON.parse(res.content[0].text); console.log(payload.status || '');")

if [[ "${STATUS}" != "completed" ]]; then
  while true; do
    multi-deep-research-cli research_request_check_status \
      --request-id "${REQUEST_ID}" \
      ${PROVIDER:+--provider "${PROVIDER}"} \
      --output "${OUTPUT_DIR}/status.json"
    STATUS=$(node -e "const fs=require('fs'); const res=JSON.parse(fs.readFileSync('${OUTPUT_DIR}/status.json','utf8')); const payload=JSON.parse(res.content[0].text); console.log(payload.status);")
    if [[ "${STATUS}" == "completed" ]]; then
      break
    fi
    if [[ "${STATUS}" == "failed" ]]; then
      echo "Request failed"
      exit 1
    fi
    sleep "${POLL_INTERVAL}"
  done
fi

multi-deep-research-cli research_request_get_results \
  --request-id "${REQUEST_ID}" \
  ${PROVIDER:+--provider "${PROVIDER}"} \
  --output "${OUTPUT_DIR}/results.json"
