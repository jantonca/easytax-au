#!/usr/bin/env node
// Checks that repository paths referenced from tracked Markdown files exist.
//
// Checked:
//   - relative Markdown links: [text](path) — resolved from the linking file
//   - inline code spans and fenced code blocks that start with a repo root
//     (src/, web/, test/, docs/, scripts/, shared/, .claude/, .github/) or name
//     a root-level Markdown file — resolved from the repository root
// Skipped:
//   - docs/archive/** (historical records keep the paths of their time)
//   - URLs, anchors, and template paths containing < [ * { $ … or YYYY
//   - gitignored paths (build output, node_modules, local .env files)
//   - any path listed in IGNORE below (intentional examples)
// Existence is checked against tracked files, so results do not depend on
// local build output. A path such as backend/src/... whose first directory
// does not exist is reported even though backend/ is not a known root.
// Usage: node scripts/check-doc-refs.mjs   (exit 1 on any missing path)

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';

const ROOTS = ['src/', 'web/', 'test/', 'docs/', 'scripts/', 'shared/', '.claude/', '.github/'];
const ROOT_DOCS = /^(README|AGENTS|CLAUDE|STATUS|NEXT-TASKS|CHANGELOG|CONTRIBUTING)\.md$/;
const TEMPLATE = /[<[*{$…]|YYYY/;
const IGNORE = new Set([
  // /schema-change example migration names
  'src/migrations/1234567890123-MigrationName.ts',
  'src/migrations/MigrationName',
  // /schema-change: a script the reader is told to create
  'scripts/migrate-encrypted-field.ts',
  // /import-data: a fixture directory the reader is told to create
  'test/fixtures/csv/',
]);

const repo = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const tracked = execFileSync('git', ['ls-files'], { cwd: repo, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);
const known = new Set(tracked);
for (const f of tracked) {
  const parts = f.split('/');
  for (let i = 1; i < parts.length; i++) known.add(parts.slice(0, i).join('/'));
}
const topLevel = new Set(tracked.map((f) => f.split('/')[0]));
const files = tracked.filter((f) => f.endsWith('.md') && !f.startsWith('docs/archive/'));

// Strip an #anchor, a trailing :line, :line-line or :line,line suffix, and trailing punctuation.
const clean = (p) =>
  p.split('#')[0].replace(/[),.;]+$/, '').replace(/:\d+([-,]\d+)*$/, '');

// Module specifiers such as web/src/lib/currency resolve like imports.
const EXTENSIONS = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];
const exists = (p) => {
  const base = p.replace(/\/+$/, '');
  return EXTENSIONS.some((ext) => known.has(base + ext));
};
// A path under a non-existent top-level directory that looks like a source
// layout (e.g. backend/src/...) is a phantom, not an unrelated token.
const PHANTOM = /^([\w.-]+)\/(src|test|docs|web)\//;

const candidates = [];
const report = (file, line, ref, resolved) => candidates.push({ file, line, ref, resolved });

function checkRepoPath(file, lineNo, token, inFence = false) {
  const ref = clean(token);
  if (!ref || TEMPLATE.test(ref) || IGNORE.has(ref) || IGNORE.has(ref + '/')) return;
  if (ref.startsWith('./') || ref.startsWith('../')) {
    // In code blocks, ./x is an import relative to a source file, not the doc.
    if (inFence) return;
    const resolved = normalize(join(dirname(file), ref));
    if (!exists(resolved)) report(file, lineNo, token, resolved);
    return;
  }
  const isRootDoc = ROOT_DOCS.test(ref);
  const phantom = PHANTOM.exec(ref);
  const isPhantom = phantom && !topLevel.has(phantom[1]);
  if (!isRootDoc && !isPhantom && !ROOTS.some((r) => ref.startsWith(r))) return;
  if (!exists(ref)) report(file, lineNo, token, ref);
}

for (const file of files) {
  const lines = readFileSync(join(repo, file), 'utf8').split('\n');
  let inFence = false;
  lines.forEach((text, i) => {
    const lineNo = i + 1;
    if (/^\s*(```|~~~)/.test(text)) {
      inFence = !inFence;
      return;
    }
    if (inFence) {
      for (const token of text.split(/[\s'"`=()]+/)) checkRepoPath(file, lineNo, token, true);
      return;
    }
    for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const path = decodeURI(target.split('#')[0]);
      if (!path || TEMPLATE.test(path)) continue;
      const resolved = normalize(join(dirname(file), path));
      if (!exists(resolved)) report(file, lineNo, target, resolved);
    }
    for (const [, span] of text.matchAll(/`([^`]+)`/g)) {
      if (/\s/.test(span.trim())) continue; // commands and prose, not a single path
      checkRepoPath(file, lineNo, span.trim());
    }
  });
}

// Drop gitignored paths (build output, dependencies, local config).
let ignored = new Set();
if (candidates.length > 0) {
  try {
    const out = execFileSync('git', ['check-ignore', '--no-index', '--stdin'], {
      cwd: repo,
      encoding: 'utf8',
      // Trailing slashes are stripped: git reports any "dir/" path as ignored
      // when .gitignore contains a blank CRLF line.
      input: candidates.map((c) => c.resolved.replace(/\/+$/, '')).join('\n'),
    });
    ignored = new Set(out.split('\n').filter(Boolean));
  } catch (error) {
    if (error.status !== 1) throw error; // 1 = nothing ignored
  }
}
const missing = candidates
  .filter((c) => !ignored.has(c.resolved.replace(/\/+$/, '')))
  .map((c) => `${c.file}:${c.line}: ${c.ref} -> ${c.resolved}`);

if (missing.length > 0) {
  console.error(`Missing documentation references (${missing.length}):`);
  for (const m of missing) console.error(`  ${m}`);
  process.exit(1);
}
console.log(`Documentation references OK (${files.length} Markdown files checked).`);
