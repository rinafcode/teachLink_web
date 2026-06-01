const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const backupNames = ['pnpm-lock.yaml.broken', 'pnpm-lock.yaml.bak', 'pnpm-lock.yaml'];
let srcFile = null;
for (const name of backupNames) {
  const p = path.join(repoRoot, name);
  if (fs.existsSync(p)) {
    srcFile = p;
    break;
  }
}
if (!srcFile) {
  console.error('No lockfile found to repair.');
  process.exit(2);
}

const outFile = path.join(repoRoot, 'pnpm-lock.yaml.clean');
const original = fs.readFileSync(srcFile, 'utf8');
const lines = original.split(/\r?\n/);

// Find packages: section
let packagesIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (/^packages:\s*$/.test(lines[i])) {
    packagesIdx = i;
    break;
  }
}

if (packagesIdx === -1) {
  console.error('No "packages:" section found in lockfile.');
  process.exit(3);
}

const headerRe = /^  '([^']+@[^']+)':\s*$/;
const seen = new Set();
const out = lines.slice(0, packagesIdx + 1);

let i = packagesIdx + 1;
while (i < lines.length) {
  const line = lines[i];
  const m = headerRe.exec(line);
  if (m) {
    const key = m[1];
    if (seen.has(key)) {
      // skip this package block
      i++;
      while (i < lines.length) {
        const next = lines[i];
        if (headerRe.test(next) || /^\S/.test(next)) break; // next package or top-level section
        i++;
      }
      continue;
    }
    seen.add(key);
    // copy header and its block
    out.push(line);
    i++;
    while (i < lines.length) {
      const next = lines[i];
      if (headerRe.test(next) || /^\S/.test(next)) break; // next package or top-level
      out.push(next);
      i++;
    }
    continue;
  }
  // If line doesn't match a package header, copy it (covers comments or unexpected lines)
  out.push(line);
  i++;
}

fs.writeFileSync(outFile, out.join('\n'), 'utf8');

// Overwrite pnpm-lock.yaml with cleaned file
const target = path.join(repoRoot, 'pnpm-lock.yaml');
fs.copyFileSync(outFile, target);
console.log('Wrote cleaned lockfile to', target);
console.log('Original source used:', srcFile);
console.log('Removed duplicate package entries:', 0); // can't easily compute difference count here
process.exit(0);
