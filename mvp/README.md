# Kratai — Code Visualizer

Understand your TypeScript codebase at a glance. Kratai generates interactive **class diagrams** and **sequence diagrams** directly inside VS Code, with **git diff highlighting** so you can instantly see what changed between commits.

---

## Features

### Class Diagram
- Visualizes all classes, interfaces, and modules in your TypeScript project
- Organized by folder structure for easy navigation
- Shows properties, methods, and visibility modifiers
- Draws relationships: inheritance, implementation, and usage

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

### Sidebar Actions
- **Generate Class Diagram** — scan and visualize your entire codebase
- **Show Git Changes** — summary of all changed files vs previous commit
- **Settings** — configure which folders to include, file types, and filters
- **Community & Feedback** — link to GitHub Discussions

---

## Getting Started

1. Open a TypeScript project in VS Code
2. Click the **Kratai** icon in the Activity Bar (left sidebar)
3. Click **Generate Class Diagram**
4. On first run, configure which folders to scan and click **Generate**
5. Click any method name in the diagram to open its **Sequence Diagram**

---

## Requirements

- A TypeScript project (`.ts` or `.tsx` files)
- A `git` repository (for git diff highlighting)
- VS Code 1.120.0 or higher

---

## Configuration

Kratai stores its settings in `.vscode/kratai.json` in your workspace. You can configure:

- **Folders to scan** — specify which source directories to include
- **File extensions** — `.ts`, `.tsx`, and more
- **Class type filters** — show/hide interfaces, modules, classes
- **Relationship type filters** — show/hide inheritance, usage, implementation
- **Git diff base commit** — defaults to `HEAD~1`

---

## Known Issues

- Only TypeScript projects are supported currently (JavaScript support planned)
- Very large codebases (1000+ classes) may render slowly

---

## Release Notes

### 1.0.0
- Interactive class diagram with folder-based layout
- Sequence diagram generation by clicking any method
- Git diff highlighting — added, modified, and deleted detection
- Configurable folder and class type filters

---

## Links

- [Website](https://kratai.com)
- [GitHub Repository](https://github.com/Rabbit-CollectiveScience/kratai-core)
- [Report an Issue](https://github.com/Rabbit-CollectiveScience/kratai-core/issues)
- [Community Discussions](https://github.com/Rabbit-CollectiveScience/kratai-core/discussions)
