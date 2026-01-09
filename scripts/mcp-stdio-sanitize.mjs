#!/usr/bin/env node
import { spawn } from "node:child_process";
import { Transform } from "node:stream";

function usage() {
  // Important: write to stderr so we don't break MCP stdio.
  process.stderr.write(
    "Usage: mcp-stdio-sanitize <command> [args...]\n" +
      "Drops any non-JSON lines from child stdout until the first line that looks like JSON.\n"
  );
}

const [, , command, ...args] = process.argv;
if (!command) {
  usage();
  process.exit(2);
}

const child = spawn(command, args, {
  stdio: ["pipe", "pipe", "inherit"],
  env: process.env,
});

process.stdin.pipe(child.stdin);

let seenJson = false;

const sanitizer = new Transform({
  transform(chunk, _encoding, callback) {
    const data = chunk.toString("utf8");
    if (seenJson) {
      callback(null, data);
      return;
    }

    const lines = data.split(/\r?\n/);
    const out = [];

    for (const line of lines) {
      if (!line.length) continue;
      const trimmed = line.trimStart();
      if (trimmed.startsWith("{")) {
        seenJson = true;
        out.push(line);
        continue;
      }
      process.stderr.write(`[mcp-stdio-sanitize] Dropped stdout prelude: ${line}\n`);
    }

    callback(null, out.length ? `${out.join("\n")}\n` : "");
  },
});

child.stdout.pipe(sanitizer).pipe(process.stdout);

child.on("close", (code, signal) => {
  if (signal) {
    process.stderr.write(`[mcp-stdio-sanitize] Child exited via signal ${signal}\n`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  process.stderr.write(`[mcp-stdio-sanitize] Failed to start child: ${error.message}\n`);
  process.exit(1);
});
