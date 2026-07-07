# kratai

> The architectural oversight layer for AI-native development.  
> You focus on design. AI writes the code like a real software engineer.

kratai turns your codebase into **living architecture diagrams** — the single source of truth.  
Maintain architectural control while AI agents code, and **dramatically reduce token usage** by giving them structured, accurate system information instead of expensive raw file dumps.

**Early benchmarks** with AI agents using kratai’s architecture context (via MCP + SKILL) showed:
- **~49% fewer output tokens**
- **~66% reduction in total input tokens**
- **~58% lower billing units**
- **~70% faster completion time**

*Results from preliminary internal testing (kratai v.1.9.4 vs no skill baseline). Actual results may vary depending on task complexity and agent behavior.*

![kratai in Action](https://raw.githubusercontent.com/kratai-desci/kratai/main/demo/demo.gif)

---

## ✨ Key Features

### 🤖 **AI Integration via SKILL & Local MCP Server**

- **Architecture-Aware SKILL** — Pre-configured skill teaches AI to analyze existing patterns and follow your design principles automatically. No manual prompting required.
- **Local MCP Server** — Built-in Model Context Protocol server gives AI agents direct access to your architecture diagrams. AI can query your system structure before generating code, understanding the full context.
- **Fundamental Software Engineering Principles** — Ensure coding AIs consider foundational software engineering principles (KISS, DRY, SRP, high cohesion, low coupling) to produce minimal lines of code and maintain architectural integrity.

### 📊 **Architecture Intelligence**

- **Deterministic Analysis** — Generate interactive architecture diagrams directly from your codebase using static analysis. No LLM tokens required, no hallucinations, always reflects the actual code structure.
- **Single Source of Truth** — Diagrams represent the real state of your system, making it easy for developers to understand the overall architecture and reducing token costs when AI agents need context.
- **Developer-Friendly Navigation** — Git diff highlighting shows uncommitted changes at a glance. Click any element to jump directly to the code.

---

## 📐 Spec-Driven Development

Spec-Driven Development (SDD) represents a shift in how software is built with AI. Instead of starting with code and hoping the architecture and behavior emerge correctly, SDD treats **specifications and architecture** as the primary artifacts that guide development.

In traditional AI-assisted workflows, developers often rely on prompts and generated code, which can lead to:

- Inconsistent architectural decisions
- Difficulty understanding the overall system structure
- Growing technical debt as AI-generated code accumulates

Spec-Driven Development addresses this by making both **what** the system should do (specification) and **how** it should be structured (architecture) explicit and actionable. This creates a stronger foundation for AI agents to work from, resulting in more predictable, maintainable, and scalable outcomes.

kratai contributes to this approach by giving developers clear **visibility and oversight** over architectural decisions as they build with AI. It helps you understand how your system is structured, how changes impact that structure, and how to keep architectural intent aligned with implementation — even as AI generates large portions of the codebase.

---

## 📸 Visual Tour

### 1. Built-in Coding Agent & SKILL
Pre-configured SKILL teaches AI to follow your design principles automatically. Local MCP server provides direct access to architecture data — no manual setup required.

<img src="https://raw.githubusercontent.com/kratai-desci/kratai/main/demo/demo_ss_4.png" alt="AI uses kratai skill" width="50%">

### 2. AI Understands Your Architecture
AI agents query your architecture before generating code. No expensive context dumps — AI gets structured, accurate system information through MCP server.

![Screenshot 1 - Class Diagram](https://raw.githubusercontent.com/kratai-desci/kratai/main/demo/demo_ss_1.png)

### 3. Architecture as Single Source of Truth
Create and save different architectural views — focus on domains, API layers, or specific features. Each diagram is a lens into your system structure.

<img src="https://raw.githubusercontent.com/kratai-desci/kratai/main/demo/demo_ss_2.png" alt="Multiple Diagrams" width="33%">

### 4. Fine-Grained Control Over Your Views
Choose exactly what to show — select folders, filter relationship types, and control class types. Tailor each diagram to your specific needs.

![Screenshot 5 - Configuration Panel](https://raw.githubusercontent.com/kratai-desci/kratai/main/demo/demo_ss_5.png)


---

## 🚀 Getting Started

### Quick Start (30 seconds)

1. Install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=kratai-core.kratai)
2. Open any TypeScript/JavaScript/Python/PHP project
3. Click the kratai icon in the sidebar
4. Click "Create New Diagram" → Generate

---

## 🌐 Supported Languages & Frameworks

| Language | Support | Framework Enrichment |
|---|---|---|
| **TypeScript** | ✅ Full | Next.js (components, types, API calls) |
| **JavaScript** | ✅ Full | Next.js (JSX rendering) |
| **Python** | ✅ Full | Django (views, templates, ORM, DRF) |
| **Java** | ✅ Full | Spring Boot (MVC, JPA, REST, DI) |
| **PHP** | ✅ Full | Laravel/Symfony (planned) |

**Framework-specific features** automatically detect patterns like:
- **Spring Boot:** Controller→View (JSP/Thymeleaf), JPA relationships, REST endpoints, dependency injection
- **Django:** View→Template, ORM relationships, REST Framework
- **Next.js:** Component rendering, type usage, fetch() detection


---

## 📝 Release Notes

### Latest: v1.9.5 (2026-07-07)
- 🤖 **SKILL Invocation Fix** — Fixed agent and skill not being invoked during coding tasks by improving trigger patterns
- 📊 **Relationship Count Display** — Added relationship type counts in filter view when editing diagrams for better visibility

### v1.9.4 (2026-07-06)
- 🔧 **MCP Server Fixes** — Fixed workspace resolution and chat participant registration issues
- 🔧 **Multi-Workspace Support** — MCP server now properly handles multiple workspace folders

### v1.9.3 (2026-07-06)
- 🔧 **Build Fixes** — Resolved TypeScript compilation errors and import path issues
- ✅ **Stable Release** — All modules now compile and package correctly

### v1.9.2 (2026-07-03)
- ☕ **Java & Spring Boot Support** — Full language and framework support with MVC, JPA, REST, and dependency injection detection
- 🎯 **Spring Boot Patterns** — Automatic detection of controllers, services, repositories, and view rendering
- 🔗 **JPA Relationships** — Maps @OneToMany, @ManyToOne, @ManyToMany, @OneToOne entity relationships

### v1.9.1 (2026-06-28)
- 🔧 **Intelligent Relationship Deduplication** — Reduces edge count by 60-75% by collapsing duplicate relationships into multi-type edges
- 🎨 **Multi-Type Edge Labels** — See all relationship types in one edge (e.g., "renders, uses")
- ⚡ **Improved Performance** — Faster rendering with cleaner, more readable diagrams

### v1.9.0 (2026-06-27)
- ✨ **Enhanced Key Features** — Restructured into scannable bullet points highlighting deterministic analysis, single source of truth, and AI integration

### v1.8.4
- 🏷️ **Custom Diagram Headers** — Your diagram name now appears as the main title
- 📖 **Enhanced Documentation** — README restructured for better clarity
- 🎯 **Clearer Messaging** — Visual tour emphasizing tailored views

### v1.8.3
- 🎯 **Complete Relationship Filters** — All 24 types with descriptions
- 📊 **Table-Based UI** — Scannable relationship filter table
- ✅ **Accurate Filtering** — Fixed opt-in logic for relationships

See [CHANGELOG.md](CHANGELOG.md) for full release history.

---

## 🔗 Links

- 🌐 [Website](https://kratai.com)
- 📦 [GitHub Repository](https://github.com/kratai-desci/kratai)
- 🐛 [Report an Issue](https://github.com/kratai-desci/kratai/issues)
- 💬 [Community Discussions](https://github.com/kratai-desci/kratai/discussions)

---

**Made with ❤️ by the kratai team** | [MIT License](LICENSE)
