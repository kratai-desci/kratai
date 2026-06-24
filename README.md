# Kratai — Code Visualizer

Understand your codebase at a glance across **TypeScript, JavaScript, Python, and PHP**. Kratai generates interactive **class diagrams** directly inside VS Code, with **git diff highlighting** to show your uncommitted changes.

**Build multiple perspectives** — Create tailored views for architecture overviews, domain analysis, or feature exploration. Switch between them instantly.

![Kratai in Action](https://raw.githubusercontent.com/kratai-desci/kratai/main/demo/demo.gif)

---

## ✨ Key Features

- 📊 **Multiple Perspectives** — Build and save different diagram views for architecture, domains, or specific features
- 🗺️ **Interactive Visualization** — See your entire codebase organized by folders with all relationships
- 🖱️ **Instant Navigation** — Click any method or property to jump directly to the exact line in your code
- 💡 **Dependency Highlighting** — Click any class to see what it connects to (press ESC to clear)
- 📂 **Quick File Access** — Hover over classes to reveal file actions
- 📊 **Change Tracking** — Visual indicators show uncommitted changes (green = added, red = deleted, yellow = modified)
- 🎛️ **Fine-Grained Control** — 24 relationship types and 4 class types to customize your view
- 🌍 **Multi-Language** — Works with TypeScript, JavaScript, Python, and PHP in the same project
- 🧠 **Framework-Aware** — Automatically enriches Django and Next.js projects with framework-specific relationships
- 🎯 **Smart Detection** — Auto-detects inheritance, interfaces, dependencies, and framework patterns
- ⚙️ **Fully Configurable** — Choose folders, files, and relationship types for each diagram

**Framework Enrichment (Automatic Detection):**
- **Django** (✅ Fully Supported): View → Template relationships, ORM models (ForeignKey, ManyToMany), REST Framework (ViewSets, Serializers)
- **Next.js** (✅ Fully Supported): Component → Component (JSX), Component → Type/DTO, Component → API routes (fetch calls)
- **React, Laravel, Symfony** (⏳ Planned): Coming in future releases

---

## 🚀 Getting Started

1. **Install** the extension from VS Code Marketplace
2. **Open** a project with `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, or `.php` files
3. **Click** the Kratai icon in the Activity Bar (left sidebar)
4. **Create** your first diagram — root folder selected by default
5. **Generate** and start exploring!

**Build Different Perspectives:**
- **Full Architecture** — Visualize everything to understand system structure
- **Domain Focus** — Isolate core business logic and entities
- **API Layer** — Concentrate on endpoints and routing
- **Feature Scopes** — Select specific folders for targeted analysis

**Interactive Tips:**
- **Click a class** to highlight its dependencies (black outline = focused, grey = related)
- **Click any method or property** to open the file and jump directly to the definition
- **Hover over a class** and click the ⋮ button to open its source file
- **Press ESC** to clear highlights and return to full view

---

## 📸 Visual Tour

### 1. Organize with Multiple Views
Build different perspectives of your codebase — each diagram saved and ready to switch between:

![Multiple Diagrams](https://raw.githubusercontent.com/kratai-desci/kratai/main/demo/demo_ss_1.png)

### 2. See the Big Picture
Understand your entire architecture — all classes, folders, and their connections visualized:

![Full Class Diagram](https://raw.githubusercontent.com/kratai-desci/kratai/main/demo/demo_ss_2.png)

### 3. Zoom Into What Matters
Create focused views of specific areas — with visual indicators showing your uncommitted changes:

![Domain Model](https://raw.githubusercontent.com/kratai-desci/kratai/main/demo/demo_ss_3.png)

### 4. Navigate Instantly
Bridge the gap between visual and code — one click takes you to the exact line:

![Click-to-Jump](https://raw.githubusercontent.com/kratai-desci/kratai/main/demo/demo_ss_4.png)

### 5. Configure to Your Needs
Fine-tune every aspect — choose exactly which elements and connections to display:

![Configuration Panel](https://raw.githubusercontent.com/kratai-desci/kratai/main/demo/demo_ss_5.png)

**Visual Indicators:** Green = added, Red = deleted, Yellow = modified (appears automatically with uncommitted changes)

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

Kratai stores settings in `.vscode/kratai.json` in your workspace. Each diagram has its own configuration:

### Per-Diagram Settings
- **Diagram name** — Label for easy identification (e.g., "Domain Model", "API Routes")
- **Folders to scan** — Root folder selected by default; customize to include only specific directories
- **File extensions** — Select languages: `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.php`

### Display Filters
- **Class types (4 options)** — Show/hide: Classes, Interfaces, Abstract Classes, Modules
- **Relationship types (24 options)** — Fine-grained control over what connections to display:
  - **Core OOP**: extends, implements, composition, uses
  - **Method Calls**: calls, calls-super, calls-static, async-calls
  - **Type Relationships**: parameter, returns, creates
  - **Module Graph**: imports, re-exports
  - **HTTP**: http-call, routes-to
  - **ORM**: belongs-to, many-to-many, one-to-one
  - **Templates & Views**: renders, serializes, protected-by
  - **Framework**: middleware, layout-wraps, server-action
- **Git diff highlighting** — Toggle on/off to show uncommitted changes

**Build Different Perspectives:** Create multiple diagrams with different configurations:
- **Architecture Overview** — All folders, all relationships for system understanding
- **Domain Core** — Just entities and models, show only composition and inheritance
- **API Mapping** — Focus on HTTP endpoints and routing patterns

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

### Latest: v1.8.3
- 🎯 **Complete Relationship Filters** — All 24 relationship types now in Display Filters with descriptions
- 📊 **Table-Based UI** — Clean, scannable table showing type, description, and toggle for each relationship
- ✅ **Accurate Filtering** — Unchecking all relationships now correctly hides all lines (fixed opt-in logic)
- 🔗 **Property Relationships** — Fixed composition relationships (e.g., Book → Author) now properly displayed
- 🎨 **Better Organization** — Relationships grouped by category (OOP, Method Calls, HTTP, ORM, etc.)
- ⚡ **Bulk Actions** — Select All / Clear All buttons for quick filtering

### v1.8.2
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
