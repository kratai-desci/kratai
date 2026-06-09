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

Run Kratai to see **all 12 classes in one diagram**! 🎨

## How to Use

1. Open this folder in VS Code
2. Press F5 to launch Kratai extension
3. Run "Kratai: Generate Class Diagram"
4. See all languages visualized together!
