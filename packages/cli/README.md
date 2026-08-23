# @kratai/cli

Generates an architecture snapshot of your codebase, no VS Code and no
backend required - either a self-contained, interactive static HTML diagram
(good for sharing with anyone, including non-technical stakeholders, or for
CI artifacts) or a Markdown summary (good for feeding straight to an AI
agent as a file).

## Usage

```
kratai init [path]
kratai analyze [path] [options]
```

`init` wires kratai into a project: writes `.claude/skills/kratai/SKILL.md`,
merges an `AGENTS.md` block (read natively by Cursor/Codex, used as a
fallback by OpenCode/Claude Code), scaffolds `kratai.config.json` from smart
defaults if it doesn't already exist, and adds `kratai.local.json` to
`.gitignore`.

| Flag | Description | Default |
|---|---|---|
| `-o, --output <file>` | Output file | `./kratai-diagram.<format>` |
| `-c, --config <file>` | Path to a `kratai.config.json` | `<path>/kratai.config.json` if present |
| `--name <string>` | Diagram title | folder name |
| `--folders <a,b,c>` | Only include these folders (comma-separated) | all folders |
| `--format <html\|md>` | Output format - `html` for a browser, `md` for an AI agent/file | `html` |
| `--no-git-diff` | Disable git diff highlighting | diff highlighting on |
| `--open` | Open the generated file in your default app | off |
| `-h, --help` | Show help | |
| `-v, --version` | Show version | |

## Config file

`kratai.config.json` at the analyzed path (or wherever `--config` points) is
a plain `KrataiConfig` JSON object - the same shape used everywhere else in
kratai - merged over sensible defaults. If no config file exists, folders are
auto-detected. `kratai init` scaffolds this file from smart defaults so
there's always a committed starting point for the team.

On top of that sits `kratai.local.json`, a personal, gitignored override at
the workspace root - for tweaks you don't want to impose on the rest of the
team (e.g. hiding a folder you don't personally care about). It's never
created automatically; it only appears once you save a personal override
yourself. `init` seeds the `.gitignore` entry up front so it's never
accidentally committed later. It only applies when analyzing the real
workspace root with no explicit `--config` override - precedence, lowest to
highest: smart defaults → `kratai.config.json` → `kratai.local.json` → CLI
flags for that run.

## Implementation

Composes `@kratai/core` (parsing + git-diff enrichment) with either:
- `@kratai/diagram-view`'s `ClassDiagramView.generate(...)` for `html` - `hasLiveHost` is left `false` since a static file has no live backend to act on, which hides the Save/Settings buttons and any click-to-open-file affordances
- `@kratai/core`'s `MarkdownExporter.toMarkdown` for `md`
