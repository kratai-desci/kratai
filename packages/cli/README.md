# @kratai/cli

Generates an architecture snapshot of your codebase, no VS Code and no
backend required - either a self-contained, interactive static HTML diagram
(good for sharing with anyone, including non-technical stakeholders, or for
CI artifacts) or a Markdown summary (good for feeding straight to an AI
agent as a file, without a running MCP server).

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
auto-detected the same way the VS Code extension does when creating a new
diagram.

## Implementation

Composes `@kratai/core` (parsing + git-diff enrichment) with either:
- `@kratai/diagram-view`'s `ClassDiagramView.generate(..., diagramOnly: true)` for `html` - the same renderer the VS Code extension uses, just with the Save/Settings buttons hidden since a static file has no live backend to act on
- `@kratai/core`'s `MarkdownExporter.toMarkdown` for `md` - the same exporter behind the VS Code extension's "Save as MD" button and the MCP server's `kratai_get_diagram`/`kratai_create_overview_diagram` tools
