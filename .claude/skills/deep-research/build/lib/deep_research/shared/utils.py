"""
Shared utilities for research providers.
"""

import sys
import os
import httpx
from typing import Optional
import json


class HTTPClient:
    """Simple HTTP client wrapper with timeout and error handling."""

    def __init__(self, timeout: float = 120.0):
        self.timeout = timeout

    def post(self, url: str, headers: dict, json_data: dict) -> dict:
        """POST request with error handling."""
        try:
            response = httpx.post(
                url,
                headers=headers,
                json=json_data,
                timeout=self.timeout,
            )
            response.raise_for_status()
            return response.json()
        except httpx.TimeoutException:
            raise TimeoutError(f"Request to {url} timed out after {self.timeout}s")
        except httpx.HTTPStatusError as e:
            error_msg = str(e.response.text)
            raise Exception(f"HTTP {e.response.status_code}: {error_msg}")

    def get(self, url: str, headers: dict) -> dict:
        """GET request with error handling."""
        try:
            response = httpx.get(
                url,
                headers=headers,
                timeout=self.timeout,
            )
            response.raise_for_status()
            return response.json()
        except httpx.TimeoutException:
            raise TimeoutError(f"Request to {url} timed out after {self.timeout}s")
        except httpx.HTTPStatusError as e:
            error_msg = str(e.response.text)
            raise Exception(f"HTTP {e.response.status_code}: {error_msg}")


def get_api_key(provider: str, key_name: str = None) -> str:
    """Get API key from environment."""
    if key_name is None:
        key_name = f"{provider.upper()}_API_KEY"

    api_key = os.getenv(key_name)
    if not api_key:
        raise ValueError(
            f"API key not found: {key_name}\n"
            f"Please set: export {key_name}=\"your-key\""
        )
    return api_key


def format_error_response(status: str, error: str, verbose: bool = False) -> str:
    """Format error response."""
    if verbose:
        return json.dumps(
            {
                "status": "error",
                "status_value": status,
                "message": error,
            },
            indent=2,
        )
    return f"Error ({status}): {error}"


def print_error(msg: str, file=None) -> None:
    """Print error to stderr."""
    if file is None:
        file = sys.stderr
    print(f"❌ {msg}", file=file)


def print_success(msg: str, file=None) -> None:
    """Print success to stderr."""
    if file is None:
        file = sys.stderr
    print(f"✓ {msg}", file=file)


def print_info(msg: str, verbose: bool = False) -> None:
    """Print info message if verbose."""
    if verbose:
        print(f"ℹ {msg}", file=sys.stderr)


def format_markdown_report(
    title: str,
    content: str,
    citations: Optional[list] = None,
    source: Optional[str] = None,
) -> str:
    """Format research output as markdown."""
    md_parts = [f"# {title}\n"]

    if source:
        md_parts.append(f"> Research conducted with {source}\n")

    md_parts.append(content)

    if citations:
        md_parts.append("\n## References\n")
        for i, citation in enumerate(citations, 1):
            if isinstance(citation, dict):
                url = citation.get("url", "")
                title = citation.get("title", "")
                if url:
                    md_parts.append(f"[{i}] {title}: {url}\n")
                else:
                    md_parts.append(f"[{i}] {title}\n")
            else:
                md_parts.append(f"[{i}] {citation}\n")

    return "".join(md_parts)


def ensure_reports_dir() -> str:
    """Ensure research reports directory exists."""
    reports_dir = os.path.expanduser(
        os.getenv("RESEARCH_RESULTS_DIR", "~/research-results")
    )
    os.makedirs(reports_dir, exist_ok=True)
    return reports_dir
