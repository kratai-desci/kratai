// @kratai/diagram-view - the interactive class diagram view (HTML/CSS/SVG/JS).
// Framework-agnostic: produces a self-contained HTML string that any host
// (VS Code webview, Electron BrowserWindow, or a browser <iframe>) can render.
// Pure and stateless - it never needs a backend to save to, so it's the only
// renderer shared across public consumers (cli, vscode-extension). Config
// panel / git-changes views need a live save target and live vary by host,
// so each host owns its own copy of those instead.

export * from './classDiagramView';
export * from './components/classBoxRenderer';
export * from './components/folderBoxRenderer';
