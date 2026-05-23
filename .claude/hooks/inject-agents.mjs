#!/usr/bin/env node
// .claude/hooks/inject-agents.mjs
//
// UserPromptSubmit hook. Reads the user prompt from stdin (Claude Code passes a
// JSON payload), matches it + a recent `git diff --name-only` against the
// routing table in .claude/routing/agent-router.md, and emits a
// <system-reminder> listing the activated agent files.
//
// This script is *read-only*: it does not modify any file and does not call
// other tools. It only prints to stdout. Output is injected into the model's
// context by Claude Code.
//
// To enable: copy .claude/routing/settings.example.json → .claude/settings.json
// (and review).

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROUTES = [
  // [agent, pathGlobs[], contentRegexes[]]
  ['scope-enforcer', [
    /^package\.json$/,
    /^src\/.*automation/i,
    /^src\/.*agent-runtime/i,
    /^src\/.*task-stream/i,
    /^src\/.*telemetry-sink/i,
  ], [
    /\bpuppeteer\b/i, /\bplaywright\b/i, /\btesseract\b/i, /\brobotjs\b/i, /\bnut-js\b/i,
    /\bscreenshot\b/i, /\bOCR\b/, /\bmacro\b/i,
  ]],
  ['product-guardian', [], [
    /\bnew (command|feature|flow)\b/i, /\badd (a )?command\b/i,
  ]],
  ['system-architect', [
    /^src\/[^/]+\/index\.ts$/,
    /^src\/bootstrap\//,
  ], [
    /\bnew module\b/i, /\bport\b/, /\badapter\b/, /\bcircular import\b/i,
  ]],
  ['discord-integration', [
    /^src\/discord\//,
  ], [
    /\binteraction\b/i, /\bslash command\b/i, /\bembed\b/i, /\bintent\b/i,
  ]],
  ['database', [
    /^prisma\//,
    /^src\/.*\/infrastructure\/.*repository\.ts$/,
    /^migrations\//,
  ], [
    /\bSELECT\b/, /\bINSERT\b/, /\bUPDATE\b/, /\bDELETE\b/, /\bALTER\b/, /\bCREATE TABLE\b/i,
    /\bprisma\./,
  ]],
  ['security', [
    /^src\/license\//,
    /^src\/account-link\//,
    /^src\/audit\//,
    /^src\/config\//,
    /^package\.json$/,
  ], [
    /\bprocess\.env\b/, /\btoken\b/i, /\bsecret\b/i,
    /\bbcrypt\b/i, /\bcrypto\b/i, /\bhash\b/i,
  ]],
  ['backend-reliability', [
    /^src\/.*\/infrastructure\//,
  ], [
    /\bsetInterval\b/, /\bretry\b/i, /\bPromise\.race\b/, /\bfetch\(/, /\baxios\b/,
  ]],
  ['testing', [
    /\.test\.ts$/, /\.int\.test\.ts$/, /^tests\//,
  ], []],
  ['developer-experience', [
    /^package\.json$/, /^scripts\//, /^\.env\.example$/, /^Dockerfile$/, /^docker-compose\.yml$/,
    /^README\.md$/, /^\.husky\//, /^\.github\/workflows\//,
  ], [
    /\bonboarding\b/i, /\bsetup\b/i, /\bdev loop\b/i,
  ]],
];

// Agents that always activate on every prompt.
const ALWAYS = ['scope-enforcer'];

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function gitChangedPaths() {
  try {
    const out = execSync('git diff --name-only HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function gitUntracked() {
  try {
    const out = execSync('git ls-files --others --exclude-standard', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function pickPrompt(stdin) {
  if (!stdin) return '';
  try {
    const obj = JSON.parse(stdin);
    return obj.prompt ?? obj.user_prompt ?? obj.text ?? '';
  } catch {
    return stdin;
  }
}

function main() {
  const stdin = readStdin();
  const prompt = pickPrompt(stdin);
  const paths = [...gitChangedPaths(), ...gitUntracked()];

  // Manual override: [agents: foo, bar]
  const manual = new Set();
  const skip = new Set();
  const am = prompt.match(/\[agents:\s*([^\]]+)\]/i);
  if (am) am[1].split(',').forEach((a) => manual.add(a.trim()));
  const sm = prompt.match(/\[skip-agents:\s*([^\]]+)\]/i);
  if (sm) sm[1].split(',').forEach((a) => skip.add(a.trim()));

  const activated = new Set(ALWAYS);

  for (const [agent, pathREs, contentREs] of ROUTES) {
    if (pathREs.some((re) => paths.some((p) => re.test(p)))) activated.add(agent);
    if (contentREs.some((re) => re.test(prompt))) activated.add(agent);
  }
  for (const a of manual) activated.add(a);
  for (const a of skip) activated.delete(a);

  if (activated.size === 0) return;

  const list = [...activated].map((a) => `- ${a} → .claude/agents/${a}.md`).join('\n');
  const reminder = [
    '<system-reminder>',
    'Auto-routed specialist agents for this turn:',
    list,
    '',
    'Load each agent file above before planning. Apply its hard rules and validation criteria.',
    'List activated agents in the PR description on commit.',
    '</system-reminder>',
  ].join('\n');

  process.stdout.write(reminder + '\n');
}

main();
