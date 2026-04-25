#!/usr/bin/env node

/**
 * UI Validation Script
 * Checks for consistent icon usage and responsive Tailwind classes
 * Exit code 0 = pass, 1 = fail
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const COMPONENT_DIRS = ['components', 'app', 'pages'];

const DISALLOWED_ICONS = [
  { pattern: /from ['"]@heroicons\/react/g, name: '@heroicons/react' },
  { pattern: /from ['"]@fortawesome/g, name: '@fortawesome' },
  { pattern: /from ['"]react-feather/g, name: 'react-feather' },
];

let errors = [];
let warnings = [];

function getAllFiles(dir, extensions = ['.tsx', '.jsx', '.ts', '.js']) {
  let files = [];

  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files = files.concat(getAllFiles(fullPath, extensions));
    } else if (stat.isFile() && extensions.some((ext) => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

function checkIconUsage(content, filePath) {
  for (const { pattern, name } of DISALLOWED_ICONS) {
    if (pattern.test(content)) {
      errors.push(`[ICON] ${filePath}: Uses ${name} - should use lucide-react`);
    }
  }

  if (/from ['"]react-icons/g.test(content)) {
    warnings.push(`[ICON] ${filePath}: Uses react-icons - prefer lucide-react for consistency`);
  }
}

function checkResponsiveTailwind(content, filePath) {
  if (!content.includes('className')) return;

  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (/className=["'][^"']*\b(grid|flex)\b[^"']*["']/.test(line)) {
      const hasResponsive = /\b(sm|md|lg|xl|2xl):/.test(line);
      if (!hasResponsive && line.includes('grid-cols-') && !line.includes('grid-cols-1')) {
        warnings.push(
          `[RESPONSIVE] ${filePath}:${index + 1}: Grid layout may need responsive classes`,
        );
      }
    }
  });
}

function checkForConsoleStatements(content, filePath) {
  const matches = content.match(/console\.log\(/g);
  if (matches && matches.length > 0) {
    warnings.push(`[CONSOLE] ${filePath}: Contains ${matches.length} console.log statement(s)`);
  }
}

function validateFiles() {
  for (const dir of COMPONENT_DIRS) {
    const fullDir = path.join(SRC_DIR, dir);
    const files = getAllFiles(fullDir);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(process.cwd(), file);

      checkIconUsage(content, relativePath);
      checkResponsiveTailwind(content, relativePath);
      checkForConsoleStatements(content, relativePath);
    }
  }
}

function printResults() {
  if (warnings.length > 0) {
    console.log('\n[WARN] UI Validation Warnings:');
    warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  if (errors.length > 0) {
    console.error('\n[ERROR] UI Validation Errors:');
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  console.log('\n[OK] UI validation passed');
  process.exit(0);
}

validateFiles();
printResults();
