# Repository Guidelines

## Project Structure & Module Organization
TypeScript sources live in `src/`, with the MCP entry point in `src/server.ts` orchestrating provider modules under `src/providers/`. Builds land in `dist/` via `npm run build`; never edit them directly. Integration tests stay in `tests/test-suite.js`, which boots the compiled server, so build before running. Config roots (`package.json`, `tsconfig.json`, ESLint) plus docs describe required env vars (e.g., `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`) and optional helpers like `REASONING_DEFAULT_PROVIDER`, `<PROVIDER>_FAVORITE_MODELS`, `<PROVIDER>_DEFAULT_MODEL`, and `LITELLM_MODEL_SOURCE` for the dynamic catalog.

## Build, Test, and Development Commands
- `npm install`: install all runtime and dev dependencies.
- `npm run dev`: hot-reloads `src/server.ts` with `ts-node-dev` for MCP experimentation.
- `npm run build`: transpiles TypeScript to ESM JavaScript inside `dist/`.
- `npm start`: runs the built server (`dist/server.js`) as the published binary.
- `npm test`: runs `tests/test-suite.js` (requires a built server and `OPENAI_API_KEY` or `TEST_OPENAI_API_KEY`).
- `npm run lint` / `npm run lint:fix`: check or auto-fix style issues.
- `npm run clean`: remove stale build output before a fresh build.

## Coding Style & Naming Conventions
The codebase follows TypeScript ESM with 2-space indentation, `camelCase` for functions/variables, and `PascalCase` for types. Favor `async/await` for provider interactions, keep shared types in `src/providers/types.ts`, and return structured JSON payloads (`{ request_id, provider, status }`) so MCP clients can parse responses. Always run ESLint before pushing: `npm run lint`.

## Testing Guidelines
Tests assume the server binary exists, so run `npm run build && npm test`. The suite now:
- Logs which providers have credentials plus default/favorite env hints.
- Verifies tool registration and `reasoning_models_list` output before lifecycle checks.
- Drives the OpenAI request lifecycle end-to-end (`create` → repeated `check_status` → `get_results`) with a 5-minute timeout and prints report/citation stats whenever `OPENAI_API_KEY` (or `TEST_OPENAI_API_KEY`) is present.
- Exercises the DeepSeek synchronous flow (`create` → `check_status` → `get_results`) when `DEEPSEEK_API_KEY` is provided, and clearly marks skipped flows when credentials are missing.

Export at least one provider secret via `OPENAI_API_KEY=...` / `TEST_OPENAI_API_KEY=...` or `DEEPSEEK_API_KEY=...`, and keep stdout clean because the harness parses MCP responses. Use `OPENAI_TEST_MODEL` (defaults to `o4-mini`) if you need to point the OpenAI test flow at a faster/specific model. Name any new test helpers descriptively (`pollForCompletion`) and keep them near `tests/test-suite.js` until multiple files are justified.

## Commit & Pull Request Guidelines
Git history uses Conventional Commits (`feat:`, `fix:`, `refactor:`) with optional scopes and GitHub issue refs (`(#2)`). Keep subject lines imperative and under ~75 chars. Pull requests should describe the motivation, summarize behavioral changes, link related issues/discussions, and include screenshots or logs when touching diagnostics. Call out any required environment changes (new env vars, config keys) so downstream MCP clients stay compatible.

## Security & Configuration Tips
Never hardcode API keys. Load `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, etc. from your shell, `.env`, or MCP client configuration. Optional overrides like `OPENAI_BASE_URL`, `DEEPSEEK_BASE_URL`, and provider timeouts can be exported for non-default deployments—document them in PRs. Before publishing, run `npm run clean && npm run build` to ensure the package ships only compiled assets and no secret-bearing files.
