"""
Base provider class for research services.
"""

from abc import ABC, abstractmethod
from typing import Tuple, Optional, List
import time
import sys


class BaseProvider(ABC):
    """Abstract base class for research providers."""

    @abstractmethod
    def create_request(
        self,
        query: str,
        model: Optional[str] = None,
        verbose: bool = False,
    ) -> Tuple[str, str]:
        """
        Create a research request.

        Args:
            query: Research question
            model: Specific model to use (optional)
            verbose: Enable verbose output

        Returns:
            Tuple of (request_id, status)
            where status is "completed" or "in_progress"
        """
        pass

    @abstractmethod
    def get_results(self, request_id: str) -> Tuple[str, Optional[str]]:
        """
        Get research results.

        Args:
            request_id: Request ID from create_request

        Returns:
            Tuple of (markdown_report, report_file_path)
        """
        pass

    @abstractmethod
    def check_status(self, request_id: str) -> str:
        """
        Check request status.

        Args:
            request_id: Request ID from create_request

        Returns:
            Status string: "completed", "in_progress", or "failed"
        """
        pass

    def poll_until_complete(
        self,
        request_id: str,
        poll_interval: int = 10,
        max_polls: int = 180,
        verbose: bool = False,
    ) -> str:
        """
        Poll request until completion.

        Args:
            request_id: Request ID from create_request
            poll_interval: Seconds between polls
            max_polls: Maximum number of poll attempts
            verbose: Enable verbose output

        Returns:
            Final status: "completed" or "failed"
        """
        for poll_num in range(1, max_polls + 1):
            status = self.check_status(request_id)

            if status == "completed":
                return "completed"
            elif status == "failed":
                return "failed"

            # Still in progress, wait and retry
            if poll_num < max_polls:
                elapsed = poll_num * poll_interval
                remaining = (max_polls - poll_num) * poll_interval
                if verbose:
                    print(
                        f"  [Poll {poll_num}/{max_polls}] "
                        f"Status: {status} "
                        f"(elapsed: {elapsed}s, timeout: {remaining}s)",
                        file=sys.stderr,
                    )
                time.sleep(poll_interval)
            else:
                print(f"  ⏱ Timeout after {poll_num} polls", file=sys.stderr)
                return "in_progress"

        return "in_progress"

    def _get_default_model(self) -> str:
        """Get default model for this provider."""
        return "default"
