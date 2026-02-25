#!/usr/bin/env node

/**
 * UI Validation Script
 * Checks for consistent icon usage and responsive Tailwind classes
 * Exit code 0 = pass, 1 = fail
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = path.join(__dirname, '../src');
const COMPONENT_DIRS = ['components', 'app', 'pages'];

// Disallowed icon libraries (should use lucide-react)
const DISALLOWED_ICONS = [
  { pattern: /from ['"]@heroicons\/react/g, name: '@heroicons/react' },
  { pattern: /from ['"]@fortawesome/g, name: '@fortawesome' },
  { pattern: /from ['"]react-feather/g, name: 'react-feather' },
];

// Required responsive breakpoints for key layout patterns
const RESPONSIVE_PATTERNS = [
  { pattern: /\bflex\b/, shouldHave: ['sm:', 'md:', 'lg:'], context: 'flex layouts' },
  { pattern: /\bgrid\b/, shouldHave: ['sm:', 'md:', 'lg:'], context: 'grid layouts' },
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
    } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
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
  
  // Check for react-icons usage (warning, not error)
  if (/from ['"]react-icons/g.test(content)) {
    warnings.push(`[ICON] ${filePath}: Uses react-icons - prefer lucide-react for consistency`);
  }
}

function checkResponsiveTailwind(content, filePath) {
  // Only check component files that have className
  if (!content.includes('className')) return;
  
  // Check for common layout patterns without responsive variants
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Check for grid/flex without any responsive classes
    if (/className=["'][^"']*\b(grid|flex)\b[^"']*["']/.test(line)) {
      const hasResponsive = /\b(sm|md|lg|xl|2xl):/.test(line);
      if (!hasResponsive && line.includes('grid-cols-') && !line.includes('grid-cols-1')) {
        warnings.push(`[RESPONSIVE] ${filePath}:${index + 1}: Grid layout may need responsive classes`);
      }
    }
  });
}

function checkForConsoleStatements(content, filePath) {
  // Allow console.warn and console.error, flag console.log
  const matches = content.match(/console\.log\(/g);
  if (matches && matches.length > 0) {
    warnings.push(`[CONSOLE] ${filePath}: Contains ${matches.length} console.log statement(s)`);
  }
}

function validateFiles() {
  console.log('🔍 Running UI validation checks...\n');
  
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
    console.log('⚠️  Warnings:\n');
    warnings.forEach(w => console.log(`  ${w}`));
    console.log('');
  }
  
  if (errors.length > 0) {
    console.log('❌ Errors:\n');
    errors.forEach(e => console.log(`  ${e}`));
    console.log('');
    console.log(`\n❌ UI validation failed with ${errors.length} error(s)`);
    process.exit(1);
  }
  
  console.log(`✅ UI validation passed (${warnings.length} warning(s))`);
  process.exit(0);
}

// Run validation
validateFiles();
printResults();
