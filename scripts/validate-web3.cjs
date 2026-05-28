#!/usr/bin/env node

/**
 * Web3 Validation Script
 * Validates wallet provider setup and environment configuration.
 * Exit code 0 = pass, 1 = fail
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');

const warnings = [];
const errors = [];

function checkWalletProviderExists() {
  const providerPath = path.join(SRC_DIR, 'providers/WalletProvider.tsx');

  if (!fs.existsSync(providerPath)) {
    errors.push('[WEB3] WalletProvider.tsx not found in src/providers/');
    return;
  }

  const content = fs.readFileSync(providerPath, 'utf-8');

  if (!content.includes('try') || !content.includes('catch')) {
    errors.push('[WEB3] WalletProvider should have try-catch error handling');
  }

  if (!content.includes('typeof window')) {
    warnings.push('[WEB3] WalletProvider should check for SSR (typeof window)');
  }

  if (!content.includes('useContext') || !content.includes('null')) {
    warnings.push('[WEB3] useWallet hook should handle missing provider gracefully');
  }
}

function checkWeb3Utils() {
  const utilsPath = path.join(SRC_DIR, 'utils/web3/index.ts');
  const envValidationPath = path.join(SRC_DIR, 'utils/web3/envValidation.ts');

  if (!fs.existsSync(utilsPath)) {
    errors.push('[WEB3] utils/web3/index.ts not found');
    return;
  }

  if (!fs.existsSync(envValidationPath)) {
    errors.push('[WEB3] utils/web3/envValidation.ts not found');
    return;
  }

  const content = fs.readFileSync(envValidationPath, 'utf-8');

  if (!content.includes('NEXT_PUBLIC_STARKNET')) {
    warnings.push('[WEB3] Environment validation should check NEXT_PUBLIC_STARKNET_* vars');
  }
}

function checkEnvExample() {
  const envExamplePath = path.join(__dirname, '../.env.example');
  const envLocalPath = path.join(__dirname, '../.env.local.example');

  if (!fs.existsSync(envExamplePath) && !fs.existsSync(envLocalPath)) {
    warnings.push('[WEB3] Consider adding .env.example with NEXT_PUBLIC_STARKNET_* variables');
  }
}

function printResults() {
  console.log('Running Web3 validation checks...\n');

  checkWalletProviderExists();
  checkWeb3Utils();
  checkEnvExample();

  if (warnings.length > 0) {
    console.log('Warnings:\n');
    warnings.forEach((warning) => console.log(`  ${warning}`));
    console.log('');
  }

  if (errors.length > 0) {
    console.log('Errors:\n');
    errors.forEach((error) => console.log(`  ${error}`));
    console.log('');
    console.log(`Web3 validation failed with ${errors.length} error(s)`);
    process.exit(1);
  }

  console.log(`Web3 validation passed (${warnings.length} warning(s))`);
  process.exit(0);
}

printResults();
