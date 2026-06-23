# Kratai — Code Visualizer

Understand your codebase at a glance across **TypeScript, JavaScript, Python, and PHP**. Kratai generates interactive **class diagrams** directly inside VS Code, with **git diff highlighting** to show your uncommitted changes.

![Kratai in Action](https://raw.githubusercontent.com/kratai-desci/kratai/main/demo/demo.gif)

---

## ✨ Key Features

- 🗺️ **Interactive Class Diagrams** — Visualize your entire codebase with folder-based organization
- 🖱️ **Click-to-Jump** — Click any method or property to instantly open file and highlight the code
- 💡 **Click-to-Highlight** — Click any class to highlight it and its dependencies (press ESC to clear)
- 📂 **Hover-to-Open** — Three-dot button appears on hover to instantly open files in editor
- 📊 **Git Diff Highlighting** — See uncommitted changes at a glance (green = added, red = deleted)
- 🌍 **Multi-Language Support** — Works with TypeScript, JavaScript, Python, and PHP in the same project
- 🧠 **Framework-Aware** — Automatically detects and enriches Django and Next.js projects
- 🎯 **Smart Relationships** — Auto-detects inheritance, interfaces, dependencies, and framework-specific patterns
- ⚙️ **Fully Configurable** — Choose which folders, files, and relationships to display

**Framework Enrichment (Automatic Detection):**
- **Django** (✅ Fully Supported): View → Template relationships, ORM models (ForeignKey, ManyToMany), REST Framework (ViewSets, Serializers)
- **Next.js** (✅ Fully Supported): Component → Component (JSX), Component → Type/DTO, Component → API routes (fetch calls)
- **React, Laravel, Symfony** (⏳ Planned): Coming in future releases

---

## 🚀 Getting Started

1. **Install** the extension from VS Code Marketplace
2. **Open** a project with `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, or `.php` files
3. **Click** the Kratai icon in the Activity Bar (left sidebar)
4. **Configure** which folders to scan (root folder selected by default on first run)
5. **Generate** your class diagram and start exploring!

**Interactive Tips:**
- **Click a class** to highlight its dependencies (black outline = focused, grey = related)
- **Click any method or property** to open the file and jump directly to the definition
- **Hover over a class** and click the ⋮ button to open its source file
- **Press ESC** to clear highlights and return to full view

---

## 📸 Visual Tour

### Class Diagram with Uncommitted Changes
See your entire codebase structure with color-coded uncommitted changes:

![Class Diagram Example](https://raw.githubusercontent.com/kratai-desci/kratai/main/demo/demo_ss_1.png)

### Click-to-Jump Navigation
Click any method or property to instantly open the file with precise highlighting:

![Click-to-Jump](https://raw.githubusercontent.com/kratai-desci/kratai/main/demo/demo_ss_2.png)

**Note:** Green/red git diff highlighting only appears when you have uncommitted changes.

### Easy Configuration
Control exactly what gets visualized with the built-in settings panel:

![Configuration Panel](https://raw.githubusercontent.com/kratai-desci/kratai/main/demo/demo_ss_4.png)

---

## 🌐 Supported Languages & Frameworks

| Language | Status | Parser | Framework Enrichment |
|---|---|---|---|
| **TypeScript** | ✅ Full Support | TypeScriptParser | Next.js (✅ Component rendering, type usage, fetch calls) |
| **JavaScript** | ✅ Full Support | JavaScriptParser | Next.js (✅ JSX components) |
| **Python** | ✅ Full Support | PythonParser | Django (✅ Views, Templates, ORM, DRF) |
| **PHP** | ✅ Full Support | PHPParser | Laravel/Symfony (⏳ Planned) |

**Framework Enrichment Status:**
- **✅ Django:** Fully implemented — View → Template (`template_name`, `render()`), ORM relationships (ForeignKey, ManyToMany), REST Framework (ViewSets → Serializers), URL routing, middleware detection
- **✅ Next.js:** Fully implemented — Component → Component (JSX like `<UserList />`), Component → Type/DTO (`useState<UserDTO>`), Component → API routes (`fetch('/api/users')`), HTTP method detection
- **⏳ React (standalone):** Planned for future release
- **⏳ Laravel:** Planned for future release
- **⏳ Symfony:** Planned for future release

**Note:** You can still visualize TypeScript/JavaScript/PHP codebases without framework enrichment — you'll get standard class diagrams with inheritance, interfaces, and dependencies. Framework enrichment adds deeper insights specific to Django and Next.js projects.

---

## ⚙️ Configuration

Kratai stores settings in `.vscode/kratai.json` in your workspace:

- **Folders to scan** — Root folder selected by default; customize to include only specific directories
- **File extensions** — Select languages: `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.php`
- **Class type filters** — Show/hide interfaces, modules, classes
- **Relationship type filters** — Show/hide inheritance, usage, implementation
- **Git diff highlighting** — Toggle on/off to show uncommitted changes

**First-Time Setup:** On your first diagram generation, Kratai opens the configuration panel with the root folder pre-selected. You can adjust settings and click "Save & Generate Diagram" to proceed.

---

## 📋 Requirements

- VS Code 1.120.0 or higher
- A code project with supported languages
- Git repository (optional, for diff highlighting)

---

## ⚠️ Known Issues

- Very large codebases (1000+ classes) may render slowly

---

## 📝 Release Notes

### Latest: v1.8.2
- ✅ **Folder Selection Fixes** — Settings button now properly preserves your folder selections
- 🔲 **Independent Checkboxes** — Each folder checkbox operates independently (no automatic parent updates)
- 📂 **Smart Defaults** — All folders checked by default; uncheck what you don't want
- 🌳 **Expanded Tree View** — Folder tree fully expanded by default for better visibility
- 📦 **Cleaner Diagrams** — Pass-through folders automatically collapsed (e.g., "api > admin > users")

### v1.8.1
- 🐛 **CRITICAL FIX** — Folder selection now properly respected (diagrams were ignoring user-selected folders)
- 🗑️ **Delete Diagram Feature** — New Danger Zone tab in settings allows safe diagram deletion
- ✏️ **Fixed Rename Bug** — Config files now properly renamed when changing diagram names

### v1.8.0
- 🎯 **Django Template Detection** — Automatic View → Template relationships (`template_name`, `render()`)
- ⚛️ **Next.js Component Detection** — Automatic Component → Component relationships (JSX like `<UserList />`)
- 📦 **TypeScript Type Detection** — Component → DTO/Type relationships (`useState<UserDTO>`, `const x: ApiResponse`)
- 🌐 **fetch() API Call Detection** — Component → API route relationships with HTTP method detection
- 🔍 **Smart Source Reading** — Enrichers read source files to detect framework conventions
- ✅ **58 Comprehensive Tests** — TDD approach with reality checks and scoping tests

### v1.7.0
- 🐍 **Django Framework Support** — Automatic detection of Django projects with URL patterns, ORM relationships, and DRF
- 🔗 **Django URL Parsing** — Reads urls.py to create accurate route → view relationships
- 📊 **ORM Relationships** — Visualizes ForeignKey, ManyToManyField, OneToOneField
- 🎯 **DRF Support** — Detects ViewSets, Serializers, and API views
- 🛡️ **Middleware Detection** — Shows which views are protected by middleware

### v1.6.2
- 🐛 **CRITICAL FIX** — Python virtual environment scanning freeze (Django/Flask projects)
- ⚡ **Major Performance** — Excluded venv, __pycache__, site-packages from scanning
- 🚀 **Instant Loading** — Configuration panel now loads immediately on Python projects

### v1.6.1
- 📚 **Documentation** — Updated architecture docs to clarify git diff behavior
- ✅ **Verified** — All documentation accurate and ready for production

### v1.6.0
- 🖱️ **Click-to-Jump Navigation** — Click methods/properties to instantly open and highlight code
- ⚡ **Major Performance Boost** — Removed method analysis overhead (5-30s faster generation)
- 🎨 **Git Diff Simplified** — Now only highlights uncommitted changes (not previous commits)
- 🐛 **Fixed Event Propagation** — Methods no longer trigger class focus mode when clicked
- 🎯 **Precise Highlighting** — Blue selection spans entire method/property for easy spotting

### v1.5.0
- 🔗 **Import Detection** — Routes show dependencies on imported classes (Database, auth)
- 🎯 **Smart Clickable Methods** — Only methods with calls are clickable (light blue background)
- 🐛 **Fixed HTTP Calls** — API endpoints now correctly match route handlers
- 📊 **Sequence Panel Reuse** — Updates same panel instead of creating multiple columns

See [CHANGELOG.md](CHANGELOG.md) for full release history.

---

## 🔗 Links

- 🌐 [Website](https://kratai.com)
- 📦 [GitHub Repository](https://github.com/kratai-desci/kratai)
- 🐛 [Report an Issue](https://github.com/kratai-desci/kratai/issues)
- 💬 [Community Discussions](https://github.com/kratai-desci/kratai/discussions)

---

**Made with ❤️ by the Kratai team** | [MIT License](LICENSE)
