"""
DeepSeek Reasoning Provider
Uses DeepSeek reasoning models with synchronous responses.
"""

import os
from typing import Tuple, Optional
from datetime import datetime

from ..shared.base import BaseProvider
from ..shared.utils import (
    HTTPClient,
    get_api_key,
    format_markdown_report,
    ensure_reports_dir,
)


class DeepSeekProvider(BaseProvider):
    """DeepSeek reasoning provider."""

    def __init__(self):
        self.api_key = get_api_key("deepseek")
        self.base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
        self.client = HTTPClient(timeout=300.0)  # Longer timeout for reasoning
        self._results_cache = {}  # Cache results from create_request

    def _get_default_model(self) -> str:
        return "deepseek-reasoner"

    def create_request(
        self,
        query: str,
        model: Optional[str] = None,
        verbose: bool = False,
    ) -> Tuple[str, str]:
        """Create a research request (synchronous, returns immediately)."""
        if not model:
            model = os.getenv("DEEPSEEK_DEFAULT_MODEL", self._get_default_model())

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": query,
                }
            ],
            "temperature": 1.0,  # Required for reasoning
            "stream": False,
        }

        response = self.client.post(
            f"{self.base_url}/v1/chat/completions",
            headers=headers,
            json_data=payload,
        )

        # Generate synthetic request ID for consistency
        request_id = f"deepseek_{id(response)}"

        # Cache the result since DeepSeek returns immediately
        self._results_cache[request_id] = {
            "response": response,
            "model": model,
            "query": query,
        }

        # DeepSeek returns immediately
        return request_id, "completed"

    def check_status(self, request_id: str) -> str:
        """Check status (DeepSeek is always completed immediately)."""
        if request_id in self._results_cache:
            return "completed"
        return "in_progress"

    def get_results(self, request_id: str) -> Tuple[str, Optional[str]]:
        """Retrieve results."""
        if request_id not in self._results_cache:
            return "Error: Request not found (already retrieved?)", None

        cached = self._results_cache.pop(request_id)
        response = cached["response"]

        # Extract reasoning and response
        content = self._extract_content(response)

        # Format as markdown
        markdown = format_markdown_report(
            title="Research Report",
            content=content,
            source="DeepSeek Reasoning",
        )

        # Save to file
        report_file = self._save_report(request_id, markdown)

        return markdown, report_file

    def _extract_content(self, response: dict) -> str:
        """Extract content from DeepSeek response."""
        try:
            # Standard OpenAI-compatible response structure
            if "choices" in response:
                choices = response.get("choices", [])
                if len(choices) > 0:
                    message = choices[0].get("message", {})
                    content = message.get("content", "")

                    # If there's reasoning_content, include it
                    reasoning = message.get("reasoning_content", "")
                    if reasoning:
                        return f"## Reasoning\n\n{reasoning}\n\n## Response\n\n{content}"
                    else:
                        return content

            return "Error: Unable to extract response content"
        except Exception as e:
            return f"Error extracting content: {str(e)}"

    def _save_report(self, request_id: str, markdown: str) -> Optional[str]:
        """Save report to file."""
        try:
            reports_dir = ensure_reports_dir()
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"deepseek_{request_id[:8]}_{timestamp}.md"
            filepath = os.path.join(reports_dir, filename)

            with open(filepath, "w") as f:
                f.write(markdown)

            return filepath
        except Exception as e:
            print(f"Warning: Could not save report: {e}")
            return None
