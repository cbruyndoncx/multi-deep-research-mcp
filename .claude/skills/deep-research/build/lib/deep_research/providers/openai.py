"""
OpenAI Deep Research Provider
Uses O1 models with background processing.
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


class OpenAIProvider(BaseProvider):
    """OpenAI Deep Research provider."""

    def __init__(self):
        self.api_key = get_api_key("openai")
        self.base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self.client = HTTPClient(timeout=120.0)

    def _get_default_model(self) -> str:
        return "o1"

    def create_request(
        self,
        query: str,
        model: Optional[str] = None,
        verbose: bool = False,
    ) -> Tuple[str, str]:
        """Create a research request with OpenAI Deep Research."""
        if not model:
            model = os.getenv("OPENAI_DEFAULT_MODEL", self._get_default_model())

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model,
            "input": [
                {
                    "role": "user",
                    "content": query,
                }
            ],
            "tools": [
                {"type": "web_search_preview"},
            ],
            "background": True,  # Enable background processing
        }

        response = self.client.post(
            f"{self.base_url}/research",
            headers=headers,
            json_data=payload,
        )

        request_id = response.get("id")
        status = response.get("status")

        # Normalize status
        if status == "completed":
            status = "completed"
        else:
            status = "in_progress"

        return request_id, status

    def check_status(self, request_id: str) -> str:
        """Check the status of a research request."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }

        response = self.client.get(
            f"{self.base_url}/research/{request_id}",
            headers=headers,
        )

        status = response.get("status", "unknown")

        # Normalize status
        if status in ["processing", "pending"]:
            return "in_progress"
        elif status == "completed":
            return "completed"
        elif status == "failed":
            return "failed"
        else:
            return "in_progress"

    def get_results(self, request_id: str) -> Tuple[str, Optional[str]]:
        """Retrieve completed research results."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }

        response = self.client.get(
            f"{self.base_url}/research/{request_id}",
            headers=headers,
        )

        # Extract report from response
        report_content = self._extract_report(response)

        # Extract citations if available
        citations = self._extract_citations(response)

        # Format as markdown
        markdown = format_markdown_report(
            title="Research Report",
            content=report_content,
            citations=citations,
            source="OpenAI Deep Research",
        )

        # Save to file
        report_file = self._save_report(request_id, markdown)

        return markdown, report_file

    def _extract_report(self, response: dict) -> str:
        """Extract report content from response."""
        # OpenAI response structure: response.content[0].research
        try:
            # Handle different response structures
            if "content" in response:
                content = response.get("content")
                if isinstance(content, list) and len(content) > 0:
                    item = content[0]
                    if "research" in item:
                        return item["research"]
                    elif "text" in item:
                        return item["text"]

            # Fallback: try getting report directly
            if "report" in response:
                return response["report"]

            # Last resort: return full response as JSON for debugging
            import json
            return f"```json\n{json.dumps(response, indent=2)}\n```"
        except Exception as e:
            return f"Error extracting report: {str(e)}"

    def _extract_citations(self, response: dict) -> list:
        """Extract citations from response."""
        citations = []
        try:
            if "content" in response:
                content = response.get("content")
                if isinstance(content, list) and len(content) > 0:
                    item = content[0]
                    if "citations" in item:
                        citations = item["citations"]
        except Exception:
            pass
        return citations

    def _save_report(self, request_id: str, markdown: str) -> Optional[str]:
        """Save report to file."""
        try:
            reports_dir = ensure_reports_dir()
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"openai_{request_id[:8]}_{timestamp}.md"
            filepath = os.path.join(reports_dir, filename)

            with open(filepath, "w") as f:
                f.write(markdown)

            return filepath
        except Exception as e:
            print(f"Warning: Could not save report: {e}")
            return None
