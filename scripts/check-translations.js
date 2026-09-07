#!/usr/bin/env node
/**
 * LexiMind AI — Automated Translation Parity Verification Script
 * Validates 100% key parity between English and Vietnamese locale dictionaries.
 */

const fs = require('fs');
const path = require('path');

function extractKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(extractKeys(v, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

function parseTsDictionary(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Simple extraction of keys by regex or by evaluation
  const lines = content.split('\n');
  const keys = [];
  const stack = [];

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) continue;

    // Detect key object opening e.g. "common: {" or "timeframe: {"
    const objMatch = line.match(/^([a-zA-Z0-9_]+)\s*:\s*\{/);
    if (objMatch) {
      stack.push(objMatch[1]);
      continue;
    }

    // Detect key string/val e.g. "save: 'Save',"
    const propMatch = line.match(/^([a-zA-Z0-9_]+)\s*:\s*['"`]/);
    if (propMatch) {
      const fullKey = [...stack, propMatch[1]].join('.');
      keys.push(fullKey);
      continue;
    }

    // Detect closing brace
    if (line.startsWith('}') || line.startsWith('},')) {
      stack.pop();
    }
  }
  return keys;
}

const localesDir = path.resolve(__dirname, '../apps/web/src/i18n/locales');
console.log('🔍 Auditing LexiMind AI Translation Parity...');

const enFiles = ['finance.ts', 'feedback.ts', 'support.ts', 'admin.ts'];
let totalMismatches = 0;

for (const file of enFiles) {
  const enPath = path.join(localesDir, 'en', file);
  const viPath = path.join(localesDir, 'vi', file);

  if (!fs.existsSync(enPath) || !fs.existsSync(viPath)) {
    console.error(`❌ Missing pair file: ${file}`);
    totalMismatches++;
    continue;
  }

  const enKeys = parseTsDictionary(enPath);
  const viKeys = parseTsDictionary(viPath);

  const missingInVi = enKeys.filter((k) => !viKeys.includes(k));
  const missingInEn = viKeys.filter((k) => !enKeys.includes(k));

  if (missingInVi.length > 0) {
    console.error(`⚠️  [${file}] Missing in Vietnamese (${missingInVi.length}):`, missingInVi);
    totalMismatches += missingInVi.length;
  }
  if (missingInEn.length > 0) {
    console.error(`⚠️  [${file}] Missing in English (${missingInEn.length}):`, missingInEn);
    totalMismatches += missingInEn.length;
  }

  if (missingInVi.length === 0 && missingInEn.length === 0) {
    console.log(`✅ [${file}] 100% Parity (${enKeys.length} keys verified).`);
  }
}

if (totalMismatches === 0) {
  console.log('\n🎉 ALL TRANSLATION DOMAINS VERIFIED SUCCESSFULLY WITH 100% KEY PARITY!');
  process.exit(0);
} else {
  console.error(`\n❌ Translation audit failed with ${totalMismatches} key mismatches.`);
  process.exit(1);
}
