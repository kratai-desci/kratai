# Design mockups (work in progress)

Exploratory redesigns of kratai's diagram output. These are **not** part of
the real product — nothing here is imported by `packages/*`, and none of it
is wired into the VS Code extension, CLI, or MCP server. They exist purely to
try out visual directions before any of this becomes real implementation
work.

Each mockup is a standalone, self-contained HTML page (no build step, no
dependencies beyond what's vendored in the folder) built from real data
extracted from a sample project via `@kratai/core`.

- **`layer-stack/`** — a 3D, drill-down, expandable visualization of a
  codebase's folder/layer architecture (Three.js). Open `dist.html` directly
  in a browser, or edit `head.html` / `app.js` and run `python3 build.py` to
  regenerate it.
- **`class-diagram/`** — a redesigned 2D class diagram (pan/zoom, relationship
  lines, git-status coloring). Same pattern: edit `head.html` / `app.js`,
  then `python3 build.py`.
- **`architect/`** — in progress: a unified control-center view merging the
  layer-stack and class-diagram into one coherent architecture explorer, plus
  in-page editing of the folder visibility/ordering config. Started as a copy
  of `layer-stack/`. Same pattern: edit `head.html` / `app.js`, then
  `python3 build.py`.

## Regenerating the data

Each folder's `extract-data.js` pulls real folder/class/relationship data out
of `@kratai/core`'s built output, run against an external sample project (not
included in this repo). The current `data.json` in each folder is a snapshot
already extracted — you don't need to re-run extraction to view or edit the
mockups, only if you want to point them at different source data.
