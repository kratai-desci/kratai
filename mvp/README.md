# Kratai — Code Visualizer

Understand your codebase at a glance across **TypeScript, JavaScript, Python, and PHP**. Kratai generates interactive **class diagrams** and **sequence diagrams** directly inside VS Code, with **git diff highlighting** so you can instantly see what changed between commits.

---

## Features

### Class Diagram
- Visualizes all classes, interfaces, and modules across **TypeScript, JavaScript, Python, and PHP**
- Organized by folder structure for easy navigation
- Shows properties, methods, visibility modifiers, and type hints
- Draws relationships: inheritance, implementation, and usage
- **Multi-language support** — handles polyglot codebases (e.g., TS frontend + Python backend)

### Git Diff Highlighting
- **Green** — added classes or methods
- **Yellow** — modified classes or methods
- **Red** — deleted classes or methods
- Compares against the previous commit automatically

### Sequence Diagram
- Click any method in the class diagram to trace its full call chain
- Shows which classes and instances are involved at each step
- Call site highlighting — new method calls appear green, removed calls red
- Supports static calls, instance calls, and chained calls
- **Currently supports:** TypeScript and JavaScript files
- **Coming soon:** Python and PHP support (infrastructure ready)

### Sidebar Actions
- **Generate Class Diagram** — scan and visualize your entire codebase
- **Show Git Changes** — summary of all changed files vs previous commit
- **Settings** — configure which folders to include, file types, and filters
- **Community & Feedback** — link to GitHub Discussions

---

## Getting Started

1. Open a project in VS Code (TypeScript, JavaScript, Python, or PHP)
2. Click the **Kratai** icon in the Activity Bar (left sidebar)
3. Click **Generate Class Diagram**
4. On first run, configure which folders to scan and click **Generate**
5. Click any method name in the diagram to open its **Sequence Diagram**

---

## Requirements

- A code project with supported languages: `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, or `.php` files
- A `git` repository (for git diff highlighting)
- VS Code 1.120.0 or higher

---

## Supported Languages

| Language | Status | Parser | Features |
|---|---|---|---|
| **TypeScript** | ✅ Full Support | TypeScriptParser | Generics, decorators, interfaces, React/NestJS patterns |
| **JavaScript** | ✅ Full Support | JavaScriptParser | ES6 classes, JSX, React hooks, function components |
| **Python** | ✅ Full Support | PythonParser | Type hints, async/await, Flask/FastAPI, protocols |
| **PHP** | ✅ Full Support | PHPParser | PHP 7.4+/8.0+ type hints, Laravel/Symfony, traits |

---

## Configuration

Kratai stores its settings in `.vscode/kratai.json` in your workspace. You can configure:

- **Folders to scan** — specify which source directories to include
- **File extensions** — `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.php`
- **Class type filters** — show/hide interfaces, modules, classes
- **Relationship type filters** — show/hide inheritance, usage, implementation
- **Git diff base commit** — defaults to `HEAD~1`

---

## Known Issues

- Very large codebases (1000+ classes) may render slowly
- Sequence diagram tracing is currently TypeScript and JavaScript only (Python/PHP support in development)

---

## Release Notes

### 1.0.0
- **Multi-language support** — TypeScript, JavaScript, Python, and PHP
- Interactive class diagram with folder-based layout
- **Strategy Pattern architecture** — Add new languages with ~10 lines of code
- Sequence diagram generation by clicking any method (TypeScript)
- Git diff highlighting — added, modified, and deleted detection
- **Unique ID system** — Handles same class names across languages
- Configurable folder and class type filters
- 23+ test fixtures validating parser capabilities

---

## Links

- [Website](https://kratai.com)
- [GitHub Repository](https://github.com/Rabbit-CollectiveScience/kratai-core)
- [Report an Issue](https://github.com/Rabbit-CollectiveScience/kratai-core/issues)
- [Community Discussions](https://github.com/Rabbit-CollectiveScience/kratai-core/discussions)
