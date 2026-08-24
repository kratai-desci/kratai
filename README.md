# kratai

> The architectural oversight layer for AI-native development.
> You focus on design. AI writes the code like a real software engineer.

kratai turns your codebase into **living architecture diagrams** — the single source of truth.
Maintain architectural control while AI agents code, and **dramatically reduce token usage** by giving them structured, accurate system information instead of expensive raw file dumps.

**Early benchmarks** with AI agents using kratai's architecture context (via SKILL) showed:
- **~49% fewer output tokens**
- **~66% reduction in total input tokens**
- **~58% lower billing units**
- **~70% faster completion time**

*Results from preliminary internal testing vs. a no-skill baseline. Actual results may vary depending on task complexity and agent behavior.*

<!-- TODO: drop a fresh demo.gif of `kratai view` (Stack Layer + Class Diagram) into demo/ and swap this in -->
<!-- ![kratai in Action](https://raw.githubusercontent.com/kratai-desci/kratai/main/demo/demo.gif) -->

---

## ✨ Key Features

### 🤖 **AI Integration via SKILL**

- **Architecture-Aware SKILL** — Pre-configured skill teaches AI to analyze existing patterns and follow your design principles automatically. No manual prompting required.
- **Fundamental Software Engineering Principles** — Ensure coding AIs consider foundational software engineering principles (KISS, DRY, SRP, high cohesion, low coupling) to produce minimal lines of code and maintain architectural integrity.

### 📊 **Architecture Intelligence**

- **Deterministic Analysis** — Generate interactive architecture diagrams directly from your codebase using static analysis. No LLM tokens required, no hallucinations, always reflects the actual code structure.
- **Single Source of Truth** — Diagrams represent the real state of your system, making it easy for developers to understand the overall architecture and reducing token costs when AI agents need context.
- **Developer-Friendly Navigation** — Git diff highlighting shows uncommitted changes at a glance, right in the diagram.

### 🖥️ **`kratai view` — a local, interactive architecture explorer**

- **Two synchronized views** — a 3D **Stack Layer** view (each folder as a drillable, stackable sheet) and a 2D **Class Diagram** (UML-style boxes with typed relationships), switchable side by side or one at a time.
- **Real folder structure, not a guess** — the navigation panel mirrors your actual folder tree. Purely organizational folders (no code of their own) are still shown, just dimmed by default, and drilling into one auto-expands through the whole wrapper chain to real content in a single click.
- **Full control over what's shown** — hide, show, reorder (drag), and drill down into any folder from either view; state persists across reloads and stays in sync between both views.
- **Refresh without restarting** — re-scans the whole project from disk on demand, no need to kill and restart the server after you change code.
- **Dark and light themes**, matching your system by default.
- **One-click Markdown export** of the whole architecture, for pasting into a PR description or feeding to an agent that doesn't have the SKILL wired up.

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

<!--
TODO: recapture screenshots against the current `kratai view` (post-v2.0 redesign)
and drop them into demo/ under these filenames, or update the paths below to
match whatever you capture. Suggested shots:
  1. demo/demo_stack_layer.png   - the 3D Stack Layer view, a few folders drilled in
  2. demo/demo_class_diagram.png - the Class Diagram view with a git-diff-highlighted change
  3. demo/demo_folder_panel.png  - the shared folder panel (hide/show/reorder/drill)
  4. demo/demo_skill.png         - an agent using the SKILL via `kratai analyze`
-->

### 1. Built-in Coding Agent & SKILL
Pre-configured SKILL teaches AI to follow your design principles automatically — no manual setup required.

### 2. AI Understands Your Architecture
AI agents load your architecture before generating code, via `kratai analyze`. No expensive context dumps — just structured, accurate system information.

### 3. Explore Your Architecture Interactively
`kratai view` opens a local, interactive explorer — drill into folders, follow relationships, and see uncommitted changes highlighted directly in the diagram.

### 4. Full Control Over What's Shown
Hide, show, reorder, and drill into any folder from the shared navigation panel — in either view, with state that persists across reloads.

---

## 🚀 Getting Started

### Claude Code, Cursor, or OpenCode

```bash
npx @kratai/cli init
```

Writes an `AGENTS.md` block (read natively by Cursor/Codex, used as a fallback
by OpenCode/Claude Code) plus a project skill at `.claude/skills/kratai/` for
Claude Code. Safe to re-run — merges into existing files instead of overwriting them.

Then, at the start of any session, the agent runs this itself to load your
architecture:

```bash
npx @kratai/cli analyze   # Markdown architecture summary, for the agent to read
npx @kratai/cli view      # live interactive diagram, for you to look at
```

---

## 📦 Repository Structure

```
packages/
├── core/          analysis engine + diagram-spec generator (deterministic, zero LLM calls)
├── diagram-view/  the interactive class diagram renderer, used by `kratai view`
├── cli/           kratai analyze / kratai init / kratai view - installable CLI
└── skill/         shared Architecture-Aware SKILL.md
```

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

### Latest: v2.0 (2026-08-24)
- 🖥️ **New: `kratai view`** — a full interactive architecture explorer replaces the old VS Code webview config panel. Two synchronized views (3D Stack Layer + Class Diagram), a shared folder navigation panel, dark/light theming, and git-diff highlighting, all served locally with no editor dependency.
- 🗂️ **Folder panel redesign** — the navigation tree now mirrors your real folder structure instead of collapsing organizational folders away; empty wrapper folders default to hidden and auto-expand through in one click when you drill in.
- 🔄 **Refresh without restarting** — re-scan the whole project from disk on demand instead of killing and restarting the server.
- 🧹 **CLI-first** — the VS Code extension and its MCP server have been removed entirely; kratai is now a standalone CLI (`kratai analyze` / `kratai init` / `kratai view`).

See [CHANGELOG.md](CHANGELOG.md) for full release history.

---

## 🔗 Links

- 🌐 [Website](https://kratai.com)
- 📦 [GitHub Repository](https://github.com/kratai-desci/kratai)
- 🐛 [Report an Issue](https://github.com/kratai-desci/kratai/issues)
- 💬 [Community Discussions](https://github.com/kratai-desci/kratai/discussions)
- 🤝 [Contributing Guide](CONTRIBUTING.md)

---

**Made with ❤️ by the kratai team** | [MIT License](LICENSE) | [CLA](CLA.md)
