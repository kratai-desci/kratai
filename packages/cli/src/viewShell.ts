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

	#view-container { flex: 1; min-height: 0; display: flex; }
	#view-container.split { flex-direction: row; }
	#view-container:not(.split) { flex-direction: column; }
	.view-panel { flex: 1 1 0; min-width: 0; min-height: 0; }
	.view-panel + .view-panel { border-left: 1px solid var(--border); }
	#view-container:not(.split) .view-panel + .view-panel { border-left: none; border-top: 1px solid var(--border); }

	#class-frame { width: 100%; height: 100%; border: none; display: block; }

	#stack-panel {
		width: 100%; height: 100%;
		display: flex; align-items: center; justify-content: center;
		background-image: radial-gradient(color-mix(in srgb, var(--border) 70%, transparent) 1px, transparent 1px);
		background-size: 22px 22px;
	}
	#stack-panel p {
		color: var(--text-faint); font-size: 13px;
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
	}
</style>
</head>
<body>
	<div id="topbar">
		<div>
			<h1>${workspaceName}</h1>
			<p class="sub">${stats.classCount} classes &bull; ${stats.folderCount} folders &bull; ${stats.edgeCount} relationships</p>
		</div>
		<div id="view-switch"></div>
	</div>
	<div id="view-container">
		<div id="stack-panel" class="view-panel">
			<p>Stack layer view - coming soon</p>
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
		var mode = 'class';

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
			style.textContent = '#zoomctl { top: 18px !important; }';
			doc.head.appendChild(style);
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
