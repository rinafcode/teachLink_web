#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Simple i18n validator: compare other locale files to en.json and fill missing keys
const LOCALES_DIR = path.join(__dirname, '../src/locales');
const REF_LANG = 'en.json';

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`Failed to parse ${file}:`, e);
    process.exit(2);
  }
}

function deepSet(obj, pathArr, value) {
  let cur = obj;
  for (let i = 0; i < pathArr.length - 1; i++) {
    const k = pathArr[i];
    if (!(k in cur) || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k];
  }
  cur[pathArr[pathArr.length - 1]] = value;
}

function deepWalk(ref, target, prefix = '') {
  const missing = [];
  for (const key of Object.keys(ref)) {
    const refVal = ref[key];
    const tgtVal = target ? target[key] : undefined;
    const full = prefix ? `${prefix}.${key}` : key;
    if (typeof refVal === 'string') {
      if (typeof tgtVal !== 'string') missing.push({ key: full, value: refVal });
    } else if (typeof refVal === 'object' && refVal !== null) {
      if (typeof tgtVal !== 'object' || tgtVal === null) {
        // entire subtree missing
        // collect all leaf strings from refVal
        const stack = [{ node: refVal, path: full }];
        while (stack.length) {
          const { node, path } = stack.pop();
          for (const k of Object.keys(node)) {
            const v = node[k];
            const p = `${path}.${k}`;
            if (typeof v === 'string') missing.push({ key: p, value: v });
            else if (typeof v === 'object') stack.push({ node: v, path: p });
          }
        }
      } else {
        missing.push(...deepWalk(refVal, tgtVal, full));
      }
    }
  }
  return missing;
}

function main() {
  if (!fs.existsSync(LOCALES_DIR)) {
    console.error('Locales directory not found:', LOCALES_DIR);
    process.exit(1);
  }

  const refPath = path.join(LOCALES_DIR, REF_LANG);
  if (!fs.existsSync(refPath)) {
    console.error('Reference locale not found:', refPath);
    process.exit(1);
  }

  const ref = readJson(refPath);

  const files = fs.readdirSync(LOCALES_DIR).filter((f) => f.endsWith('.json'));
  let totalMissing = 0;
  const report = {};

  for (const file of files) {
    if (file === REF_LANG) continue;
    const full = path.join(LOCALES_DIR, file);
    const data = readJson(full);

    const missing = deepWalk(ref, data);
    report[file] = missing.map((m) => m.key);
    totalMissing += missing.length;

    if (missing.length > 0) {
      // fill missing keys with English fallback
      for (const item of missing) {
        const parts = item.key.split('.');
        deepSet(data, parts, item.value);
      }
      fs.writeFileSync(full, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`Filled ${missing.length} missing i18n key(s) in ${file}`);
    } else {
      console.log(`No missing keys in ${file}`);
    }
  }

  if (totalMissing > 0) {
    console.warn(
      `i18n: Completed filling ${totalMissing} missing key(s). Please review translated values.`,
    );
    process.exit(0);
  }

  console.log('i18n: All locale files have complete key coverage.');
  process.exit(0);
}

main();
