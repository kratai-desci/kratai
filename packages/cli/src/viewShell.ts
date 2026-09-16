export interface ShellStats {
	classCount: number;
	folderCount: number;
	edgeCount: number;
}

/**
 * The outer app shell for `kratai view` - topbar with view picker(s) plus a
 * container that holds up to two panels (each an iframe, so the embedded
 * views' own self-contained HTML/CSS/JS stays untouched).
 *
 * Views aren't hardcoded into fixed slots - VIEW_OPTIONS below is the one
 * list every picker draws from, so adding a new view type later (a
 * sequence diagram, say) is a one-line addition here, not a rethink of
 * which two views are "the pair". Wide screens get two independent
 * pickers, one per side, defaulting to Knowledge Graph (left) and Class
 * Diagram (right) - picking the same view on both sides is allowed, not
 * specially handled. Narrow screens show exactly one at a time (default
 * Class Diagram), picked from the same list. Nothing here is persisted
 * across reloads - every fresh load starts from those defaults again.
 *
 * The class-diagram iframe's own header (title + stats) is hidden once it
 * loads - same-origin, so the shell can reach into its contentDocument
 * directly - so there's a single header instead of two stacked ones.
 */
export function generateShellHTML(workspaceName: string, stats: ShellStats): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${workspaceName} - kratai view</title>
<script>
	// Runs before first paint to avoid a flash of the wrong theme.
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
	}
	@media (prefers-color-scheme: dark) {
		:root:not([data-theme="light"]) {
			--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38;
			--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
			--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
		}
	}
	:root[data-theme="dark"] {
		--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38;
		--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
		--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
	}
	* { box-sizing: border-box; }
	html, body { height: 100%; }
	body {
		margin: 0;
		font-family: ui-sans-serif, -apple-system, 'Segoe UI', system-ui, sans-serif;
		background: var(--bg); color: var(--text);
		display: flex; flex-direction: column; overflow: hidden;
	}
	#topbar {
		flex-shrink: 0;
		display: flex; align-items: center; justify-content: space-between;
		gap: 16px; padding: 14px 20px;
		background: var(--surface); border-bottom: 1px solid var(--border);
	}
	#topbar h1 { margin: 0; font-size: 15px; font-weight: 650; }
	#topbar .sub {
		margin: 3px 0 0 0; font-size: 12.5px; color: var(--text-dim);
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		font-variant-numeric: tabular-nums;
	}
	#view-pickers { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
	.view-picker {
		appearance: none; -webkit-appearance: none;
		background: var(--surface-2) url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%226%22 viewBox=%220 0 10 6%22%3E%3Cpath d=%22M1 1l4 4 4-4%22 stroke=%22%235C6785%22 stroke-width=%221.4%22 fill=%22none%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3C/svg%3E') no-repeat right 10px center;
		border: 1px solid var(--border); border-radius: 100px;
		color: var(--text); font-weight: 650;
		font-size: 11.5px; font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		padding: 7px 28px 7px 14px; cursor: pointer; flex-shrink: 0;
		transition: border-color 0.15s ease;
	}
	.view-picker:hover { border-color: var(--accent); }
	.view-picker:focus { outline: none; border-color: var(--accent); }
	#picker-sep { color: var(--text-faint); font-size: 12px; }

	#topbar-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
	#theme-toggle, #download-md, #refresh-btn {
		width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border);
		background: var(--surface-2); color: var(--text-dim); cursor: pointer;
		display: flex; align-items: center; justify-content: center; flex-shrink: 0;
		text-decoration: none;
	}
	#theme-toggle:hover, #download-md:hover, #refresh-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
	#refresh-btn:disabled { cursor: wait; opacity: 0.7; }
	#refresh-btn.spinning svg { animation: kratai-spin 0.7s linear infinite; }
	@keyframes kratai-spin { to { transform: rotate(360deg); } }

	#view-container { flex: 1; min-height: 0; display: flex; }
	#view-container.split { flex-direction: row; }
	#view-container:not(.split) { flex-direction: column; }
	.view-panel { flex: 1 1 0; min-width: 0; min-height: 0; }
	.view-panel + .view-panel { border-left: 1px solid var(--border); }
	#view-container:not(.split) .view-panel + .view-panel { border-left: none; border-top: 1px solid var(--border); }

	#frame-a, #frame-b { width: 100%; height: 100%; border: none; display: block; }
</style>
</head>
<body>
	<div id="topbar">
		<div>
			<h1>${workspaceName}</h1>
			<p class="sub">${stats.classCount} classes &bull; ${stats.folderCount} folders &bull; ${stats.edgeCount} relationships</p>
		</div>
		<div id="view-pickers"></div>
		<div id="topbar-actions">
			<button id="refresh-btn" title="Re-scan the project">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
			</button>
			<a id="download-md" href="/download.md" download="${workspaceName}.md" title="Download Markdown">
				<svg width="14" height="14" viewBox="0 0 14 14"><path d="M7,1.5 V9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"/><path d="M4,6.5 L7,9.5 L10,6.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M2,12 H12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"/></svg>
			</a>
			<button id="theme-toggle" title="Toggle theme"></button>
		</div>
	</div>
	<div id="view-container">
		<div id="panel-a" class="view-panel"><iframe id="frame-a" title="Left view"></iframe></div>
		<div id="panel-b" class="view-panel"><iframe id="frame-b" title="Right view"></iframe></div>
	</div>

	<script>
		// The one list every picker draws from - see the file-level comment.
		var VIEW_OPTIONS = [['graph', 'Knowledge Graph'], ['class', 'Class Diagram'], ['stack', 'Stack Layer']];
		var SRC_BY_MODE = { graph: '/knowledge-graph', class: '/class-diagram', stack: '/stack-layer' };

		// 1440px sits above a typical embedded/paneled browser (e.g. Claude
		// Code's browser pane, commonly ~1280px) so those stay single-view,
		// while a genuinely full-screen browser window on a normal desktop
		// monitor clears it and gets the side-by-side split.
		var WIDE_QUERY = '(min-width: 1440px)';
		// Nothing here is persisted - every fresh load starts from these
		// same defaults, never whatever was last picked.
		var leftMode = 'graph', rightMode = 'class', narrowMode = 'class';
		// What each generic frame is currently showing - drives which
		// content-specific fixups (see applyFrameFixups) apply on load, and
		// which frames a folder-config-changed message should reload.
		var frameKind = { 'frame-a': null, 'frame-b': null };

		function isWide() {
			return window.matchMedia(WIDE_QUERY).matches;
		}

		// Only touches .src when the mode actually changed, so resize events
		// (which call applyMode on every breakpoint crossing) don't reload an
		// iframe that's already showing the right thing.
		function setFrameMode(frameId, mode) {
			if (frameKind[frameId] === mode) return;
			frameKind[frameId] = mode;
			document.getElementById(frameId).src = SRC_BY_MODE[mode];
		}

		function applyMode() {
			var wide = isWide();
			document.getElementById('view-container').classList.toggle('split', wide);
			if (wide) {
				document.getElementById('panel-a').style.display = '';
				document.getElementById('panel-b').style.display = '';
				setFrameMode('frame-a', leftMode);
				setFrameMode('frame-b', rightMode);
			} else {
				document.getElementById('panel-a').style.display = '';
				document.getElementById('panel-b').style.display = 'none';
				setFrameMode('frame-a', narrowMode);
			}
		}

		function renderPicker(container, selected, onPick) {
			var select = document.createElement('select');
			select.className = 'view-picker';
			VIEW_OPTIONS.forEach(function (opt) {
				var value = opt[0], label = opt[1];
				var option = document.createElement('option');
				option.value = value;
				option.textContent = label;
				select.appendChild(option);
			});
			select.value = selected;
			select.addEventListener('change', function () { onPick(select.value); });
			container.appendChild(select);
		}

		function renderPickers() {
			var wide = isWide();
			var container = document.getElementById('view-pickers');
			container.innerHTML = '';
			if (wide) {
				renderPicker(container, leftMode, function (v) { leftMode = v; applyMode(); renderPickers(); });
				var sep = document.createElement('span');
				sep.id = 'picker-sep';
				sep.textContent = '/';
				container.appendChild(sep);
				renderPicker(container, rightMode, function (v) { rightMode = v; applyMode(); renderPickers(); });
			} else {
				renderPicker(container, narrowMode, function (v) { narrowMode = v; applyMode(); renderPickers(); });
			}
		}

		// Content-specific fixups for whatever a generic frame just loaded -
		// only class-diagram needs its embedded header hidden (it duplicates
		// the shell's own topbar) and its #zoomctl/#folder-panel-toggle-wrap
		// nudged up to where that hidden header would have put them.
		function applyFrameFixups(frameId) {
			if (frameKind[frameId] !== 'class') return;
			var doc = document.getElementById(frameId).contentDocument;
			if (!doc) return;
			var header = doc.querySelector('.header');
			if (header) header.style.display = 'none';
			var style = doc.createElement('style');
			style.textContent = '#zoomctl { top: 18px !important; } #folder-panel-toggle-wrap { top: 16px !important; }';
			doc.head.appendChild(style);
		}

		['frame-a', 'frame-b'].forEach(function (frameId) {
			document.getElementById(frameId).addEventListener('load', function () {
				applyFrameFixups(frameId);
				pushTheme(frameId);
			});
		});

		// Both frames stay loaded for as long as they're showing something -
		// the pickers above only reload a frame when its own mode changes,
		// so a folder order/hidden/expanded/panel-open change made in one
		// class-diagram panel (see folderPanelScript.ts) would otherwise sit
		// unseen in another visible class-diagram panel (same view on both
		// sides is allowed) until something reloads it by chance. Knowledge
		// graph has no folder panel of its own, so a 'class' frame is the
		// only kind that's ever the source or needs reloading for this.
		window.addEventListener('message', function (e) {
			if (!e.data || e.data.type !== 'kratai-folder-config-changed') return;
			['frame-a', 'frame-b'].forEach(function (frameId) {
				if (frameKind[frameId] !== 'class') return;
				var frame = document.getElementById(frameId);
				if (e.source !== frame.contentWindow && frame.contentWindow) frame.contentWindow.location.reload();
			});
		});

		// ---- theme: light/dark, defaults to system, remembered once the
		// user picks one explicitly (see storedTheme/THEME_KEY). Both
		// embedded views read the same localStorage key on their own load
		// (see the inline head script in classDiagramView.ts/
		// knowledgeGraphView.ts) - pushTheme here just keeps an *already*-
		// loaded iframe in sync the moment the button is clicked, without
		// needing to reload it. ----
		var THEME_KEY = 'kratai-theme';
		var SUN_ICON = '<svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="3" fill="none" stroke="currentColor" stroke-width="1.3"/><g stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><line x1="7" y1="0.5" x2="7" y2="2"/><line x1="7" y1="12" x2="7" y2="13.5"/><line x1="0.5" y1="7" x2="2" y2="7"/><line x1="12" y1="7" x2="13.5" y2="7"/><line x1="2.5" y1="2.5" x2="3.5" y2="3.5"/><line x1="10.5" y1="10.5" x2="11.5" y2="11.5"/><line x1="2.5" y1="11.5" x2="3.5" y2="10.5"/><line x1="10.5" y1="3.5" x2="11.5" y2="2.5"/></g></svg>';
		var MOON_ICON = '<svg width="14" height="14" viewBox="0 0 14 14"><path d="M9.5,1.5 A6,6 0 1 0 9.5,12.5 A5,5 0 1 1 9.5,1.5 Z" fill="currentColor"/></svg>';

		function getStoredTheme() {
			try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
		}
		function setStoredTheme(v) {
			try { localStorage.setItem(THEME_KEY, v); } catch (e) {}
		}
		function effectiveTheme(stored) {
			return stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
		}
		function pushTheme(frameId) {
			var frame = document.getElementById(frameId);
			var doc = frame && frame.contentDocument;
			if (!doc || !doc.documentElement) return;
			if (storedTheme) doc.documentElement.setAttribute('data-theme', storedTheme);
			else doc.documentElement.removeAttribute('data-theme');
		}
		function applyTheme() {
			if (storedTheme) document.documentElement.setAttribute('data-theme', storedTheme);
			else document.documentElement.removeAttribute('data-theme');

			var effective = effectiveTheme(storedTheme);
			var btn = document.getElementById('theme-toggle');
			btn.innerHTML = effective === 'dark' ? SUN_ICON : MOON_ICON;
			btn.title = effective === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

			pushTheme('frame-a');
			pushTheme('frame-b');
		}

		var storedTheme = getStoredTheme();
		applyTheme();

		document.getElementById('theme-toggle').addEventListener('click', function () {
			storedTheme = effectiveTheme(storedTheme) === 'dark' ? 'light' : 'dark';
			setStoredTheme(storedTheme);
			applyTheme();
		});

		applyMode();
		renderPickers();
		window.addEventListener('resize', function () {
			applyMode();
			renderPickers();
		});

		// Re-scans the whole project from disk - a frame doesn't re-parse on
		// its own reload (see view.ts's runView: the parse is cached server-
		// side for the process's lifetime), so this is currently the only
		// way to pick up source changes without restarting the server.
		document.getElementById('refresh-btn').addEventListener('click', function () {
			var btn = this;
			if (btn.disabled) return;
			btn.disabled = true;
			btn.classList.add('spinning');
			fetch('/api/refresh', { method: 'POST' })
				.then(function (res) { return res.json(); })
				.then(function (result) {
					if (!result.ok) throw new Error(result.error || 'Refresh failed');
					document.querySelector('#topbar .sub').textContent =
						result.classCount + ' classes • ' + result.folderCount + ' folders • ' + result.edgeCount + ' relationships';
					['frame-a', 'frame-b'].forEach(function (frameId) {
						var frame = document.getElementById(frameId);
						if (frame.contentWindow) frame.contentWindow.location.reload();
					});
				})
				.catch(function (error) {
					btn.title = 'Refresh failed: ' + error.message;
					setTimeout(function () { btn.title = 'Re-scan the project'; }, 4000);
				})
				.finally(function () {
					btn.disabled = false;
					btn.classList.remove('spinning');
				});
		});
	</script>
</body>
</html>`;
}
