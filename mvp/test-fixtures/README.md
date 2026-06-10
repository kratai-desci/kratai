# Test Fixtures

Comprehensive test suite for Kratai's multi-language code visualization features.

## Overview

These fixtures validate Kratai's ability to parse, analyze, and visualize code across **4 programming languages**: TypeScript, JavaScript, Python, and PHP.

## Structure

```
test-fixtures/
├── all-languages/     ✅ Multi-language integration (13 classes, 8 relationships)
├── typescript/        ✅ 7 scenarios - React, Next.js, NestJS, Design Patterns
├── javascript/        ✅ 2 scenarios - ES6 classes, React components
├── python/            ✅ 7 scenarios - Flask, FastAPI, Design Patterns
└── php/               ✅ 7 scenarios - Laravel, Symfony, Design Patterns
```

## Language Support Status

| Language | Status | Parser | Scenarios | Key Features |
|---|---|---|---|---|
| **TypeScript** | ✅ Supported | TypeScriptParser | 7 | Generics, decorators, React, NestJS |
| **JavaScript** | ✅ Supported | JavaScriptParser | 2 | ES6 classes, JSX, React hooks |
| **Python** | ✅ Supported | PythonParser | 7 | Type hints, FastAPI, Flask, async |
| **PHP** | ✅ Supported | PHPParser | 7 | Type hints (7.4+), Laravel, traits |

## Test Categories

### 🌍 Multi-Language Integration (`all-languages/`)
Tests that multiple languages work together in one workspace. Validates unique ID system for same class names across languages (e.g., Product.ts vs Product.py).

**Result:** 13 classes, 8 relationships across 4 languages in one diagram.

### 📘 Language-Specific Tests
Each language has 2-7 scenarios testing OOP features, frameworks, and design patterns. See individual README files for details.

## Quick Start

### Test Individual Parser
```bash
cd /Users/nightrabbit/Documents/GitHub/kratai/mvp
node test-ts-parser.js     # TypeScript
node test-js-parser.js     # JavaScript  
node test-python-parser.js # Python
node test-php-parser.js    # PHP
```

### Test All Languages Together
```bash
node test-all-languages.js  # All 4 languages in one workspace
```

### Visual Testing (VS Code)
1. Press **F5** to launch Kratai extension
2. Open any test fixture folder
3. Run **"Kratai: Generate Class Diagram"**

## Adding New Test Fixtures

When creating new test projects:
1. ✅ Keep them minimal and focused on one concept
2. ✅ Include README explaining what's being tested
3. ✅ Add line numbers for git diff highlighting
4. ✅ Commit source only, not build artifacts
5. ✅ Test that relationships are detected correctly

## Related Documentation

- [Architecture Guide](../docs/architecture.md) - Strategy Pattern for multi-language support
- [Parser Development](../docs/architecture.md#-multi-language-support-adding-new-programming-languages) - How to add new languages
