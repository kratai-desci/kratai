import { ScorecardData, ScorecardItem } from './diffScorecardData.js';

function escapeXml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function statusLabel(status: string): string {
	return status === 'added' ? 'Added' : status === 'deleted' ? 'Deleted' : 'Modified';
}

/**
 * A list/card layout rather than a diagram - unlike the other views here, a
 * scorecard is inherently a reading task (what changed, does it still
 * match the spec), not something a 2D/3D layout clarifies. Mirrors the
 * other views' shell (theme sync script, same CSS custom properties) so it
 * reads as part of the same app.
 */
export function generateDiffScorecardHTML(data: ScorecardData): string {
	function renderItem(item: ScorecardItem): string {
		return `<div class="item ${item.flag}">
			<div class="item-top">
				<span class="status-badge ${item.changeStatus}">${statusLabel(item.changeStatus)}</span>
				<span class="item-name">${escapeXml(item.name)}</span>
				<span class="flag-icon">${item.flag === 'warning' ? '⚠' : '✓'}</span>
			</div>
			<div class="item-path">${escapeXml(item.filePath)}</div>
			<div class="item-commentary">${escapeXml(item.commentary)}</div>
		</div>`;
	}

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeXml(data.workspaceName)} - code review</title>
<script>
	try {
		var krataiTheme = localStorage.getItem('kratai-theme');
		if (krataiTheme) document.documentElement.setAttribute('data-theme', krataiTheme);
	} catch (e) {}
</script>
<style>
	:root {
		--bg: #EEF2FA; --surface: #FFFFFF; --surface-2: #F4F7FD;
		--text: #17203A; --text-dim: #5C6785; --text-faint: #94A0BE;
		--border: #DCE3F2; --accent: #3459E0; --accent-2: #14A6B8;
		--ok: #1FA37C; --warn: #C87A17; --added: #1FA37C; --modified: #C87A17; --deleted: #D6455B;
	}
	@media (prefers-color-scheme: dark) {
		:root:not([data-theme="light"]) {
			--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38;
			--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
			--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
			--ok: #3FCB9F; --warn: #E6A23C; --added: #3FCB9F; --modified: #E6A23C; --deleted: #F0687D;
		}
	}
	:root[data-theme="dark"] {
		--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38;
		--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
		--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
		--ok: #3FCB9F; --warn: #E6A23C; --added: #3FCB9F; --modified: #E6A23C; --deleted: #F0687D;
	}
	* { box-sizing: border-box; }
	html, body { margin: 0; padding: 0; height: 100%; }
	body {
		background: var(--bg); color: var(--text); overflow-y: auto;
		font-family: ui-sans-serif, -apple-system, 'Segoe UI', system-ui, sans-serif;
	}
	#page { max-width: 720px; margin: 0 auto; padding: 56px 24px 40px; }

	#header { display: flex; align-items: baseline; gap: 10px; margin-bottom: 20px; }
	#header h1 { margin: 0; font-size: 15px; font-weight: 650; }
	#header .sub { font-size: 12.5px; color: var(--text-dim); font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; }

	#score-card {
		display: flex; align-items: center; gap: 20px; background: var(--surface);
		border: 1px solid var(--border); border-radius: 14px; padding: 20px 24px; margin-bottom: 24px;
	}
	#score-ring {
		width: 64px; height: 64px; border-radius: 50%; flex-shrink: 0;
		display: flex; align-items: center; justify-content: center;
		font-size: 18px; font-weight: 700;
		border: 5px solid var(--score-color, var(--accent));
	}
	#score-card .summary-text { font-size: 13px; color: var(--text-dim); line-height: 1.5; }
	#score-card .summary-text strong { color: var(--text); }

	.items { display: flex; flex-direction: column; gap: 10px; }
	.item { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; }
	.item.warning { border-left: 3px solid var(--warn); }
	.item.ok { border-left: 3px solid var(--ok); }
	.item-top { display: flex; align-items: center; gap: 8px; }
	.item-name { font-weight: 650; font-size: 13px; }
	.flag-icon { margin-left: auto; font-size: 13px; }
	.item.warning .flag-icon { color: var(--warn); }
	.item.ok .flag-icon { color: var(--ok); }
	.status-badge {
		font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;
		padding: 2px 7px; border-radius: 100px; color: #fff;
	}
	.status-badge.added { background: var(--added); }
	.status-badge.modified { background: var(--modified); }
	.status-badge.deleted { background: var(--deleted); }
	.item-path {
		font-size: 11px; color: var(--text-faint); font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		margin: 6px 0 8px;
	}
	.item-commentary { font-size: 12.5px; color: var(--text-dim); line-height: 1.5; }

	#empty { text-align: center; color: var(--text-dim); font-size: 13px; padding: 40px 0; }
</style>
</head>
<body>
	<div id="page">
		<div id="header">
			<h1>${escapeXml(data.workspaceName)}</h1>
			<span class="sub">code review</span>
		</div>
		<div id="score-card">
			<div id="score-ring" style="--score-color: ${data.overallScore >= 80 ? 'var(--ok)' : data.overallScore >= 55 ? 'var(--warn)' : 'var(--deleted)'}">${data.overallScore}</div>
			<div class="summary-text"><strong>Spec compliance score</strong><br>${escapeXml(data.summary)}</div>
		</div>
		${data.items.length === 0
			? `<div id="empty">Nothing changed against the base commit.</div>`
			: `<div class="items">${data.items.map(renderItem).join('\n')}</div>`}
	</div>
</body>
</html>`;
}
