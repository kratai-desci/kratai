# @kratai/cli (not implemented yet)

Planned: installable CLI (`kratai analyze`, etc.) that imports `@kratai/core`
for parsing and `@kratai/diagram-view` for rendering, calling
`ClassDiagramView.generate(..., diagramOnly: true)` to produce a
self-contained static HTML bundle - browser-viewable, no VS Code needed, no
backend. Also covers the "share a diagram with a non-technical stakeholder"
case. Configuration comes from `kratai.config.json` / CLI flags read once at
generation time, not an in-page config panel, since a static bundle has
nothing to save changes back to.
