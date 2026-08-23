# @kratai/cli

Generates an architecture snapshot of your codebase, no VS Code and no
separate backend required.

- `kratai analyze` - a Markdown summary, for feeding straight to an AI agent
  as a file, or archiving as a portable, serverless artifact (CI, sharing
  with someone who doesn't have kratai installed).
- `kratai view` - a live local web app for a human to explore the
  architecture interactively (class diagram + 3D stack-layer view, switchable
  side by side on a wide screen).

## Usage

```
kratai init [path]
kratai analyze [path] [options]
kratai view [path] [options]
```

`init` wires kratai into a project: writes `.claude/skills/kratai/SKILL.md`,
merges an `AGENTS.md` block (read natively by Cursor/Codex, used as a
fallback by OpenCode/Claude Code), scaffolds `kratai.config.json` from smart
defaults if it doesn't already exist, and adds `kratai.local.json` to
`.gitignore`.

### `analyze`

| Flag | Description | Default |
|---|---|---|
| `-o, --output <file>` | Output file | `./kratai-diagram.md` |
| `-c, --config <file>` | Path to a `kratai.config.json` | `<path>/kratai.config.json` if present |
| `--name <string>` | Diagram title | folder name |
| `--folders <a,b,c>` | Only include these folders (comma-separated) | all folders |
| `--no-git-diff` | Disable git diff highlighting | diff highlighting on |
| `--open` | Open the generated file in your default app | off |
| `-h, --help` | Show help | |
| `-v, --version` | Show version | |

### `view`

| Flag | Description | Default |
|---|---|---|
| `-p, --port <number>` | Port to listen on | `4300` |
| `--open` | Open the page in your default browser | off |

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

Both commands share the same `@kratai/core` pipeline (parsing + git-diff
enrichment), differing only in delivery:
- `analyze` writes it out with `@kratai/core`'s `MarkdownExporter.toMarkdown`
- `view` renders it live with `@kratai/diagram-view`'s `ClassDiagramView.generate(...)`
  (embedded via iframe alongside the stack-layer view - see `src/viewShell.ts`) -
  `hasLiveHost` is left `false` since the server doesn't yet listen for the
  diagram's Save/Settings/open-file postMessage calls
