# Kratai

> Know your code. Build production-quality software with AI.

Kratai is the architectural layer of Spec-Driven Development. It helps developers maintain clear visibility and control over system architecture while collaborating with AI coding agents — enabling you to build scalable, maintainable, and production-grade applications with confidence.

![Kratai in Action](https://raw.githubusercontent.com/kratai-desci/kratai/main/demo/demo.gif)

---

## Spec-Driven Development

Spec-Driven Development (SDD) represents a shift in how software is built with AI. Instead of starting with code and hoping the architecture and behavior emerge correctly, SDD treats **specifications and architecture** as the primary artifacts that guide development.

In traditional AI-assisted workflows, developers often rely on prompts and generated code, which can lead to:

- Inconsistent architectural decisions
- Difficulty understanding the overall system structure
- Growing technical debt as AI-generated code accumulates

Spec-Driven Development addresses this by making both **what** the system should do (specification) and **how** it should be structured (architecture) explicit and actionable. This creates a stronger foundation for AI agents to work from, resulting in more predictable, maintainable, and scalable outcomes.

Kratai contributes to this approach by giving developers clear **visibility and oversight** over architectural decisions as they build with AI. It helps you understand how your system is structured, how changes impact that structure, and how to keep architectural intent aligned with implementation — even as AI generates large portions of the codebase.

---

## ✨ Key Features

### 📊 **Architecture Intelligence Without AI Costs**
Generate interactive architecture diagrams directly from your codebase using static analysis — no LLM tokens required. Diagrams always reflect the current state of your code, with git diff highlighting to show uncommitted changes and click-to-navigate for instant code exploration.

### 🤖 **AI Integration Layer**
Built-in MCP server and architecture-aware SKILL give AI agents direct access to your system structure. AI understands how your code is organized before generating new code, automatically following your design principles and existing patterns.


---

## � Visual Tour

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

## 🚀 Getting Started

1. **Install** the extension from VS Code Marketplace
2. **Open** a project with `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, or `.php` files
3. **Click** the Kratai icon in the Activity Bar (left sidebar)
4. **Create** your first diagram — root folder selected by default
5. **Generate** and start exploring!

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

### Latest: v1.8.4
- 🏷️ **Custom Diagram Headers** — Your diagram name now appears as the main title (no more generic "Class Diagram")
- 📖 **Enhanced Documentation** — README restructured to better showcase multiple perspectives and configuration capabilities
- 🎯 **Clearer Messaging** — Visual tour and feature list rewritten to emphasize tailored views and instant navigation

### v1.8.3
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

See [CHANGELOG.md](CHANGELOG.md) for full release history.

---

## 🔗 Links

- 🌐 [Website](https://kratai.com)
- 📦 [GitHub Repository](https://github.com/kratai-desci/kratai)
- 🐛 [Report an Issue](https://github.com/kratai-desci/kratai/issues)
- 💬 [Community Discussions](https://github.com/kratai-desci/kratai/discussions)

---

**Made with ❤️ by the Kratai team** | [MIT License](LICENSE)
