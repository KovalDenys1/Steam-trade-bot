#!/usr/bin/env node

/**
 * Quick Start Setup Script
 * Helps initialize the bot and verify configuration
 */

const fs = require('fs');
const path = require('path');
const { initDB } = require('./database');

console.log('🚀 Steam Trade Bot - Quick Start Setup\n');
console.log('='.repeat(60));

async function checkSetup() {
  const checks = [];

  // 1. Check .env file
  console.log('\n1. Checking environment configuration...');
  const envPath = path.join(__dirname, '../.env');
  const envExists = fs.existsSync(envPath);

  if (envExists) {
    console.log('   ✅ .env file found');

    // Check required variables
    require('dotenv').config();
    const required = [
      'STEAM_USERNAME',
      'STEAM_PASSWORD',
      'STEAM_SHARED_SECRET',
      'STEAM_IDENTITY_SECRET',
      'PG_HOST',
      'PG_DATABASE',
      'PG_USER',
      'PG_PASSWORD'
    ];

    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      console.log(`   ⚠️  Missing variables: ${missing.join(', ')}`);
      checks.push(false);
    } else {
      console.log('   ✅ All required variables configured');
      checks.push(true);
    }
  } else {
    console.log('   ❌ .env file not found');
    console.log('   📝 Create .env file with required variables');
    checks.push(false);
  }

  // 2. Check cookies
  console.log('\n2. Checking Steam authentication...');
  const cookiesPath = path.join(__dirname, '../cookies.json');
  const cookiesExist = fs.existsSync(cookiesPath);

  if (cookiesExist) {
    console.log('   ✅ cookies.json found');
    console.log('   ℹ️  Run auth.js to refresh if needed');
    checks.push(true);
  } else {
    console.log('   ⚠️  cookies.json not found');
    console.log('   📝 Run: node src/auth.js');
    checks.push(false);
  }

  // 3. Check database
  console.log('\n3. Checking database connection...');
  try {
    await initDB();
    console.log('   ✅ Database connected and initialized');
    checks.push(true);
  } catch (error) {
    console.log('   ❌ Database connection failed');
    console.log(`   Error: ${error.message}`);
    checks.push(false);
  }

  // 4. Check node_modules
  console.log('\n4. Checking dependencies...');
  const nodeModulesPath = path.join(__dirname, '../node_modules');
  const nodeModulesExist = fs.existsSync(nodeModulesPath);

  if (nodeModulesExist) {
    console.log('   ✅ Dependencies installed');
    checks.push(true);
  } else {
    console.log('   ❌ Dependencies not installed');
    console.log('   📝 Run: npm install');
    checks.push(false);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Setup Summary:\n');

  const passed = checks.filter(c => c).length;
  const total = checks.length;

  console.log(`   ${passed}/${total} checks passed`);

  if (passed === total) {
    console.log('\n✅ All checks passed! Bot is ready to use.\n');
    console.log('📝 Next steps:');
    console.log('   1. node src/scheduler.js  # Collect price data (run 24h+)');
    console.log('   2. npm run analytics      # View market insights');
    console.log('   3. npm run buy-ml         # ML-powered auto-buy');
    console.log('   4. npm run sell           # Smart auto-sell');
    console.log('\n📖 Read ML_GUIDE.md for detailed instructions\n');
  } else {
    console.log('\n⚠️  Some checks failed. Please fix the issues above.\n');
    console.log('📖 See README.md for setup instructions\n');
  }

  console.log('='.repeat(60));
  process.exit(passed === total ? 0 : 1);
}

// Run checks
checkSetup().catch(error => {
  console.error('\n❌ Setup check failed:', error.message);
  process.exit(1);
});
