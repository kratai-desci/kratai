# Multi-Language Test Fixture

Demonstrates Kratai's ability to parse and visualize **all supported languages in one workspace**.

## Structure

```
src/
├── models/
│   ├── Product.ts          (TypeScript)
│   ├── Product.js          (JavaScript)
│   ├── Product.py          (Python)
│   └── Product.php         (PHP)
├── services/
│   ├── ProductService.ts   (TypeScript)
│   ├── ProductService.js   (JavaScript)
│   ├── ProductService.py   (Python)
│   └── ProductService.php  (PHP)
└── controllers/
    ├── ProductController.ts  (TypeScript)
    ├── ProductController.js  (JavaScript)
    ├── ProductController.py  (Python)
    └── ProductController.php (PHP)
```

## Features Tested

✅ **Multi-language parsing** - TypeScript, JavaScript, Python, PHP in one workspace
✅ **Same architecture pattern** - Product → ProductService → ProductController across all languages
✅ **Cross-language relationships** - See how Kratai visualizes polyglot codebases
✅ **Git diff highlighting** - Works for all languages simultaneously

## Use Case

Simulates a real-world scenario where:
- **Frontend**: TypeScript/JavaScript (React, Next.js)
- **Backend API**: Python (FastAPI) or PHP (Laravel)
- **Legacy code**: Mix of all languages

Run Kratai to see **all 13 classes in one diagram**! 🎨

## Results

When you run Kratai on this folder:
- **13 classes found**: 4 TypeScript (includes IProduct interface), 3 JavaScript, 3 Python, 3 PHP
- **8 relationships detected**: Each language's architecture tracked independently
- **Unique IDs prevent deduplication**: `src/models/Product.ts__Product` ≠ `src/models/Product.py__Product`

This validates Kratai's ability to handle polyglot codebases where the same class names appear across multiple languages.

## How to Use

1. Open this folder in VS Code
2. Press F5 to launch Kratai extension
3. Run "Kratai: Generate Class Diagram"
4. See all languages visualized together!
