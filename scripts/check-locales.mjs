import fs from 'fs/promises';
import path from 'path';

const localesDir = path.join(process.cwd(), 'src', 'locales');

function isObject(val) {
  return val && typeof val === 'object' && !Array.isArray(val);
}

function getMissing(reference, target, prefix = '') {
  const missing = [];

  for (const key of Object.keys(reference)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const refValue = reference[key];
    const targetValue = target ? target[key] : undefined;

    if (typeof refValue === 'string') {
      if (typeof targetValue !== 'string') missing.push(fullKey);
    } else if (isObject(refValue)) {
      if (!isObject(targetValue)) {
        missing.push(fullKey);
      } else {
        missing.push(...getMissing(refValue, targetValue, fullKey));
      }
    }
  }

  return missing;
}

function setNested(obj, pathArr, value) {
  let cur = obj;
  for (let i = 0; i < pathArr.length - 1; i++) {
    const p = pathArr[i];
    if (!isObject(cur[p])) cur[p] = {};
    cur = cur[p];
  }
  cur[pathArr[pathArr.length - 1]] = value;
}

async function main() {
  const files = await fs.readdir(localesDir);
  const jsonFiles = files.filter((f) => f.endsWith('.json'));

  if (!jsonFiles.includes('en.json')) {
    console.error('Reference file en.json not found in src/locales');
    process.exit(2);
  }

  const enPath = path.join(localesDir, 'en.json');
  const enRaw = await fs.readFile(enPath, 'utf8');
  const en = JSON.parse(enRaw);

  let totalFixed = 0;
  const report = [];

  for (const file of jsonFiles) {
    if (file === 'en.json') continue;

    const filePath = path.join(localesDir, file);
    const raw = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(raw);

    const missing = getMissing(en, data);

    if (missing.length === 0) continue;

    for (const key of missing) {
      const parts = key.split('.');
      // Obtain English value
      let ref = en;
      for (const p of parts) ref = ref[p];
      const fallback = typeof ref === 'string' ? ref : '';

      // Prefix to indicate translation needed
      const inserted = `[MISSING TRANSLATION] ${fallback}`;
      setNested(data, parts, inserted);
      totalFixed++;
    }

    // Write updated locale file (preserve formatting)
    await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

    report.push({ file, missingCount: missing.length, keys: missing });
  }

  if (report.length > 0) {
    console.log('Locale check - missing keys were auto-filled using English fallbacks:');
    for (const r of report) {
      console.log(`- ${r.file}: ${r.missingCount} keys added`);
    }
    console.log(`Total keys added: ${totalFixed}`);
  } else {
    console.log('Locale check - all locale files are complete.');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Locale check failed:', err);
  process.exit(1);
});
