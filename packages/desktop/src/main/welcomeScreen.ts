// Branded first-run screen + parsing-progress placeholder - both loaded via
// mainWindow.loadURL(dataUrl), same no-preload/no-IPC approach the rest of
// this app uses (see index.ts's file-level comment). Interactivity (the
// "select a folder" CTA) can't reach a main-process API through a normal
// click handler without contextBridge, so it's a plain link to a sentinel
// kratai-action:// URL that index.ts's will-navigate interceptor catches
// and turns into a real action - no preload script needed, consistent with
// how the rest of the app stays same-origin-fetch-only.
const BRAND_STYLE = `
	:root {
		--bg: #EEF2FA; --surface: #FFFFFF; --text: #17203A; --text-dim: #5C6785;
		--border: #DCE3F2; --accent: #3459E0;
		--dot: color-mix(in srgb, #94A0BE 55%, transparent);
	}
	@media (prefers-color-scheme: dark) {
		:root { --bg: #0A0E19; --surface: #131A2E; --text: #E8ECFB; --text-dim: #939CBE; --border: #262E4E; --accent: #6D93F5; --dot: color-mix(in srgb, #262E4E 70%, transparent); }
	}
	* { box-sizing: border-box; }
	html, body { margin: 0; padding: 0; height: 100%; }
	body {
		background: var(--bg); color: var(--text);
		font-family: ui-sans-serif, -apple-system, 'Segoe UI', system-ui, sans-serif;
		display: flex; align-items: center; justify-content: center;
		background-image: radial-gradient(var(--dot) 1px, transparent 1px);
		background-size: 22px 22px;
	}
`;

export function getWelcomeHTML(recentWorkspaces: string[]): string {
	const recentList = recentWorkspaces.length === 0 ? '' : `
		<div class="recent">
			<div class="recent-label">Recent</div>
			${recentWorkspaces.map(p => `<a class="recent-item" href="kratai-action://open?path=${encodeURIComponent(p)}">${p.split('/').pop()}<span class="path">${p}</span></a>`).join('\n')}
		</div>`;

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
	${BRAND_STYLE}
	#card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 40px 44px; max-width: 420px; text-align: center; }
	#card h1 { margin: 0 0 8px; font-size: 20px; }
	#card p { color: var(--text-dim); font-size: 13.5px; line-height: 1.6; margin: 0 0 24px; }
	.cta {
		display: inline-block; border: none; background: var(--accent); color: #fff; font-weight: 650;
		font-size: 13.5px; padding: 11px 22px; border-radius: 9px; cursor: pointer; text-decoration: none;
	}
	.recent { margin-top: 28px; text-align: left; }
	.recent-label { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim); margin-bottom: 8px; }
	.recent-item {
		display: block; padding: 8px 10px; border-radius: 8px; color: var(--text); text-decoration: none;
		font-size: 12.5px; font-weight: 650;
	}
	.recent-item:hover { background: var(--bg); }
	.recent-item .path { display: block; font-weight: 400; color: var(--text-dim); font-size: 11px; font-family: ui-monospace, monospace; }
</style>
</head>
<body>
	<div id="card">
		<h1>Welcome to kratai</h1>
		<p>A spec-driven IDE: keep your use cases, domain model, and design docs in sync with the code as it changes.</p>
		<a class="cta" href="kratai-action://pick-folder">Select a folder to get started</a>
		${recentList}
	</div>
</body>
</html>`;
}

export function getLoadingHTML(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
	${BRAND_STYLE}
	#card { text-align: center; }
	#spinner {
		width: 28px; height: 28px; border-radius: 50%; margin: 0 auto 18px;
		border: 3px solid var(--border); border-top-color: var(--accent);
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }
	#card p { color: var(--text-dim); font-size: 13.5px; font-weight: 650; }
</style>
</head>
<body>
	<div id="card">
		<div id="spinner"></div>
		<p>Building your Spec &amp; Design&hellip;</p>
	</div>
</body>
</html>`;
}
