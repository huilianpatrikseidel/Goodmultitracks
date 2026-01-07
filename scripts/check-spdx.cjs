#!/usr/bin/env node
/*
  SPDX license header check.
  Fails if any .ts/.tsx under src/ or .rs under src-tauri/src/ lacks:
  "SPDX-License-Identifier: GPL-2.0-only" in the first 10 lines.
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TARGETS = [
  { base: path.join(ROOT, 'src'), exts: new Set(['.ts', '.tsx']) },
  { base: path.join(ROOT, 'src-tauri', 'src'), exts: new Set(['.rs']) },
];
const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'build', 'dist', '.idea', '.vscode'
]);
const NEEDLE = 'SPDX-License-Identifier: GPL-2.0-only';

function walk(dir, exts, out) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.DS_Store')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(p, exts, out);
    } else {
      const ext = path.extname(entry.name);
      if (exts.has(ext)) out.push(p);
    }
  }
}

function hasSpdxHeader(file) {
  const buf = fs.readFileSync(file, 'utf8');
  const firstLines = buf.split(/\r?\n/, 10).join('\n');
  return firstLines.includes(NEEDLE);
}

let missing = [];
for (const t of TARGETS) {
  const files = [];
  walk(t.base, t.exts, files);
  for (const f of files) {
    if (!hasSpdxHeader(f)) missing.push(path.relative(ROOT, f));
  }
}

if (missing.length) {
  console.error('\nSPDX header missing in files:');
  for (const m of missing) console.error(' - ' + m);
  console.error('\nEach file must contain:');
  console.error('  // SPDX-License-Identifier: GPL-2.0-only');
  process.exit(1);
}

console.log('All checked files contain SPDX headers.');
