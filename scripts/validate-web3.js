#!/usr/bin/env node

/**
 * Web3 Validation Script
 * Validates wallet provider setup and environment configuration
 * Exit code 0 = pass, 1 = fail
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');

let errors = [];
let warnings = [];

function checkWalletProviderExists() {
  const providerPath = path.join(SRC_DIR, 'providers/WalletProvider.tsx');
  
  if (!fs.existsSync(providerPath)) {
    errors.push('[WEB3] WalletProvider.tsx not found in src/providers/');
    return false;
  }
  
  const content = fs.readFileSync(providerPath, 'utf-8');
  
  // Check for error handling
  if (!content.includes('try') || !content.includes('catch')) {
    errors.push('[WEB3] WalletProvider should have try-catch error handling');
  }
  
  // Check for SSR safety
  if (!content.includes("typeof window")) {
    warnings.push('[WEB3] WalletProvider should check for SSR (typeof window)');
  }
  
  // Check for graceful fallback
  if (!content.includes('useContext') || !content.includes('null')) {
    warnings.push('[WEB3] useWallet hook should handle missing provider gracefully');
  }
  
  return true;
}

function checkWeb3Utils() {
  const utilsPath = path.join(SRC_DIR, 'utils/web3/index.ts');
  
  if (!fs.existsSync(utilsPath)) {
    errors.push('[WEB3] utils/web3/index.ts not found');
    return false;
  }
  
  const envValidationPath = path.join(SRC_DIR, 'utils/web3/envValidation.ts');
  if (!fs.existsSync(envValidationPath)) {
    errors.push('[WEB3] utils/web3/envValidation.ts not found');
    return false;
  }
  
  const content = fs.readFileSync(envValidationPath, 'utf-8');
  
  // Check for network validation
  if (!content.includes('NEXT_PUBLIC_STARKNET')) {
    warnings.push('[WEB3] Environment validation should check NEXT_PUBLIC_STARKNET_* vars');
  }
  
  return true;
}

function checkEnvExample() {
  const envExamplePath = path.join(__dirname, '../.env.example');
  const envLocalPath = path.join(__dirname, '../.env.local.example');
  
  if (!fs.existsSync(envExamplePath) && !fs.existsSync(envLocalPath)) {
    warnings.push('[WEB3] Consider adding .env.example with NEXT_PUBLIC_STARKNET_* variables');
  }
}

function printResults() {
  console.log('🔍 Running Web3 validation checks...\n');
  
  checkWalletProviderExists();
  checkWeb3Utils();
  checkEnvExample();
  
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:\n');
    warnings.forEach(w => console.log(`  ${w}`));
    console.log('');
  }
  
  if (errors.length > 0) {
    console.log('❌ Errors:\n');
    errors.forEach(e => console.log(`  ${e}`));
    console.log('');
    console.log(`\n❌ Web3 validation failed with ${errors.length} error(s)`);
    process.exit(1);
  }
  
  console.log(`✅ Web3 validation passed (${warnings.length} warning(s))`);
  process.exit(0);
}

// Run validation
printResults();
