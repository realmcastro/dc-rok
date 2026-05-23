#!/usr/bin/env node
// .claude/hooks/check-paths.mjs
//
// PreToolUse hook for Edit/Write/MultiEdit. Reads the tool input from stdin,
// extracts the target file_path, matches it against path triggers in the
// routing table, and emits a <system-reminder> listing specialist agents that
// own that path.
//
// This script is *read-only*: it does not modify any file and does not call
// other tools. It only prints to stdout. Output is injected into the model's
// context by Claude Code.

import { readFileSync } from 'node:fs';

const PATH_RULES = [
  ['scope-enforcer', [
    /package\.json$/,
    /src[\\/].*automation/i,
    /src[\\/].*agent-runtime/i,
    /src[\\/].*task-stream/i,
    /src[\\/].*telemetry-sink/i,
  ]],
  ['system-architect', [
    /src[\\/][^\\/]+[\\/]index\.ts$/,
    /src[\\/]bootstrap[\\/]/,
  ]],
  ['discord-integration', [
    /src[\\/]discord[\\/]/,
  ]],
  ['database', [
    /prisma[\\/]/,
    /src[\\/].*[\\/]infrastructure[\\/].*repository\.ts$/,
    /migrations[\\/]/,
  ]],
  ['security', [
    /src[\\/]license[\\/]/,
    /src[\\/]account-link[\\/]/,
    /src[\\/]audit[\\/]/,
    /src[\\/]config[\\/]/,
  ]],
  ['backend-reliability', [
    /src[\\/].*[\\/]infrastructure[\\/]/,
  ]],
  ['testing', [
    /\.test\.ts$/, /\.int\.test\.ts$/, /tests[\\/]/,
  ]],
  ['developer-experience', [
    /^package\.json$/, /^scripts[\\/]/, /^\.env\.example$/, /^Dockerfile$/, /^docker-compose\.yml$/,
    /^README\.md$/, /^\.husky[\\/]/, /^\.github[\\/]workflows[\\/]/,
  ]],
];

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function extractPath(stdin) {
  if (!stdin) return '';
  try {
    const obj = JSON.parse(stdin);
    return (
      obj?.tool_input?.file_path ??
      obj?.input?.file_path ??
      obj?.file_path ??
      ''
    );
  } catch {
    return '';
  }
}

function main() {
  const stdin = readStdin();
  const path = extractPath(stdin);
  if (!path) return;

  // Skip noise: only fire for paths inside the project tree.
  const matched = [];
  for (const [agent, rules] of PATH_RULES) {
    if (rules.some((re) => re.test(path))) matched.push(agent);
  }
  if (matched.length === 0) return;

  const reminder = [
    '<system-reminder>',
    `About to edit: ${path}`,
    'Specialist agents owning this path:',
    ...matched.map((a) => `- ${a} → .claude/agents/${a}.md`),
    '',
    'Re-check the agent\'s hard rules and validation criteria before this edit lands.',
    '</system-reminder>',
  ].join('\n');

  process.stdout.write(reminder + '\n');
}

main();
