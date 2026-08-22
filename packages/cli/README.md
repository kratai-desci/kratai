# @kratai/cli

Generates an architecture snapshot of your codebase, no VS Code and no
backend required - either a self-contained, interactive static HTML diagram
(good for sharing with anyone, including non-technical stakeholders, or for
CI artifacts) or a Markdown summary (good for feeding straight to an AI
agent as a file).

## Usage

```
kratai analyze [path] [options]
```

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
auto-detected.

## Implementation

Composes `@kratai/core` (parsing + git-diff enrichment) with either:
- `@kratai/diagram-view`'s `ClassDiagramView.generate(...)` for `html` - `hasLiveHost` is left `false` since a static file has no live backend to act on, which hides the Save/Settings buttons and any click-to-open-file affordances
- `@kratai/core`'s `MarkdownExporter.toMarkdown` for `md`
