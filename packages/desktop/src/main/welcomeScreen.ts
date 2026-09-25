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
		--border: #DCE3F2; --accent: #3459E0; --ok: #1FA37C; --warn: #C87A17;
		--dot: color-mix(in srgb, #94A0BE 55%, transparent);
	}
	@media (prefers-color-scheme: dark) {
		:root { --bg: #0A0E19; --surface: #131A2E; --text: #E8ECFB; --text-dim: #939CBE; --border: #262E4E; --accent: #6D93F5; --ok: #3FCB9F; --warn: #E6A23C; --dot: color-mix(in srgb, #262E4E 70%, transparent); }
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
	#card h1 { margin: 0 0 8px; font-size: 20px; display: inline; }
	#beta-badge {
		display: inline-block; vertical-align: middle; margin-left: 8px;
		font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
		color: var(--accent); border: 1px solid var(--accent); border-radius: 100px;
		padding: 2px 8px; font-family: ui-monospace, monospace;
	}
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
		<h1>Welcome to kratai</h1><span id="beta-badge">Beta</span>
		<p>A spec-driven IDE: keep your use cases, data model, and design docs in sync with the code as it changes.</p>
		<a class="cta" href="kratai-action://pick-folder">Select a folder to get started</a>
		${recentList}
	</div>
</body>
</html>`;
}

// Same minimal escaping as pdfExport.ts's own copy - workspaceName reflects
// a real folder name (not one of this file's own hardcoded strings), so
// unlike the rest of this screen's text it needs it, in case a folder is
// ever named something HTML-shaped.
function escapeHtml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Shown right after a folder is picked, only when signed in and at least
// one of the Use Case Model / Data Model isn't cached yet - an explicit
// choice with the real project size and cost context (current balance)
// visible, rather than silently spending the moment a project opens.
// index.ts's promptGenerateChoice() drives this via the same
// kratai-action:// sentinel links as the rest of this file's screens;
// "Skip" leaves the workspace exactly as it is today, empty-state cards and
// all - this is purely an opt-in on top of that, not a replacement for it.
export function getGeneratePromptHTML(
	info: { workspaceName: string; missing: string[]; classCount: number; folderCount: number },
	balanceCents: number | null
): string {
	const missingList = info.missing.map(m => `<li>${m}</li>`).join('');
	const balanceLine = balanceCents === null
		? "We couldn't check your AI credit balance right now."
		: `You have <strong>$${(balanceCents / 100).toFixed(2)}</strong> in AI credit remaining.`;
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
	${BRAND_STYLE}
	#card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 40px 44px; max-width: 420px; text-align: center; }
	#card h1 { margin: 0 0 10px; font-size: 20px; }
	#project-name {
		color: var(--text); font-size: 13px; font-weight: 650; margin: 0 0 3px;
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
	}
	#project-stats {
		color: var(--text-dim); font-size: 11.5px; font-weight: 650; margin: 0 0 20px;
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
	}
	#card p { color: var(--text-dim); font-size: 13.5px; line-height: 1.6; margin: 0 0 16px; }
	#card ul { text-align: left; margin: 0 0 20px; padding: 0 0 0 20px; color: var(--text); font-size: 13.5px; font-weight: 650; }
	#card ul li { margin: 4px 0; }
	.actions { display: flex; flex-direction: column; align-items: center; gap: 14px; }
	.cta {
		display: inline-block; border: none; background: var(--accent); color: #fff; font-weight: 650;
		font-size: 13.5px; padding: 11px 22px; border-radius: 9px; cursor: pointer; text-decoration: none;
	}
	.skip-link {
		color: var(--text-dim); font-size: 12.5px; text-decoration: underline;
		text-underline-offset: 2px; cursor: pointer;
	}
	.skip-link:hover { color: var(--text); }
</style>
</head>
<body>
	<div id="card">
		<h1>Generate your Spec now?</h1>
		<p id="project-name">${escapeHtml(info.workspaceName)}</p>
		<p id="project-stats">${info.classCount} classes &bull; ${info.folderCount} folders</p>
		<p>These aren't generated yet for this project:</p>
		<ul>${missingList}</ul>
		<p>${balanceLine}</p>
		<div class="actions">
			<a class="cta" href="kratai-action://generate-now">Generate now</a>
			<a class="skip-link" href="kratai-action://skip-generate">Skip, I'll generate manually</a>
		</div>
	</div>
</body>
</html>`;
}

export interface LoadingStep {
	label: string;
	status: 'pending' | 'active' | 'done' | 'error';
}

const STEP_ICON: Record<LoadingStep['status'], string> = {
	pending: '<span class="step-icon pending">&#9675;</span>',
	active: '<span class="step-icon active"><span class="mini-spinner"></span></span>',
	done: '<span class="step-icon done">&#10003;</span>',
	// Swallowed server-side (no credit, network hiccup) - the shell falls
	// back to that view's own manual "Generate" card either way, so this
	// reads as "skipped", not a scary failure.
	error: '<span class="step-icon error">&#8212;</span>'
};

// steps lets openWorkspace() reload this same screen with the live
// first-open auto-generation checklist (see runView's onProgress option),
// reported in full before the first item even starts so the user sees the
// whole plan upfront rather than just "generating..." with no sense of how
// much is left. Omitted/empty falls back to the generic parsing message.
// All hardcoded strings from this codebase, never workspace/user data, so
// no HTML-escaping is needed here.
export function getLoadingHTML(steps?: LoadingStep[]): string {
	const stepsHtml = (steps || []).length === 0 ? '' : `
		<div id="steps">
			${steps!.map(s => `<div class="step">${STEP_ICON[s.status]}<span>${s.label}</span></div>`).join('\n\t\t\t')}
		</div>`;
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
	#steps { text-align: left; min-width: 220px; }
	.step {
		display: flex; align-items: center; gap: 10px; padding: 7px 4px;
		font-size: 13.5px; font-weight: 650; color: var(--text-dim);
	}
	.step-icon { width: 16px; flex-shrink: 0; text-align: center; font-size: 13px; }
	.step-icon.pending { color: var(--border); }
	.step-icon.active { color: var(--accent); }
	.step-icon.done { color: var(--ok); }
	.step-icon.error { color: var(--warn); }
	.mini-spinner {
		display: inline-block; width: 11px; height: 11px; border-radius: 50%;
		border: 2px solid var(--border); border-top-color: var(--accent);
		animation: spin 0.7s linear infinite;
	}
</style>
</head>
<body>
	<div id="card">
		${stepsHtml || `<div id="spinner"></div><p>Building your Spec &amp; Design&hellip;</p>`}
	</div>
</body>
</html>`;
}
