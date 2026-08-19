// Mock-only: hides the real diagram viewer's header toolbar (title/counts
// + Zoom/Save/Settings buttons) by injecting CSS into the generated HTML
// string, without touching packages/viewer (the real renderer, shared with
// prod - see classDiagramView.ts's `.header` block). `.header` uses
// `position: sticky` in normal document flow (not a flex/grid parent), so
// `display: none` cleanly collapses it with no layout gap left behind.
export function hideDiagramToolbar(html: string): string {
	return html.replace('</head>', '<style>.header{display:none}</style></head>');
}
