#!/usr/bin/env python3
"""
Unified Deep Research Script - Single command for all providers

Usage:
    uvx --from git+https://github.com/you/deep-research-cli research "What are the latest AI breakthroughs?" --provider openai --poll
    uvx --from git+https://github.com/you/deep-research-cli research "Explain quantum computing" --provider deepseek

Providers:
    - openai: O1 models with background processing (auto-polls)
    - deepseek: Synchronous reasoning models (immediate results)
    - anthropic: Claude models with extended thinking (future)
    - google: Gemini with grounding (future)
"""

import sys
import argparse
import os

from .providers.openai import OpenAIProvider
from .providers.deepseek import DeepSeekProvider
from .shared.utils import print_error, print_success


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
  research "What is quantum computing?" --provider openai --poll
  research "Latest AI breakthroughs" --provider deepseek
  research "Explain transformers" --provider openai --model o1-mini
  research --check-status <id> --provider openai
  research --get-results <id> --provider openai
        """,
    )

    parser.add_argument(
        "query", nargs="?", help="Research query"
    )
    parser.add_argument(
        "--query-file",
        metavar="FILE",
        help="Read query from file instead of command line",
    )
    parser.add_argument(
        "--provider",
        default=os.getenv("REASONING_DEFAULT_PROVIDER", "deepseek"),
        help="AI provider: openai, deepseek (default: $REASONING_DEFAULT_PROVIDER or deepseek)",
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
        "--output",
        metavar="FILE",
        help="Save markdown report to file",
    )
    parser.add_argument(
        "--check-status",
        metavar="REQUEST_ID",
        help="Check status of existing request (requires --provider)",
    )
    parser.add_argument(
        "--get-results",
        metavar="REQUEST_ID",
        help="Get results of completed request (requires --provider)",
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

        # Handle --check-status
        if args.check_status:
            if args.verbose:
                print(f"Provider: {args.provider}", file=sys.stderr)
                print(f"Checking status of: {args.check_status}", file=sys.stderr)
                print(file=sys.stderr)
            status = provider.check_status(args.check_status)
            print(f"Status: {status}", file=sys.stderr)
            sys.exit(0)

        # Handle --get-results
        if args.get_results:
            if args.verbose:
                print(f"Provider: {args.provider}", file=sys.stderr)
                print(f"Retrieving results for: {args.get_results}", file=sys.stderr)
                print(file=sys.stderr)
            print("📥 Retrieving results...", file=sys.stderr)
            report_md, report_file = provider.get_results(request_id=args.get_results)
            print(report_md)
            if report_file:
                print(f"\n💾 Report saved to: {report_file}", file=sys.stderr)
            print_success("Results retrieved", file=sys.stderr)
            sys.exit(0)

        # Get query from argument or file
        query = args.query
        if args.query_file:
            try:
                with open(args.query_file, 'r') as f:
                    query = f.read().strip()
                if args.verbose:
                    print(f"📖 Read query from: {args.query_file}", file=sys.stderr)
            except FileNotFoundError:
                print_error(f"Query file not found: {args.query_file}")
                sys.exit(1)
            except IOError as e:
                print_error(f"Error reading query file: {e}")
                sys.exit(1)

        # Validate query is provided for research
        if not query:
            parser.error("query is required (provide as argument or use --query-file)")

        if args.verbose:
            print(f"Provider: {args.provider}")
            print(f"Query: {query[:100]}..." if len(query) > 100 else f"Query: {query}")
            if args.output:
                print(f"Output file: {args.output}")
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

        # Save to file if requested
        if args.output:
            try:
                with open(args.output, 'w') as f:
                    f.write(report_md)
                print(f"💾 Report saved to: {args.output}", file=sys.stderr)
            except IOError as e:
                print_error(f"Error saving to output file: {e}")
                sys.exit(1)
        elif report_file:
            print(f"💾 Report also saved to: {report_file}", file=sys.stderr)

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
