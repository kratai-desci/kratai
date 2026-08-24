export interface ShellStats {
	classCount: number;
	folderCount: number;
	edgeCount: number;
}

/**
 * The outer app shell for `kratai view` - topbar with a view switcher plus a
 * container that holds the class diagram (embedded via iframe, so its own
 * self-contained HTML/CSS/JS from @kratai/diagram-view stays untouched) and
 * a stack-layer placeholder panel (real implementation comes later).
 *
 * Responsive behavior is intentionally asymmetric: wide viewports (desktop)
 * get a 3-way switch - Both/Stack/Class - since there's room to show both
 * panels side by side. Narrow viewports (e.g. an embedded app panel) only
 * get Stack/Class, one panel at a time, since a 50/50 split would be too
 * cramped to be useful there.
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
	#view-switch {
		display: flex; gap: 3px; flex-shrink: 0;
		background: var(--surface-2); border: 1px solid var(--border);
		border-radius: 100px; padding: 3px;
	}
	#view-switch button {
		border: none; background: none; color: var(--text-dim);
		font-size: 11.5px; font-weight: 650;
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		padding: 6px 14px; border-radius: 100px; cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
	}
	#view-switch button.active { background: var(--accent); color: #fff; }
	#view-switch button:not(.active):hover { color: var(--text); }

	#topbar-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
	#theme-toggle, #download-md {
		width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border);
		background: var(--surface-2); color: var(--text-dim); cursor: pointer;
		display: flex; align-items: center; justify-content: center; flex-shrink: 0;
		text-decoration: none;
	}
	#theme-toggle:hover, #download-md:hover { border-color: var(--accent); color: var(--accent); }

	#view-container { flex: 1; min-height: 0; display: flex; }
	#view-container.split { flex-direction: row; }
	#view-container:not(.split) { flex-direction: column; }
	.view-panel { flex: 1 1 0; min-width: 0; min-height: 0; }
	.view-panel + .view-panel { border-left: 1px solid var(--border); }
	#view-container:not(.split) .view-panel + .view-panel { border-left: none; border-top: 1px solid var(--border); }

	#class-frame, #stack-frame { width: 100%; height: 100%; border: none; display: block; }
</style>
</head>
<body>
	<div id="topbar">
		<div>
			<h1>${workspaceName}</h1>
			<p class="sub">${stats.classCount} classes &bull; ${stats.folderCount} folders &bull; ${stats.edgeCount} relationships</p>
		</div>
		<div id="topbar-actions">
			<div id="view-switch"></div>
			<a id="download-md" href="/download.md" download="${workspaceName}.md" title="Download Markdown">
				<svg width="14" height="14" viewBox="0 0 14 14"><path d="M7,1.5 V9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"/><path d="M4,6.5 L7,9.5 L10,6.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M2,12 H12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"/></svg>
			</a>
			<button id="theme-toggle" title="Toggle theme"></button>
		</div>
	</div>
	<div id="view-container">
		<div id="stack-panel" class="view-panel">
			<iframe id="stack-frame" src="/stack-layer" title="Stack layer"></iframe>
		</div>
		<div class="view-panel">
			<iframe id="class-frame" src="/class-diagram" title="Class diagram"></iframe>
		</div>
	</div>

	<script>
		// 1440px sits above a typical embedded/paneled browser (e.g. Claude
		// Code's browser pane, commonly ~1280px) so those stay single-view,
		// while a genuinely full-screen browser window on a normal desktop
		// monitor clears it and gets the side-by-side split.
		var WIDE_QUERY = '(min-width: 1440px)';
		// Only matters in narrow mode (wide always shows both regardless of
		// mode) - stack layer opens first there since it's the higher-level
		// view.
		var mode = 'stack';

		function isWide() {
			return window.matchMedia(WIDE_QUERY).matches;
		}

		function applyMode() {
			var wide = isWide();
			// Wide always shows both, side by side - no picking involved.
			// Narrow shows exactly one, whichever the switch is set to.
			var showStack = wide ? true : (mode === 'stack');
			var showClass = wide ? true : (mode === 'class');

			document.getElementById('stack-panel').style.display = showStack ? '' : 'none';
			document.getElementById('class-frame').parentElement.style.display = showClass ? '' : 'none';
			document.getElementById('view-container').classList.toggle('split', wide);

			// Wide mode shows both views at once with one shared folder
			// panel's worth of state (see folderPanelScript.ts) - a second
			// toggle button floating in the class diagram's own corner
			// would just be a redundant duplicate of the stack layer's, so
			// hide it there specifically and leave stack layer's as the
			// one true toggle. Narrow mode shows one view at a time, so
			// whichever is showing keeps its own toggle.
			var classDoc = document.getElementById('class-frame').contentDocument;
			if (classDoc && classDoc.documentElement) {
				classDoc.documentElement.classList.toggle('kratai-hide-folder-toggle', wide);
			}
		}

		function renderSwitch() {
			var wide = isWide();
			var container = document.getElementById('view-switch');
			// Wide always shows both panels - there's nothing to switch
			// between, so the control itself goes away rather than sitting
			// there disabled or forced to a single "Both" option.
			container.style.display = wide ? 'none' : '';
			if (wide) return;

			var options = [['stack', 'Stack Layer'], ['class', 'Class Diagram']];
			container.innerHTML = '';
			options.forEach(function (opt) {
				var value = opt[0], label = opt[1];
				var btn = document.createElement('button');
				btn.type = 'button';
				btn.textContent = label;
				if (value === mode) btn.className = 'active';
				btn.addEventListener('click', function () {
					mode = value;
					applyMode();
					renderSwitch();
				});
				container.appendChild(btn);
			});
		}

		// Same-origin iframe, so the shell can reach in and hide the
		// class-diagram's own header once it's loaded - it duplicates the
		// title/stats already shown in the shell's own topbar above. Its
		// #zoomctl is positioned assuming that header's height, so nudge it
		// back up to sit at the top now that the header's gone.
		document.getElementById('class-frame').addEventListener('load', function (e) {
			var doc = e.target.contentDocument;
			if (!doc) return;
			var header = doc.querySelector('.header');
			if (header) header.style.display = 'none';
			var style = doc.createElement('style');
			// #folder-panel-toggle-wrap goes to 16px, not 18px like #zoomctl -
			// matching the stack layer's own default exactly (see
			// stackLayerView.ts, which never needs an override since it has
			// no header to begin with) so the shared folder panel sits at
			// the identical position in both embedded views. The
			// kratai-hide-folder-toggle class (see applyMode) hides that
			// same panel entirely in wide mode, where the stack layer's
			// copy is the one shared toggle for both views.
			style.textContent = '#zoomctl { top: 18px !important; } #folder-panel-toggle-wrap { top: 16px !important; }'
				+ ' html.kratai-hide-folder-toggle #folder-panel-toggle-wrap { display: none !important; }';
			doc.head.appendChild(style);
			pushTheme('class-frame');
			// A reload (see the message listener below) starts this iframe's
			// document fresh, losing the kratai-hide-folder-toggle class
			// applyMode set on the old one - reapply it for the current mode.
			applyMode();
		});
		document.getElementById('stack-frame').addEventListener('load', function () {
			pushTheme('stack-frame');
		});

		// Both iframes stay loaded for the shell's whole lifetime - the
		// switcher above only toggles CSS display, it never re-fetches -
		// so a folder order/hidden/expanded/panel-open change made in one
		// view's own panel (see folderPanelScript.ts / stackLayerView.ts's
		// postFolderConfig) would otherwise sit unseen in the *other*
		// iframe until something reloads it by chance. Reload whichever
		// iframe didn't send the notification - the sender already applied
		// its own change locally, no need to reload it too.
		window.addEventListener('message', function (e) {
			if (!e.data || e.data.type !== 'kratai-folder-config-changed') return;
			var stackFrame = document.getElementById('stack-frame');
			var classFrame = document.getElementById('class-frame');
			if (e.source !== stackFrame.contentWindow && stackFrame.contentWindow) stackFrame.contentWindow.location.reload();
			if (e.source !== classFrame.contentWindow && classFrame.contentWindow) classFrame.contentWindow.location.reload();
		});

		// ---- theme: light/dark, defaults to system, remembered once the
		// user picks one explicitly (see storedTheme/THEME_KEY). Both
		// embedded views read the same localStorage key on their own load
		// (see the inline head script in classDiagramView.ts/
		// stackLayerView.ts) - pushTheme here just keeps an *already*-loaded
		// iframe in sync the moment the button is clicked, without needing
		// to reload it. ----
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

			pushTheme('class-frame');
			pushTheme('stack-frame');
		}

		var storedTheme = getStoredTheme();
		applyTheme();

		document.getElementById('theme-toggle').addEventListener('click', function () {
			storedTheme = effectiveTheme(storedTheme) === 'dark' ? 'light' : 'dark';
			setStoredTheme(storedTheme);
			applyTheme();
		});

		applyMode();
		renderSwitch();
		window.addEventListener('resize', function () {
			applyMode();
			renderSwitch();
		});
	</script>
</body>
</html>`;
}
