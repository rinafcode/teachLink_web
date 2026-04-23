/**
 * validate-i18n.js — Build-time translation key validation
 *
 * Loads en.json as the reference and compares every other locale file
 * in src/locales/ to ensure key parity.  Exits with code 1 if any
 * locale has missing or extra keys.
 *
 * Usage:  node scripts/validate-i18n.js
 */

import { readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const LOCALES_DIR = join(__dirname, '..', 'src', 'locales');
const REFERENCE_LANG = 'en';

// ── helpers ──────────────────────────────────────────────────────────

/** Recursively collect every leaf-key path from a nested object. */
function getKeys(obj, prefix = '') {
  const keys = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys.push(...getKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// ── main ─────────────────────────────────────────────────────────────

function main() {
  // Discover locale JSON files
  const files = readdirSync(LOCALES_DIR).filter(
    (f) => f.endsWith('.json')
  );

  if (files.length === 0) {
    console.error('❌ No locale JSON files found in', LOCALES_DIR);
    process.exit(1);
  }

  // Load reference
  const refFile = `${REFERENCE_LANG}.json`;
  if (!files.includes(refFile)) {
    console.error(`❌ Reference locale file "${refFile}" not found`);
    process.exit(1);
  }

  const refPath = join(LOCALES_DIR, refFile);
  const refData = JSON.parse(readFileSync(refPath, 'utf-8'));
  const refKeys = getKeys(refData).sort();

  console.log(`\n📖 Reference: ${refFile} (${refKeys.length} keys)\n`);

  let hasErrors = false;

  for (const file of files) {
    if (file === refFile) continue;

    const lang = basename(file, '.json');
    const filePath = join(LOCALES_DIR, file);

    let data;
    try {
      data = JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch (err) {
      console.error(`❌ ${lang}: Failed to parse ${file} — ${err.message}`);
      hasErrors = true;
      continue;
    }

    const langKeys = getKeys(data).sort();

    const missing = refKeys.filter((k) => !langKeys.includes(k));
    const extra = langKeys.filter((k) => !refKeys.includes(k));

    if (missing.length === 0 && extra.length === 0) {
      console.log(`  ✅ ${lang}: All ${refKeys.length} keys present`);
    } else {
      hasErrors = true;

      if (missing.length > 0) {
        console.error(`  ❌ ${lang}: ${missing.length} MISSING key(s):`);
        missing.forEach((k) => console.error(`      - ${k}`));
      }

      if (extra.length > 0) {
        console.warn(`  ⚠️  ${lang}: ${extra.length} EXTRA key(s):`);
        extra.forEach((k) => console.warn(`      + ${k}`));
      }
    }
  }

  console.log('');

  if (hasErrors) {
    console.error('❌ Translation validation FAILED — fix the issues above.\n');
    process.exit(1);
  }

  console.log('✅ All translations are complete and in sync.\n');
  process.exit(0);
}

main();
