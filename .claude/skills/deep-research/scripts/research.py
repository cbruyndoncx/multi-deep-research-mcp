#!/usr/bin/env python3
"""
Unified Deep Research Script - Single command for all providers

Usage:
    uvx research.py "What are the latest AI breakthroughs?" --provider openai --poll
    uvx research.py "Explain quantum computing" --provider deepseek

Providers:
    - openai: O1 models with background processing (auto-polls)
    - deepseek: Synchronous reasoning models (immediate results)
    - anthropic: Claude models with extended thinking (future)
    - google: Gemini with grounding (future)
"""

import sys
import argparse
import os
from pathlib import Path

# Add scripts directory to path for imports
scripts_dir = Path(__file__).parent
sys.path.insert(0, str(scripts_dir))

from providers.openai import OpenAIProvider
from providers.deepseek import DeepSeekProvider
from shared.utils import print_error, print_success


def get_provider(provider_name: str):
    """Get provider instance by name."""
    providers = {
        "openai": OpenAIProvider,
        "deepseek": DeepSeekProvider,
        # Future providers
        # "anthropic": AnthropicProvider,
        # "google": GoogleProvider,
    }

    if provider_name not in providers:
        available = ", ".join(providers.keys())
        print_error(f"Unknown provider: {provider_name}")
        print_error(f"Available: {available}")
        sys.exit(1)

    return providers[provider_name]()


def main():
    parser = argparse.ArgumentParser(
        description="Deep research across multiple AI providers",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  uvx research.py "What is quantum computing?" --provider openai --poll
  uvx research.py "Latest AI breakthroughs" --provider deepseek
  uvx research.py "Explain transformers" --provider openai --model o1-mini
        """,
    )

    parser.add_argument(
        "query", help="Research query (or use stdin with -q)"
    )
    parser.add_argument(
        "--provider",
        default=os.getenv("REASONING_DEFAULT_PROVIDER", "openai"),
        help="AI provider: openai, deepseek (default: $REASONING_DEFAULT_PROVIDER or openai)",
    )
    parser.add_argument(
        "--model",
        help="Specific model (optional, uses provider default if not specified)",
    )
    parser.add_argument(
        "--poll",
        action="store_true",
        help="For async providers (OpenAI), poll until complete and return results",
    )
    parser.add_argument(
        "--poll-interval",
        type=int,
        default=10,
        help="Polling interval in seconds (default: 10)",
    )
    parser.add_argument(
        "--max-polls",
        type=int,
        default=180,
        help="Maximum polling attempts (default: 180, ~30 minutes)",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Show verbose output",
    )

    args = parser.parse_args()

    try:
        # Get provider
        provider = get_provider(args.provider)

        if args.verbose:
            print(f"Provider: {args.provider}")
            print(f"Query: {args.query}")
            print()

        # Step 1: Create research request
        print("📋 Creating research request...", file=sys.stderr)
        request_id, status = provider.create_request(
            query=args.query,
            model=args.model,
            verbose=args.verbose,
        )
        print(f"✓ Request created: {request_id}", file=sys.stderr)

        # Step 2: Check status and poll if needed
        if status == "in_progress" and args.poll:
            print(f"⏳ Polling for results (interval: {args.poll_interval}s)...", file=sys.stderr)
            status = provider.poll_until_complete(
                request_id=request_id,
                poll_interval=args.poll_interval,
                max_polls=args.max_polls,
                verbose=args.verbose,
            )

        if status == "completed":
            print("✓ Research complete", file=sys.stderr)
        elif status == "in_progress":
            print_error("Research still in progress. Use --poll to wait for completion.")
            print_error(f"Request ID: {request_id}")
            sys.exit(1)
        elif status == "failed":
            print_error("Research failed")
            sys.exit(1)

        # Step 3: Get results
        print("📥 Retrieving results...", file=sys.stderr)
        report_md, report_file = provider.get_results(request_id=request_id)

        # Output the report
        print(report_md)

        if report_file:
            print(f"\n💾 Report saved to: {report_file}", file=sys.stderr)

        print_success("Research complete", file=sys.stderr)

    except KeyboardInterrupt:
        print_error("\nInterrupted by user")
        sys.exit(130)
    except Exception as e:
        print_error(f"Error: {str(e)}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
