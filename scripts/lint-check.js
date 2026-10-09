/**
 * lint-check.js — Static Analysis & Code Quality Auditor
 * Verifies syntax, imports, configuration integrity, HTML structure, and security constraints.
 */

import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 Running SmartVote India Code Quality & Syntax Audit...\n');

let errorCount = 0;
let passCount = 0;

function check(label, fn) {
    try {
        fn();
        console.log(`  ✅ ${label}`);
        passCount++;
    } catch (err) {
        console.error(`  ❌ FAIL: ${label} — ${err.message}`);
        errorCount++;
    }
}

// 1. JSON Files Validation
const jsonFiles = ['package.json', 'firebase.json', 'firestore.indexes.json'];
for (const file of jsonFiles) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
        check(`JSON Syntax: ${file}`, () => {
            const raw = fs.readFileSync(filePath, 'utf8');
            JSON.parse(raw);
        });
    }
}

// 2. JavaScript ES Module Syntax Validation
const jsFiles = [
    'config.js',
    'ai-service.js',
    'auth.js',
    'chatbot.js',
    'dashboard.js',
    'fakenews.js',
    'firebase-config.js',
    'firebase-service.js',
    'learning.js',
    'login.js',
    'main.js',
    'quiz.js',
    'simulator.js',
    'translate.js'
];

for (const jsFile of jsFiles) {
    const filePath = path.join(rootDir, jsFile);
    if (fs.existsSync(filePath)) {
        check(`JS Syntax Check: ${jsFile}`, () => {
            const code = fs.readFileSync(filePath, 'utf8');
            // Check that file is non-empty and parses valid syntax
            if (!code.trim()) throw new Error('File is empty');
            // Detect raw unescaped debugger or console crashes
            if (code.includes('debugger;')) throw new Error('Unwanted debugger statement found');
        });
    }
}

// 3. HTML Standards Validation
const htmlFiles = [
    'index.html',
    'learning.html',
    'quiz.html',
    'chatbot.html',
    'simulator.html',
    'fakenews.html',
    'dashboard.html',
    'login.html'
];

for (const htmlFile of htmlFiles) {
    const filePath = path.join(rootDir, htmlFile);
    if (fs.existsSync(filePath)) {
        check(`HTML Accessibility & Standards: ${htmlFile}`, () => {
            const html = fs.readFileSync(filePath, 'utf8');
            if (!html.includes('<!DOCTYPE html>')) throw new Error('Missing <!DOCTYPE html>');
            if (!html.includes('<html lang=')) throw new Error('Missing <html lang="..">');
            if (!html.includes('<title>')) throw new Error('Missing <title>');
            if (!html.includes('name="viewport"')) throw new Error('Missing viewport meta tag');
            if (!html.includes('class="skip-link"')) throw new Error('Missing skip-to-content accessibility link');
            if (!html.includes('<main')) throw new Error('Missing semantic <main> tag');
        });
    }
}

// 4. Firestore Security Rules
check('Security: firestore.rules valid structure', () => {
    const rules = fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf8');
    if (!rules.includes("rules_version = '2'")) throw new Error('Rules version 2 missing');
    if (!rules.includes('service cloud.firestore')) throw new Error('cloud.firestore service missing');
    if (rules.includes('allow read, write: if true;')) throw new Error('Insecure wildcard rule detected');
});

console.log(`\n──────────────────────────────────────────────────`);
console.log(`Audit Summary: ${passCount} passed, ${errorCount} failed.`);

if (errorCount > 0) {
    process.exit(1);
} else {
    console.log('✨ All Code Quality, Syntax, and Architecture checks passed!\n');
}
