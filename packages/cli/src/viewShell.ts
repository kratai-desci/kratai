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
 * specially handled, and either side can be set to 'none' to hand its
 * space to the other. Narrow screens show exactly one at a time (default
 * Class Diagram), picked from the same list minus 'none' (there's no
 * other side to hand the space to there). The whole layout - which views
 * are picked, the split ratio, the AI dialog's height and open/closed
 * state - is a personal, global preference: the same layout comes back
 * regardless of which project you open next, rather than being tied to
 * one specific project the way folder visibility is (see config.ts's
 * kratai.local.json). Persisted via runView's injected getLayout/
 * saveLayout hooks (see view.ts's ViewOptions) rather than this package's
 * own storage - the desktop app backs them with a real file in Electron's
 * userData dir, genuinely independent of whatever port this server
 * happens to bind to (it changes per launch); plain CLI/browser use
 * without those hooks wired falls back to view.ts's in-memory default,
 * which survives a page reload but not a server restart - an accepted
 * gap since the desktop app, not standalone `kratai view`, is what this
 * is built for. initialLayout is embedded server-side (STORED_LAYOUT
 * below) rather than fetched after load, so there's no flash of the
 * wrong layout before it arrives.
 *
 * The class-diagram iframe's own header (title + stats) is hidden once it
 * loads - same-origin, so the shell can reach into its contentDocument
 * directly - so there's a single header instead of two stacked ones.
 */
export function generateShellHTML(
	workspaceName: string,
	stats: ShellStats,
	initialLayout: Record<string, unknown>,
	authStatus: { signedIn: boolean; email: string | null }
): string {
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
	#theme-toggle, #download-md, #refresh-btn, #chat-toggle {
		width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border);
		background: var(--surface-2); color: var(--text-dim); cursor: pointer;
		display: flex; align-items: center; justify-content: center; flex-shrink: 0;
		text-decoration: none;
	}
	#theme-toggle:hover, #download-md:hover, #refresh-btn:hover:not(:disabled), #chat-toggle:hover { border-color: var(--accent); color: var(--accent); }
	#refresh-btn:disabled { cursor: wait; opacity: 0.7; }
	#refresh-btn.spinning svg { animation: kratai-spin 0.7s linear infinite; }
	@keyframes kratai-spin { to { transform: rotate(360deg); } }

	#view-container { flex: 1; min-height: 0; display: flex; }
	#view-container.split { flex-direction: row; }
	#view-container:not(.split) { flex-direction: column; }
	.view-panel { flex: 1 1 0; min-width: 0; min-height: 0; }
	/* ID-based, not the adjacent-sibling combinator - h-resizer sits
	   between panel-a and panel-b in the DOM now, so they're no longer
	   directly adjacent siblings even when h-resizer is display:none. */
	#view-container:not(.split) #panel-b { border-top: 1px solid var(--border); }

	#frame-a, #frame-b { width: 100%; height: 100%; border: none; display: block; }

	/* Drag handles - both default to hidden; applyMode/applyChatState show
	   the ones that actually apply to the current layout (h-resizer only
	   between two visibly split panels, v-resizer only while the dialog is
	   open). A visually-thin line with a wider invisible hit area is the
	   standard trick for making a 1px divider actually grabbable. */
	.resizer { flex-shrink: 0; display: none; background: transparent; position: relative; z-index: 1; }
	.resizer.active { display: block; }
	.resizer:hover, .resizer.dragging { background: var(--accent); }
	#h-resizer { width: 5px; margin: 0 -2px; cursor: col-resize; }
	#v-resizer { height: 5px; margin: -2px 0; cursor: row-resize; }

	/* ---- AI dialog: bottom bar, full width, RPG-dialogue-style - takes
	   height, not width, so it never competes with the split-view logic
	   above (see viewShell.ts's file-level comment for the reasoning). UI
	   only for now - "Send" echoes locally, nothing calls a real model yet. */
	#chat-toggle.active { border-color: var(--accent); color: var(--accent); }
	#chat-panel {
		flex-shrink: 0; height: 140px;
		border-top: 1px solid var(--border); background: var(--surface);
		display: flex; flex-direction: column; overflow: hidden;
	}
	#chat-panel.collapsed { display: none; }
	/* Script/screenplay log, not chat bubbles - every line reads left to
	   right, top to bottom, speakers told apart by name+color rather than
	   which side of the screen they're on (see the discussion this came
	   from: a two-column bubble layout read too much like a messaging app
	   for what's meant to feel like a narrator explaining the diagram). */
	#chat-log { flex: 1; min-height: 0; overflow-y: auto; padding: 16px 22px; display: flex; flex-direction: column; gap: 8px; }
	#chat-log:empty::before {
		content: 'Ask about this architecture - what a class does, why two folders are connected, what changed.';
		color: var(--text-faint); font-size: 12.5px;
	}
	.chat-msg { font-size: 13.5px; line-height: 1.6; max-width: 720px; }
	.chat-msg .speaker {
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		font-weight: 650;
	}
	.chat-msg.user .speaker { color: var(--accent); }
	.chat-msg.ai .speaker { color: var(--accent-2); }
	.chat-msg .line { color: var(--text); }
	#chat-input-row { flex-shrink: 0; display: flex; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--border); }
	#chat-input {
		flex: 1; border: 1px solid var(--border); border-radius: 100px;
		background: var(--surface-2); color: var(--text);
		font-size: 13px; font-family: inherit; padding: 9px 16px; outline: none;
	}
	#chat-input:focus { border-color: var(--accent); }
	#chat-send {
		border: none; background: var(--accent); color: #fff; font-weight: 650;
		font-size: 12.5px; padding: 0 18px; border-radius: 100px; cursor: pointer; flex-shrink: 0;
	}
	#chat-send:disabled { opacity: 0.5; cursor: default; }

	/* ---- account: sign in with a kratai-web account for hosted AI credit
	   (replaces the earlier BYOK Settings modal - one coherent flow instead
	   of two). No modal needed - just one button that toggles between
	   signed-out/waiting/signed-in, since there's nothing to configure
	   beyond "am I signed in". ---- */
	#account-btn {
		height: 30px; border-radius: 100px; border: 1px solid var(--border);
		background: var(--surface-2); color: var(--text-dim); cursor: pointer;
		display: flex; align-items: center; gap: 6px; flex-shrink: 0;
		padding: 0 12px 0 8px; font-size: 12px; font-family: inherit;
		max-width: 180px;
	}
	#account-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
	#account-btn:disabled { cursor: wait; opacity: 0.7; }
	#account-btn span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
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
			<button id="chat-toggle" class="active" title="Toggle AI dialog">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
			</button>
			<button id="account-btn" title="Sign in">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
				<span id="account-label">Sign in</span>
			</button>
			<button id="theme-toggle" title="Toggle theme"></button>
		</div>
	</div>
	<div id="view-container">
		<div id="panel-a" class="view-panel"><iframe id="frame-a" title="Left view"></iframe></div>
		<div id="h-resizer" class="resizer"></div>
		<div id="panel-b" class="view-panel"><iframe id="frame-b" title="Right view"></iframe></div>
	</div>
	<div id="v-resizer" class="resizer"></div>
	<div id="chat-panel">
		<div id="chat-log"></div>
		<div id="chat-input-row">
			<input id="chat-input" type="text" placeholder="Ask about this architecture...">
			<button id="chat-send" type="button">Send</button>
		</div>
	</div>

	<script>
		// See view.ts's getLayout()/generateShellHTML - embedded server-side
		// so there's no flash of the wrong layout before an async fetch
		// would otherwise resolve.
		var STORED_LAYOUT = ${JSON.stringify(initialLayout)};
		// Embedded server-side (view.ts's getAuthStatus()) for the same
		// no-flash-of-wrong-state reason as STORED_LAYOUT - kept in sync
		// afterward by the sign-in poll loop below, not re-embedded.
		var AUTH_STATUS = ${JSON.stringify(authStatus)};
		// The one list every picker draws from - see the file-level comment.
		var VIEW_OPTIONS = [['graph', 'Knowledge Graph'], ['class', 'Class Diagram'], ['stack', 'Stack Layer'], ['usecase', 'Use Case Diagram']];
		// 'None' only makes sense in split mode - it means "give the other
		// side the whole width", which requires there to *be* another side.
		// In narrow mode there's nothing else to hand the space to, so it's
		// left out of that picker's options entirely.
		var SPLIT_VIEW_OPTIONS = VIEW_OPTIONS.concat([['none', 'None']]);
		var SRC_BY_MODE = { graph: '/knowledge-graph', class: '/class-diagram', stack: '/stack-layer', usecase: '/use-case-diagram' };

		// 1440px sits above a typical embedded/paneled browser (e.g. Claude
		// Code's browser pane, commonly ~1280px) so those stay single-view,
		// while a genuinely full-screen browser window on a normal desktop
		// monitor clears it and gets the side-by-side split.
		var WIDE_QUERY = '(min-width: 1440px)';

		// ---- layout persistence: embedded server-side (see view.ts's
		// getLayout() -> generateShellHTML) rather than read from
		// localStorage, so there's no flash of the wrong layout before an
		// async fetch would resolve. Saving still goes over the wire
		// (POST /api/layout) - view.ts's saveLayoutHook is what actually
		// writes it somewhere durable (a real file in the desktop app, an
		// in-memory fallback otherwise - see view.ts for why). Written on
		// every change, not batched, so a crash or force-quit never loses
		// the latest layout. ----
		var storedLayout = STORED_LAYOUT || {};
		function saveLayout() {
			fetch('/api/layout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					leftMode: leftMode, rightMode: rightMode, narrowMode: narrowMode,
					splitRatio: splitRatio,
					chatHeight: document.getElementById('chat-panel').style.height,
					chatOpen: !document.getElementById('chat-panel').classList.contains('collapsed')
				})
			}).catch(function () {});
		}
		var leftMode = storedLayout.leftMode || 'graph';
		var rightMode = storedLayout.rightMode || 'class';
		var narrowMode = storedLayout.narrowMode || 'class';
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
				var showA = leftMode !== 'none';
				var showB = rightMode !== 'none';
				document.getElementById('panel-a').style.display = showA ? '' : 'none';
				document.getElementById('panel-b').style.display = showB ? '' : 'none';
				// The resizer only makes sense between two actually-visible
				// panels - one side picking 'none' hands the whole width to
				// the other, same as narrow mode's single panel, so it needs
				// the same flex reset below rather than a split percentage.
				document.getElementById('h-resizer').classList.toggle('active', showA && showB);
				if (showA && showB) {
					applySplitRatio();
				} else {
					document.getElementById('panel-a').style.flex = '';
					document.getElementById('panel-b').style.flex = '';
				}
				if (showA) setFrameMode('frame-a', leftMode);
				if (showB) setFrameMode('frame-b', rightMode);
			} else {
				document.getElementById('panel-a').style.display = '';
				document.getElementById('panel-b').style.display = 'none';
				document.getElementById('h-resizer').classList.remove('active');
				// Clear the split's explicit flex-basis - narrow mode's single
				// visible panel needs to fill 100% via the default .view-panel
				// rule, not whatever percentage the split left it at.
				document.getElementById('panel-a').style.flex = '';
				document.getElementById('panel-b').style.flex = '';
				setFrameMode('frame-a', narrowMode);
			}
		}

		// ---- horizontal resize: drag the divider between panel-a/panel-b
		// while split. Persisted via saveLayout() same as everything else here. ----
		var splitRatio = typeof storedLayout.splitRatio === 'number' ? storedLayout.splitRatio : 0.5;
		function applySplitRatio() {
			document.getElementById('panel-a').style.flex = '0 0 ' + (splitRatio * 100) + '%';
			document.getElementById('panel-b').style.flex = '0 0 ' + ((1 - splitRatio) * 100) + '%';
		}
		(function () {
			var handle = document.getElementById('h-resizer');
			var dragging = false;
			handle.addEventListener('pointerdown', function (e) {
				if (!handle.classList.contains('active')) return;
				dragging = true;
				handle.classList.add('dragging');
				try { handle.setPointerCapture(e.pointerId); } catch (err) {}
			});
			handle.addEventListener('pointermove', function (e) {
				if (!dragging) return;
				var rect = document.getElementById('view-container').getBoundingClientRect();
				var ratio = (e.clientX - rect.left) / rect.width;
				splitRatio = Math.max(0.2, Math.min(0.8, ratio));
				applySplitRatio();
			});
			handle.addEventListener('pointerup', function (e) {
				dragging = false;
				handle.classList.remove('dragging');
				try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
				saveLayout();
			});
		})();

		// ---- vertical resize: drag the divider above the AI dialog to
		// change its height. Persisted via saveLayout() same as everything else here. ----
		(function () {
			var handle = document.getElementById('v-resizer');
			var panel = document.getElementById('chat-panel');
			var dragging = false;
			handle.addEventListener('pointerdown', function (e) {
				dragging = true;
				handle.classList.add('dragging');
				try { handle.setPointerCapture(e.pointerId); } catch (err) {}
			});
			handle.addEventListener('pointermove', function (e) {
				if (!dragging) return;
				var height = window.innerHeight - e.clientY;
				var max = window.innerHeight * 0.7;
				panel.style.height = Math.max(80, Math.min(max, height)) + 'px';
			});
			handle.addEventListener('pointerup', function (e) {
				dragging = false;
				handle.classList.remove('dragging');
				try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
				saveLayout();
			});
		})();

		function renderPicker(container, options, selected, onPick) {
			var select = document.createElement('select');
			select.className = 'view-picker';
			options.forEach(function (opt) {
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
				renderPicker(container, SPLIT_VIEW_OPTIONS, leftMode, function (v) { leftMode = v; applyMode(); renderPickers(); saveLayout(); });
				var sep = document.createElement('span');
				sep.id = 'picker-sep';
				sep.textContent = '/';
				container.appendChild(sep);
				renderPicker(container, SPLIT_VIEW_OPTIONS, rightMode, function (v) { rightMode = v; applyMode(); renderPickers(); saveLayout(); });
			} else {
				renderPicker(container, VIEW_OPTIONS, narrowMode, function (v) { narrowMode = v; applyMode(); renderPickers(); saveLayout(); });
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
			if (!e.data) return;
			if (e.data.type === 'kratai-folder-config-changed') {
				['frame-a', 'frame-b'].forEach(function (frameId) {
					if (frameKind[frameId] !== 'class') return;
					var frame = document.getElementById(frameId);
					if (e.source !== frame.contentWindow && frame.contentWindow) frame.contentWindow.location.reload();
				});
				return;
			}
			// The use case diagram's empty state (useCaseDiagramView.ts) posts
			// this when signed out - it can't trigger sign-in itself since the
			// account button/poll loop lives in the shell, not that iframe.
			if (e.data.command === 'startSignIn') beginSignIn();
		});

		// ---- account: sign in with a kratai-web account for hosted AI
		// credit (replaces the earlier BYOK Settings flow). Deep-link
		// completion happens out-of-process (the desktop app's own
		// packages/desktop/src/main/auth.ts, via a system-browser round
		// trip) so this page has no way to be told synchronously when it's
		// done - it polls /api/auth/status instead, same-origin, while a
		// sign-in is in flight. ----
		var accountBtn = document.getElementById('account-btn');
		var accountLabel = document.getElementById('account-label');
		var statusPoll = null;

		function renderAccountButton() {
			if (AUTH_STATUS.signedIn) {
				accountLabel.textContent = AUTH_STATUS.email || 'Signed in';
				accountBtn.title = 'Sign out';
			} else {
				accountLabel.textContent = 'Sign in';
				accountBtn.title = 'Sign in with kratai';
			}
			accountBtn.disabled = false;
		}
		renderAccountButton();

		function stopPolling() {
			if (statusPoll) { clearInterval(statusPoll); statusPoll = null; }
		}

		function beginSignIn() {
			if (AUTH_STATUS.signedIn || statusPoll) return;
			accountLabel.textContent = 'Waiting for sign-in\\u2026';
			accountBtn.disabled = true;
			fetch('/api/auth/start', { method: 'POST' }).catch(function () {});

			var elapsed = 0;
			statusPoll = setInterval(function () {
				elapsed += 1500;
				// A user can simply never finish the browser tab - stop asking
				// after a while rather than polling forever.
				if (elapsed > 3 * 60 * 1000) {
					stopPolling();
					accountLabel.textContent = 'Sign-in timed out';
					accountBtn.disabled = false;
					setTimeout(renderAccountButton, 2500);
					return;
				}
				fetch('/api/auth/status').then(function (res) { return res.json(); }).then(function (status) {
					if (!status.signedIn) return;
					stopPolling();
					AUTH_STATUS = status;
					renderAccountButton();
					// Picks up the new signed-in state server-side
					// (renderUseCaseDiagram reads getAuthStatus() fresh on every
					// request) - otherwise the empty state's "Sign In" CTA would
					// still show after sign-in just completed.
					['frame-a', 'frame-b'].forEach(function (frameId) {
						if (frameKind[frameId] !== 'usecase') return;
						var frame = document.getElementById(frameId);
						if (frame.contentWindow) frame.contentWindow.location.reload();
					});
				}).catch(function () {});
			}, 1500);
		}

		accountBtn.addEventListener('click', function () {
			if (AUTH_STATUS.signedIn) {
				accountBtn.disabled = true;
				fetch('/api/auth/sign-out', { method: 'POST' }).then(function () {
					AUTH_STATUS = { signedIn: false, email: null };
					renderAccountButton();
				});
				return;
			}
			beginSignIn();
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

		// ---- AI dialog: UI-only preview. No model wired up yet - "Send"
		// just echoes the question back after a short delay, so the actual
		// interaction shape (bubbles, scroll, input) is testable before any
		// backend exists. The dialog's height and open/closed state ARE
		// persisted (see saveLayout()) - only the message log itself starts
		// fresh and empty every reload, same as it would once a real model
		// is wired up (nothing to replay from). ----
		if (storedLayout.chatHeight) {
			document.getElementById('chat-panel').style.height = storedLayout.chatHeight;
		}
		if (storedLayout.chatOpen === false) {
			document.getElementById('chat-panel').classList.add('collapsed');
			document.getElementById('chat-toggle').classList.remove('active');
		} else {
			// Matches the toggle button's initial "active" state (chat starts open).
			document.getElementById('v-resizer').classList.add('active');
		}
		document.getElementById('chat-toggle').addEventListener('click', function () {
			var panel = document.getElementById('chat-panel');
			var collapsed = panel.classList.toggle('collapsed');
			this.classList.toggle('active', !collapsed);
			document.getElementById('v-resizer').classList.toggle('active', !collapsed);
			if (!collapsed) document.getElementById('chat-input').focus();
			saveLayout();
		});

		function appendChatMessage(role, text) {
			var log = document.getElementById('chat-log');
			var entry = document.createElement('div');
			entry.className = 'chat-msg ' + role;
			var speaker = document.createElement('span');
			speaker.className = 'speaker';
			speaker.textContent = (role === 'user' ? 'You' : 'kratai') + ': ';
			var line = document.createElement('span');
			line.className = 'line';
			line.textContent = text;
			entry.appendChild(speaker);
			entry.appendChild(line);
			log.appendChild(entry);
			log.scrollTop = log.scrollHeight;
		}

		function sendChatMessage() {
			var input = document.getElementById('chat-input');
			var text = input.value.trim();
			if (!text) return;
			appendChatMessage('user', text);
			input.value = '';
			document.getElementById('chat-send').disabled = true;
			setTimeout(function () {
				appendChatMessage('ai', 'UI preview only - not connected to a real model yet.');
				document.getElementById('chat-send').disabled = false;
				input.focus();
			}, 500);
		}

		document.getElementById('chat-send').addEventListener('click', sendChatMessage);
		document.getElementById('chat-input').addEventListener('keydown', function (e) {
			if (e.key === 'Enter') sendChatMessage();
		});
	</script>
</body>
</html>`;
}
