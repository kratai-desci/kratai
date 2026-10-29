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
// chatMode: 'code' is a normal project; 'blank' is a project with no code and no
// spec yet (chat is how it gets started); 'draft' is no code but a spec exists.
// Shown once at the top of an empty chat for a project with no code and no spec. Display
// only - it is drawn in the page but never added to chatHistory, which is what
// gets sent to the AI (some providers reject a conversation that begins with an
// assistant turn, and there's nothing for the model to have "said" here anyway).
const NO_CODE_OPENER = 'Tell me about your project: what is it, who will use it, and what problem does it solve? A few sentences is enough, and I\'ll draft the use cases from your answer.';

/**
 * Set when the shell runs in the web app (kratai-web) rather than the desktop app: there is no code
 * to show or re-scan, a project lives in a list of projects, and the account pages are ordinary links.
 */
export interface WebShellOptions {
	projectsUrl: string;
	accountUrl: string;
	/** Where the page goes after Sign out. */
	signedOutUrl: string;
	/** The account's projects ({ projects: [{ id, name }] }), for the sidebar's project switcher. */
	projectsApiUrl: string;
	/** A project's address, with "{id}" where its id goes. */
	projectUrlTemplate: string;
	logoUrl: string;
	/** The numbers beside the views in the sidebar (kept current from the project's api/counts). */
	counts: ViewCounts;
}

export interface ViewCounts {
	useCases: number;
	entities: number;
	done: number;
	total: number;
}

function escapeShellText(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function generateShellHTML(
	workspaceName: string,
	stats: ShellStats,
	initialLayout: Record<string, unknown>,
	authStatus: { signedIn: boolean; email: string | null },
	initialChatHistory: { role: 'user' | 'assistant'; text?: string }[] = [],
	chatMode: 'code' | 'blank' | 'draft' = 'code',
	// A project that was just set up (the wizard, or the automatic first generation) opens on the Spec,
	// whatever view was last left on screen in some other project - see START_ON_SPEC below.
	startOnSpec = false,
	web?: WebShellOptions
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
		--warn: #C87A17; --danger: #D6455B;
	}
	@media (prefers-color-scheme: dark) {
		:root:not([data-theme="light"]) {
			--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38;
			--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
			--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
			--warn: #E6A23C; --danger: #F0687D;
		}
	}
	:root[data-theme="dark"] {
		--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38;
		--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
		--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
		--warn: #E6A23C; --danger: #F0687D;
	}
	* { box-sizing: border-box; }
	html, body { height: 100%; }
	body {
		margin: 0;
		font-family: ui-sans-serif, -apple-system, 'Segoe UI', system-ui, sans-serif;
		background: var(--bg); color: var(--text);
		display: flex; flex-direction: column; overflow: hidden;
	}
	/* Shown only when the desktop app reports a newer release (see checkUpdate). */
	#update-bar {
		display: none; flex-shrink: 0; align-items: center; justify-content: center; gap: 12px;
		padding: 7px 16px; font-size: 12.5px; color: var(--text);
		background: color-mix(in srgb, var(--accent) 14%, var(--surface)); border-bottom: 1px solid var(--border);
	}
	#update-bar button { font: inherit; cursor: pointer; }
	#update-bar .update-go { border: none; background: var(--accent); color: #fff; font-weight: 600; font-size: 12px; padding: 4px 12px; border-radius: 6px; }
	#update-bar .update-dismiss { border: none; background: none; color: var(--text-dim); font-size: 16px; line-height: 1; padding: 0 4px; }
	#topbar {
		flex-shrink: 0;
		display: flex; align-items: center; justify-content: space-between;
		gap: 16px; padding: 14px 20px;
		background: var(--surface); border-bottom: 1px solid var(--border);
	}
	#topbar h1 { margin: 0; font-size: 15px; font-weight: 650; display: inline; }
	#topbar .sub {
		margin: 3px 0 0 0; font-size: 12.5px; color: var(--text-dim);
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		font-variant-numeric: tabular-nums;
	}
	#view-pickers { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
	/* Custom dropdown, not a native <select> - a native select's OS-drawn
	   menu opens centered on the currently-selected option, and when that
	   option isn't first in the list and the trigger sits near the top of
	   the window (true here - the picker lives in the topbar), there's no
	   room above it to show the earlier options without scrolling. That
	   read as "the list is cut off". A custom menu just draws downward from
	   the button, so the full list is always visible top-to-bottom. */
	.view-picker-wrap { position: relative; flex-shrink: 0; }
	.view-picker {
		appearance: none; -webkit-appearance: none; display: block;
		background: var(--surface-2) url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%226%22 viewBox=%220 0 10 6%22%3E%3Cpath d=%22M1 1l4 4 4-4%22 stroke=%22%235C6785%22 stroke-width=%221.4%22 fill=%22none%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3C/svg%3E') no-repeat right 10px center;
		border: 1px solid var(--border); border-radius: 100px;
		color: var(--text); font-weight: 650;
		font-size: 11.5px; font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		padding: 7px 28px 7px 14px; cursor: pointer; flex-shrink: 0;
		transition: border-color 0.15s ease;
	}
	.view-picker:hover, .view-picker.open { border-color: var(--accent); }
	.view-picker:focus { outline: none; border-color: var(--accent); }
	.view-picker-menu {
		position: absolute; top: calc(100% + 5px); left: 0; z-index: 20;
		background: color-mix(in srgb, var(--surface) 88%, transparent);
		backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
		border: 1px solid var(--border); border-radius: 9px;
		box-shadow: 0 6px 18px rgba(10, 14, 25, 0.16), 0 1px 3px rgba(10, 14, 25, 0.1);
		padding: 5px; min-width: 180px; width: max-content; max-height: 60vh; overflow-y: auto;
	}
	.view-picker-item {
		display: flex; align-items: center; gap: 7px; white-space: nowrap;
		font-size: 13px; font-weight: 400; color: var(--text);
		padding: 5px 10px; border-radius: 5px; cursor: default;
	}
	.view-picker-item.selected { font-weight: 650; }
	/* Native macOS menus open with the selected item already highlighted
	   (it starts focused), then the highlight follows the pointer as you
	   move over other items. :not(:hover) on the menu keeps the selected
	   item's highlight showing only while nothing else in the menu is
	   being hovered; the plain :hover rule below takes over the instant
	   the pointer actually reaches a specific row. */
	.view-picker-menu:not(:hover) .view-picker-item.selected,
	.view-picker-item:hover {
		/* The CSS system-color keyword Highlight (the OS's own actual
		   selection color - macOS's system blue here, same as a native
		   <select>'s menu) turns out to carry its own baked-in 0.6 alpha on
		   this platform - confirmed via getComputedStyle, and CSS
		   relative-color syntax (rgb(from Highlight r g b)) doesn't strip
		   it either despite not referencing alpha, so this hardcodes the
		   same blue's own r/g/b at full opacity instead. Composited over
		   this menu's translucent backdrop, the 0.6-alpha version washed
		   out pale instead of the punchy solid blue a native menu actually
		   shows. Text stays a plain explicit white rather than the
		   HighlightText keyword, which doesn't reliably resolve to white
		   everywhere. */
		background: rgb(128, 188, 254); color: #fff;
	}
	.view-picker-item .check { width: 13px; flex-shrink: 0; font-weight: 650; }
	#picker-sep { color: var(--text-faint); font-size: 12px; }
	/* The account button sits near the topbar's right edge - a menu that
	   opens leftward-from-the-left-edge (the pickers' default) would run
	   off the window, so this anchors it to the button's right edge instead. */
	.view-picker-menu.align-right { left: auto; right: 0; }
	.account-menu-static {
		padding: 5px 10px; font-size: 12.5px; cursor: default;
	}
	#account-menu-email { font-weight: 650; color: var(--text); }
	#account-menu-balance { color: var(--text-dim); }
	.account-menu-sep { height: 1px; background: var(--border); margin: 4px 2px; }

	#topbar-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
	#projects-link {
		font-size: 12.5px; font-weight: 600; color: var(--text-dim); text-decoration: none;
		margin-right: 10px; padding-right: 12px; border-right: 1px solid var(--border);
	}
	#projects-link:hover { color: var(--accent); }
	#theme-toggle, #refresh-btn, #chat-toggle {
		width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border);
		background: var(--surface-2); color: var(--text-dim); cursor: pointer;
		display: flex; align-items: center; justify-content: center; flex-shrink: 0;
		text-decoration: none;
	}
	#theme-toggle:hover, #refresh-btn:hover:not(:disabled), #chat-toggle:hover { border-color: var(--accent); color: var(--accent); }
	#refresh-btn:disabled { cursor: wait; opacity: 0.7; }
	#refresh-btn.spinning svg { animation: kratai-spin 0.7s linear infinite; }
	@keyframes kratai-spin { to { transform: rotate(360deg); } }

	#main-row { flex: 1; min-height: 0; display: flex; flex-direction: row; overflow: hidden; }
	#view-container { flex: 1; min-height: 0; min-width: 0; display: flex; }
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
	   between two visibly split panels, chat-resizer only while the dialog
	   is open). A visually-thin line with a wider invisible hit area is the
	   standard trick for making a 1px divider actually grabbable. */
	.resizer { flex-shrink: 0; display: none; background: transparent; position: relative; z-index: 1; }
	.resizer.active { display: block; }
	.resizer:hover, .resizer.dragging { background: var(--accent); }
	#h-resizer { width: 5px; margin: 0 -2px; cursor: col-resize; }
	#chat-resizer { width: 5px; margin: 0 -2px; cursor: col-resize; }

	/* ---- AI dialog: right-hand dock, full height, alongside the view
	   panel(s) rather than a bottom strip - chat is a primary authoring
	   surface now (spec-driven pivot), not just a code-explainer squeezed
	   under the diagrams. Resizes by width via #chat-resizer, same drag
	   pattern as #h-resizer. */
	#chat-toggle.active { border-color: var(--accent); color: var(--accent); }
	/* The dock stays on the right at every window width, resizable by dragging
	   #chat-resizer. min/max-width keep it usable: a width saved on a big monitor
	   can never take more than 60% of a small laptop's window (the inline width
	   from the saved layout is capped by max-width). */
	#chat-panel {
		flex-shrink: 0; width: 320px; min-width: 220px; max-width: 60vw;
		border-left: 1px solid var(--border); background: var(--surface);
		display: flex; flex-direction: column; overflow: hidden;
	}
	#chat-panel.collapsed { display: none; }
	/* Only on a genuinely tiny window (a phone-sized or half-snapped one) is there no room
	   for a side dock next to the view, so it becomes a sheet that slides over the right
	   edge instead of a flex sibling - still on the right, still closable with the toggle. */
	@media (max-width: 720px) {
		#chat-panel {
			position: fixed; top: 0; right: 0; bottom: 0; z-index: 50;
			width: min(88vw, 380px) !important; max-width: none;
			box-shadow: -8px 0 24px rgba(0,0,0,0.18);
		}
		#chat-resizer { display: none !important; }
	}
	/* Script/screenplay log, not chat bubbles - every line reads left to
	   right, top to bottom, speakers told apart by name+color rather than
	   which side of the screen they're on (see the discussion this came
	   from: a two-column bubble layout read too much like a messaging app
	   for what's meant to feel like a narrator explaining the diagram). */
	#chat-log { flex: 1; min-height: 0; overflow-y: auto; padding: 16px 22px; display: flex; flex-direction: column; gap: 8px; }
	#chat-log:empty::before {
		content: '${chatMode === 'code' ? 'Ask about this architecture - what a class does, why two folders are connected, what changed.' : 'Ask for a change to your spec - add a use case, reword a requirement, fill in a main flow.'}';
		color: var(--text-faint); font-size: 12.5px;
	}
	.chat-msg { font-size: 13.5px; line-height: 1.6; max-width: 720px; }
	.chat-msg .speaker {
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		font-weight: 650;
	}
	.chat-msg.user .speaker { color: var(--accent); }
	.chat-msg.ai .speaker { color: var(--accent-2); }
	.chat-msg.thinking .speaker { color: var(--accent-2); }
	.chat-msg.thinking .status { color: var(--text-dim); margin-left: 8px; }
	.chat-msg.stopped .speaker { display: none; }
	.chat-msg.stopped .line { color: var(--text-dim); font-style: italic; }
	.chat-msg.error .speaker { color: #D6455B; }
	.chat-msg.error .line { color: #D6455B; }
	.chat-msg .line { color: var(--text); }
	/* What you typed keeps its line breaks (Shift+Enter). */
	.chat-msg.user .line { white-space: pre-wrap; }

	/* Minimal markdown rendering for AI replies (bold/code/headers/lists/hr)
	   - headers are deliberately NOT sized up like real page headings, just
	   bold at body size, since a giant h1 inside a narrow chat bubble reads
	   as a rendering bug rather than a heading. */
	.chat-msg .line p { margin: 0 0 6px; }
	.chat-msg .line p:last-child { margin-bottom: 0; }
	.chat-msg .line h1, .chat-msg .line h2, .chat-msg .line h3,
	.chat-msg .line h4, .chat-msg .line h5, .chat-msg .line h6 {
		margin: 8px 0 2px; font-size: 13.5px; font-weight: 700;
	}
	.chat-msg .line h1:first-child, .chat-msg .line h2:first-child, .chat-msg .line h3:first-child {
		margin-top: 0;
	}
	.chat-msg .line strong { font-weight: 700; }
	.chat-msg .line em { font-style: italic; }
	.chat-msg .line code {
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		background: var(--surface-2); padding: 1px 5px; border-radius: 4px; font-size: 0.92em;
	}
	.chat-msg .line ul { margin: 4px 0; padding-left: 18px; }
	.chat-msg .line li { margin: 2px 0; }
	.chat-msg .line hr { border: none; border-top: 1px solid var(--border); margin: 10px 0; }

	.thinking-dots { display: inline-flex; gap: 3px; vertical-align: middle; }
	.thinking-dots span {
		width: 5px; height: 5px; border-radius: 50%; background: var(--text-faint);
		animation: kratai-chat-thinking 1.1s ease-in-out infinite;
	}
	.thinking-dots span:nth-child(2) { animation-delay: 0.15s; }
	.thinking-dots span:nth-child(3) { animation-delay: 0.3s; }
	@keyframes kratai-chat-thinking {
		0%, 60%, 100% { opacity: 0.25; transform: translateY(0); }
		30% { opacity: 1; transform: translateY(-2px); }
	}
	#chat-input-row { flex-shrink: 0; display: flex; align-items: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--border); }
	#chat-input {
		flex: 1; min-width: 0; border: 1px solid var(--border); border-radius: 20px;
		background: var(--surface-2); color: var(--text);
		font-size: 13px; line-height: 1.45; font-family: inherit; padding: 9px 16px; outline: none;
		display: block; resize: none; overflow-y: auto; max-height: 150px;
	}
	#chat-input:focus { border-color: var(--accent); }
	#chat-send {
		border: none; background: var(--accent); color: #fff; font-weight: 650;
		font-size: 12.5px; padding: 0 18px; border-radius: 100px; cursor: pointer; flex-shrink: 0; height: 37px;
	}
	#chat-send:disabled { opacity: 0.5; cursor: default; }
	#chat-send.stop { background: var(--surface-2); color: var(--text); border: 1px solid var(--border); }
	/* What the chat did, under its answer: "Worked for 1m 05s - 6 steps", opening to the list. */
	.chat-steps { font-size: 12px; color: var(--text-dim); margin: -2px 0 6px; max-width: 720px; }
	.chat-steps summary { cursor: pointer; list-style: none; }
	.chat-steps summary::-webkit-details-marker { display: none; }
	.chat-steps summary::before { content: '\\25B8'; display: inline-block; margin-right: 5px; }
	.chat-steps[open] summary::before { content: '\\25BE'; }
	.chat-steps.no-steps summary::before { content: none; }
	.chat-steps ul { margin: 4px 0 0; padding-left: 20px; }
	.chat-steps li { margin: 1px 0; }

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
		max-width: 180px; position: relative; overflow: hidden;
	}
	#account-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
	#account-btn:disabled { cursor: wait; opacity: 0.7; }
	#account-btn span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	/* Remaining AI credit, as a thin fill along the bottom edge of the
	   account pill rather than a separate element - it's account
	   information, not its own toolbar action, so it belongs inside the
	   thing it's describing. */
	#balance-bar {
		display: none; position: absolute; left: 0; right: 0; bottom: 0; height: 3px;
		background: var(--border);
	}
	#balance-bar-fill {
		display: block; height: 100%; width: 100%; background: var(--accent);
		transition: width 0.3s ease, background-color 0.3s ease;
	}

	/* ---- the web app's left sidebar, in place of the topbar: the project (and a switcher to the
	   others), its views one click away, the chat toggle, then credit and the account at the foot. ---- */
	body.web { flex-direction: row; }
	#sidebar {
		flex-shrink: 0; width: 232px; display: flex; flex-direction: column; gap: 2px;
		padding: 14px 12px; background: var(--surface); border-right: 1px solid var(--border);
	}
	#side-logo {
		display: flex; align-items: center; gap: 9px; padding: 2px 8px 12px;
		font-size: 16px; font-weight: 650; color: var(--text); text-decoration: none;
	}
	#side-logo img { width: 26px; height: 26px; }
	:root[data-theme="dark"] #side-logo img { filter: invert(1); }
	@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) #side-logo img { filter: invert(1); } }
	.side-item {
		display: flex; align-items: center; gap: 10px; width: 100%; min-height: 38px; padding: 0 10px;
		border: none; border-radius: 8px; background: none; color: var(--text-dim);
		font: inherit; font-size: 13.5px; font-weight: 600; text-align: left; text-decoration: none; cursor: pointer;
	}
	.side-item:hover { background: var(--surface-2); color: var(--text); }
	.side-item.on { background: color-mix(in srgb, var(--accent) 12%, var(--surface)); color: var(--accent); }
	.side-item svg { flex-shrink: 0; }
	.side-count {
		margin-left: auto; font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 11.5px; font-weight: 600; color: var(--text-dim); font-variant-numeric: tabular-nums;
	}
	#project-switch {
		justify-content: space-between; border: 1px solid var(--border); color: var(--text);
		font-weight: 650; margin-bottom: 12px;
	}
	#project-switch span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	#project-menu { width: 100%; min-width: 0; }
	#project-menu .view-picker-item { cursor: pointer; }
	#project-menu .view-picker-item span:last-child { overflow: hidden; text-overflow: ellipsis; }
	body.web #view-pickers { flex-direction: column; align-items: stretch; gap: 2px; }
	.side-sep { height: 1px; background: var(--border); margin: 10px 4px; flex-shrink: 0; }
	.side-spacer { flex: 1; }
	body.web #chat-toggle { width: 100%; height: auto; border: none; background: none; justify-content: flex-start; }
	body.web #chat-toggle.active { background: none; color: var(--accent); }
	body.web #chat-toggle:hover { background: var(--surface-2); }
	#chat-head {
		flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
		padding: 6px 8px 6px 22px; border-bottom: 1px solid var(--border); font-size: 13.5px; font-weight: 700;
	}
	#chat-close {
		width: 32px; height: 32px; border: none; border-radius: 8px; background: none;
		color: var(--text-dim); cursor: pointer; display: flex; align-items: center; justify-content: center;
	}
	#chat-close:hover { background: var(--surface-2); color: var(--text); }
	#side-credit { font-size: 12.5px; color: var(--text-dim); text-decoration: none; padding: 4px 10px 8px; }
	#side-credit:hover { color: var(--accent); }
	#side-credit b { color: var(--text); font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-weight: 650; }
	#side-account-row { display: flex; align-items: center; gap: 6px; }
	body.web #account-wrap { flex: 1; min-width: 0; }
	body.web #account-btn { width: 100%; max-width: none; height: 36px; }
	/* Opens upward from the foot of the sidebar. */
	body.web #account-menu { top: auto; bottom: calc(100% + 5px); left: 0; right: auto; }
	/* A narrow window has no room for a column: the sidebar becomes a strip across the top. */
	@media (max-width: 800px) {
		body.web { flex-direction: column; }
		#sidebar { width: auto; flex-direction: row; flex-wrap: wrap; align-items: center; padding: 6px 8px; border-right: none; border-bottom: 1px solid var(--border); }
		#side-logo { padding: 0 6px; }
		#side-logo span, .side-sep, .side-spacer, #side-credit { display: none; }
		#project-switch-wrap { max-width: 180px; }
		#project-switch { margin-bottom: 0; }
		/* The views get a row of their own below, scrolling sideways if they do not fit. */
		body.web #view-pickers { order: 1; flex: 1 0 100%; flex-direction: row; overflow-x: auto; }
		body.web #view-pickers .side-item { flex-shrink: 0; }
		.side-item, #project-switch { width: auto; }
		body.web #chat-toggle { width: auto; margin-left: auto; }
		body.web #account-wrap { flex: none; }
		body.web #account-btn { width: auto; padding: 0 10px; }
		body.web #account-label { display: none; }
		body.web #account-menu { top: calc(100% + 5px); bottom: auto; left: auto; right: 0; }
	}
</style>
</head>
<body${web ? ' class="web"' : ''}>
	<div id="update-bar"><span id="update-text"></span><button class="update-go" id="update-go">Download</button><button class="update-dismiss" id="update-dismiss" title="Dismiss" aria-label="Dismiss">&times;</button></div>
${web ? `	<nav id="sidebar" aria-label="Project">
		<a id="side-logo" href="${escapeShellText(web.projectsUrl)}" title="All projects"><img src="${escapeShellText(web.logoUrl)}" alt=""><span>kratai</span></a>
		<div class="view-picker-wrap" id="project-switch-wrap">
			<button id="project-switch" class="side-item" type="button" aria-haspopup="menu" title="Switch project"><span>${workspaceName}</span><svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg></button>
			<div class="view-picker-menu" id="project-menu" style="display:none"></div>
		</div>
		<div id="view-pickers"></div>
		<div class="side-sep"></div>
		<button id="chat-toggle" class="side-item active" type="button" title="Show or hide the chat">
			<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg><span>Chat</span>
		</button>
		<div class="side-spacer"></div>
		<a id="side-credit" href="${escapeShellText(web.accountUrl)}" title="Open Account"></a>
		<div id="side-account-row">
			<div class="view-picker-wrap" id="account-wrap">
				<button id="account-btn" title="Sign in">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
					<span id="account-label">Sign in</span>
					<span id="balance-bar"><span id="balance-bar-fill"></span></span>
				</button>
				<div class="view-picker-menu" id="account-menu" style="display:none">
					<div class="account-menu-static" id="account-menu-email"></div>
					<div class="account-menu-static" id="account-menu-balance"></div>
					<div class="account-menu-sep"></div>
					<div class="view-picker-item" id="account-menu-dashboard"><span class="check"></span><span>Account</span></div>
					<div class="view-picker-item" id="account-menu-signout"><span class="check"></span><span>Sign out</span></div>
				</div>
			</div>
			<button id="theme-toggle" title="Toggle theme"></button>
		</div>
	</nav>
` : `	<div id="topbar">
		<div>
			<h1>${workspaceName}</h1>
			<p class="sub">${stats.classCount} classes &bull; ${stats.folderCount} folders &bull; ${stats.edgeCount} relationships</p>
		</div>
		<div id="view-pickers"></div>
		<div id="topbar-actions">
			<button id="refresh-btn" title="Re-scan the project">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
			</button>
			<button id="chat-toggle" class="active" title="Toggle AI dialog">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
			</button>
			<div class="view-picker-wrap" id="account-wrap">
				<button id="account-btn" title="Sign in">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
					<span id="account-label">Sign in</span>
					<span id="balance-bar"><span id="balance-bar-fill"></span></span>
				</button>
				<div class="view-picker-menu align-right" id="account-menu" style="display:none">
					<div class="account-menu-static" id="account-menu-email"></div>
					<div class="account-menu-static" id="account-menu-balance"></div>
					<div class="account-menu-sep"></div>
					<div class="view-picker-item" id="account-menu-dashboard"><span class="check"></span><span>Open dashboard</span></div>
					<div class="view-picker-item" id="account-menu-signout"><span class="check"></span><span>Sign out</span></div>
				</div>
			</div>
			<button id="theme-toggle" title="Toggle theme"></button>
		</div>
	</div>
`}
	<div id="main-row">
		<div id="view-container">
			<div id="panel-a" class="view-panel"><iframe id="frame-a" title="Left view"></iframe></div>
			<div id="h-resizer" class="resizer"></div>
			<div id="panel-b" class="view-panel"><iframe id="frame-b" title="Right view"></iframe></div>
		</div>
		<div id="chat-resizer" class="resizer"></div>
		<div id="chat-panel">
			${web ? `<div id="chat-head"><span>Chat</span><button id="chat-close" type="button" title="Close the chat" aria-label="Close the chat"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></div>` : ''}
			<div id="chat-log"></div>
			<div id="chat-input-row">
				<textarea id="chat-input" rows="1" placeholder="${chatMode === 'blank' ? 'Describe your project...' : chatMode === 'draft' ? 'Ask me to change anything in your spec...' : 'Ask about this architecture...'}"></textarea>
				<button id="chat-send" type="button">Send</button>
			</div>
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
		// Restored conversation from a previous session (view.ts's
		// chatHistoryData.ts) - display turns only, no tool-call internals.
		// Rendered into the chat log and used to seed chatHistory below,
		// rather than always starting empty.
		var STORED_CHAT_HISTORY = ${JSON.stringify(initialChatHistory)};
		var START_ON_SPEC = ${JSON.stringify(startOnSpec)};
		var NO_CODE = ${JSON.stringify(chatMode === 'blank')};
		var NO_CODE_OPENER = ${JSON.stringify(NO_CODE_OPENER)};
		// The web app's links (see WebShellOptions), or null in the desktop app.
		var WEB = ${JSON.stringify(web ?? null)};
		// The one flat list every picker draws from - spec-driven views
		// first, then code-exploration ones. Knowledge Graph/Stack Layer
		// were pulled from this list (still reachable via SRC_BY_MODE - see
		// applyAiUiActions) but stay out of the manual picker for now. The
		// web app has no code, so no Class Diagram either.
		var VIEW_OPTIONS = [
			['srs', 'Spec'], ['usecase', 'Use Case Model'], ['data', 'Data Model'],
			${web ? '' : "['class', 'Class Diagram'], "}['progress', 'Progress']
		];
		var SRC_BY_MODE = {
			graph: 'knowledge-graph', class: 'class-diagram', stack: 'stack-layer',
			usecase: 'use-case-diagram', data: 'data-model', progress: 'progress',
			srs: 'srs-preview'
		};

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
			fetch('api/layout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					leftMode: leftMode, rightMode: rightMode, narrowMode: narrowMode,
					splitRatio: splitRatio,
					chatWidth: document.getElementById('chat-panel').style.width,
					chatOpen: !document.getElementById('chat-panel').classList.contains('collapsed')
				})
			}).catch(function () {});
		}
		// A saved view that no longer exists (one removed in a later release) must not be used: its frame address
		// would be nonsense, and the server answers an unknown address with this whole page, nesting the app
		// inside itself. Anything unknown falls back to the default.
		function knownMode(mode, fallback, allowNone) {
			if (allowNone && mode === 'none') return mode;
			return typeof mode === 'string' && Object.prototype.hasOwnProperty.call(SRC_BY_MODE, mode) ? mode : fallback;
		}
		var leftMode = knownMode(storedLayout.leftMode, 'srs', true);
		var rightMode = knownMode(storedLayout.rightMode, 'class', true);
		var narrowMode = knownMode(storedLayout.narrowMode, 'srs', false);
		// The web app shows one view at a time (picked in the sidebar), and only its own views.
		if (WEB && !VIEW_OPTIONS.some(function (opt) { return opt[0] === narrowMode; })) narrowMode = 'srs';
		// What each generic frame is currently showing - drives which
		// content-specific fixups (see applyFrameFixups) apply on load, and
		// which frames a folder-config-changed message should reload.
		var frameKind = { 'frame-a': null, 'frame-b': null };

		function isWide() {
			if (WEB) return false;
			return window.matchMedia(WIDE_QUERY).matches;
		}

		// Only touches .src when the mode actually changed, so resize events
		// (which call applyMode on every breakpoint crossing) don't reload an
		// iframe that's already showing the right thing.
		function setFrameMode(frameId, mode) {
			if (!Object.prototype.hasOwnProperty.call(SRC_BY_MODE, mode)) return;
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

		// ---- chat dock resize: drag the divider left of the AI dialog to
		// change its width (right-hand dock now, not a bottom bar - see the
		// #chat-panel CSS comment). Persisted via saveLayout() same as
		// everything else here. ----
		(function () {
			var handle = document.getElementById('chat-resizer');
			var panel = document.getElementById('chat-panel');
			var dragging = false;
			handle.addEventListener('pointerdown', function (e) {
				dragging = true;
				handle.classList.add('dragging');
				try { handle.setPointerCapture(e.pointerId); } catch (err) {}
			});
			handle.addEventListener('pointermove', function (e) {
				if (!dragging) return;
				var width = window.innerWidth - e.clientX;
				var max = window.innerWidth * 0.6;
				panel.style.width = Math.max(220, Math.min(max, width)) + 'px';
			});
			handle.addEventListener('pointerup', function (e) {
				dragging = false;
				handle.classList.remove('dragging');
				try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
				saveLayout();
			});
		})();

		// Closes whichever picker menu is currently open (at most one at a
		// time) - called before opening another, and on any click/Escape
		// outside the open menu. Kept as a single module-level reference
		// rather than a per-picker flag since renderPickers() rebuilds the
		// whole #view-pickers subtree on every change anyway, so there's
		// never more than one real DOM menu alive to track.
		var openPickerMenu = null;
		function closeOpenPickerMenu() {
			if (!openPickerMenu) return;
			openPickerMenu.menu.style.display = 'none';
			openPickerMenu.btn.classList.remove('open');
			openPickerMenu = null;
		}
		document.addEventListener('click', function (e) {
			if (openPickerMenu && !openPickerMenu.wrap.contains(e.target)) closeOpenPickerMenu();
			if (accountMenuOpen && !accountWrap.contains(e.target)) closeAccountMenu();
		});
		document.addEventListener('keydown', function (e) {
			if (e.key !== 'Escape') return;
			closeOpenPickerMenu();
			closeAccountMenu();
		});

		// Custom dropdown, not a native <select> - see .view-picker-menu's
		// CSS comment for why (a native select's menu can end up scrolled/
		// cut off when the trigger sits near the top of the window). Always
		// draws its full option list downward from the button instead.
		// extraFlatOptions (e.g. 'None') render after the real view options -
		// kept as a separate param rather than folded into VIEW_OPTIONS since
		// 'None' isn't a real view (the narrow picker never offers it - see
		// renderPickers).
		function renderPicker(container, options, extraFlatOptions, selected, onPick) {
			var all = options.concat(extraFlatOptions || []);
			var current = all.filter(function (opt) { return opt[0] === selected; })[0] || all[0];

			var wrap = document.createElement('div');
			wrap.className = 'view-picker-wrap';

			var btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'view-picker';
			btn.textContent = current[1];

			var menu = document.createElement('div');
			menu.className = 'view-picker-menu';
			menu.style.display = 'none';
			all.forEach(function (opt) {
				var item = document.createElement('div');
				item.className = 'view-picker-item' + (opt[0] === selected ? ' selected' : '');
				var check = document.createElement('span');
				check.className = 'check';
				check.textContent = opt[0] === selected ? '✓' : '';
				var label = document.createElement('span');
				label.textContent = opt[1];
				item.appendChild(check);
				item.appendChild(label);
				item.addEventListener('click', function (e) {
					e.stopPropagation();
					closeOpenPickerMenu();
					if (opt[0] !== selected) onPick(opt[0]);
				});
				menu.appendChild(item);
			});

			btn.addEventListener('click', function (e) {
				e.stopPropagation();
				if (openPickerMenu && openPickerMenu.btn === btn) { closeOpenPickerMenu(); return; }
				closeOpenPickerMenu();
				menu.style.display = 'block';
				btn.classList.add('open');
				openPickerMenu = { btn: btn, menu: menu, wrap: wrap };
			});

			wrap.appendChild(btn);
			wrap.appendChild(menu);
			container.appendChild(wrap);
		}

		// ---- the web app's sidebar: its views as a list, with how many of each there are ----
		var VIEW_ICONS = {
			srs: '<path d="M6 2h9l5 5v15H6z"/><path d="M9 12h8M9 16h8"/>',
			usecase: '<ellipse cx="12" cy="12" rx="9" ry="5.5"/>',
			data: '<rect x="3" y="4" width="8" height="6" rx="1"/><rect x="13" y="14" width="8" height="6" rx="1"/><path d="M7 10v7h6"/>',
			progress: '<path d="M4 12.5l5 5L20 6.5"/>'
		};
		var counts = WEB ? WEB.counts : null;
		function countFor(mode) {
			if (!counts) return '';
			if (mode === 'usecase') return String(counts.useCases);
			if (mode === 'data') return String(counts.entities);
			if (mode === 'progress') return counts.total ? counts.done + '/' + counts.total : '';
			return '';
		}
		function renderSidebarViews(container) {
			VIEW_OPTIONS.forEach(function (opt) {
				var btn = document.createElement('button');
				btn.type = 'button';
				btn.className = 'side-item' + (opt[0] === narrowMode ? ' on' : '');
				if (opt[0] === narrowMode) btn.setAttribute('aria-current', 'page');
				btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (VIEW_ICONS[opt[0]] || '') + '</svg>';
				var label = document.createElement('span');
				label.textContent = opt[1];
				btn.appendChild(label);
				var count = countFor(opt[0]);
				if (count) {
					var badge = document.createElement('span');
					badge.className = 'side-count';
					badge.textContent = count;
					btn.appendChild(badge);
				}
				btn.addEventListener('click', function () {
					if (opt[0] === narrowMode) return;
					narrowMode = opt[0]; applyMode(); renderPickers(); saveLayout();
				});
				container.appendChild(btn);
			});
		}
		// The numbers change as the spec does (a chat edit, a status set in Progress); any view reloading
		// after a change, or a chat finishing, asks again.
		function refreshCounts() {
			if (!WEB) return;
			fetch('api/counts').then(function (res) { return res.json(); }).then(function (data) {
				if (!data || typeof data.useCases !== 'number') return;
				counts = data;
				renderPickers();
			}).catch(function () {});
		}

		function renderPickers() {
			var wide = isWide();
			var container = document.getElementById('view-pickers');
			container.innerHTML = '';
			if (WEB) {
				renderSidebarViews(container);
			} else if (wide) {
				renderPicker(container, VIEW_OPTIONS, [['none', 'None']], leftMode, function (v) { leftMode = v; applyMode(); renderPickers(); saveLayout(); });
				var sep = document.createElement('span');
				sep.id = 'picker-sep';
				sep.textContent = '/';
				container.appendChild(sep);
				renderPicker(container, VIEW_OPTIONS, [['none', 'None']], rightMode, function (v) { rightMode = v; applyMode(); renderPickers(); saveLayout(); });
			} else {
				renderPicker(container, VIEW_OPTIONS, [], narrowMode, function (v) { narrowMode = v; applyMode(); renderPickers(); saveLayout(); });
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
				refreshCounts();
				pushTheme(frameId);
				// A highlight_class the AI chat panel queued (see
				// applyAiUiActions/highlightInFrame below) against a frame
				// that show_view had just switched to this same frame - the
				// switch is a synchronous src assignment but the new page's
				// focusNodeByName isn't callable until it's actually loaded.
				if (pendingHighlight[frameId] && frameKind[frameId] === 'graph') {
					var name = pendingHighlight[frameId];
					pendingHighlight[frameId] = null;
					var win = document.getElementById(frameId).contentWindow;
					if (win && win.focusNodeByName) win.focusNodeByName(name);
				}
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
			// Posted by useCaseDiagramView.ts/dataModelView.ts right after a
			// successful generation, which spends credit - same reasoning as
			// startSignIn above, the balance display lives in the shell, not
			// in whichever iframe just triggered the spend.
			if (e.data.command === 'balanceChanged') refreshBalance();
			// A view's "Add detail with AI" button: put a ready-made request in the chat box
			// (opening the chat if it is closed) for the user to read and send themselves.
			if (e.data.command === 'prefillChat' && typeof e.data.text === 'string') prefillChat(e.data.text);
		});

		// ---- account: sign in with a kratai-web account for hosted AI
		// credit (replaces the earlier BYOK Settings flow). Deep-link
		// completion happens out-of-process (the desktop app's own
		// packages/desktop/src/main/auth.ts, via a system-browser round
		// trip) so this page has no way to be told synchronously when it's
		// done - it polls /api/auth/status instead, same-origin, while a
		// sign-in is in flight. ----
		var accountWrap = document.getElementById('account-wrap');
		var accountBtn = document.getElementById('account-btn');
		var accountLabel = document.getElementById('account-label');
		var accountMenu = document.getElementById('account-menu');
		var accountMenuEmail = document.getElementById('account-menu-email');
		var accountMenuBalance = document.getElementById('account-menu-balance');
		var accountMenuDashboard = document.getElementById('account-menu-dashboard');
		var accountMenuSignout = document.getElementById('account-menu-signout');
		var balanceBar = document.getElementById('balance-bar');
		var balanceBarFill = document.getElementById('balance-bar-fill');
		var statusPoll = null;
		var accountMenuOpen = false;

		function closeAccountMenu() {
			if (!accountMenuOpen) return;
			accountMenu.style.display = 'none';
			accountMenuOpen = false;
		}

		// Asks the desktop app whether a newer release exists (it checks kratai.com
		// quietly; offline or no hook just means no bar). A dismissed version stays
		// dismissed, but the next release shows the bar again.
		function checkUpdate() {
			fetch('api/update-info').then(function (res) { return res.json(); }).then(function (data) {
				var update = data && data.update;
				if (!update || !update.version) return;
				var seen = '';
				try { seen = localStorage.getItem('kratai-dismissed-update') || ''; } catch (e) { /* storage unavailable */ }
				if (seen === update.version) return;
				document.getElementById('update-text').textContent = 'kratai ' + update.version + ' is available (you have ' + update.current + ').';
				document.getElementById('update-bar').style.display = 'flex';
				document.getElementById('update-go').addEventListener('click', function () { window.location.href = 'kratai-action://open-dashboard'; });
				document.getElementById('update-dismiss').addEventListener('click', function () {
					try { localStorage.setItem('kratai-dismissed-update', update.version); } catch (e) { /* storage unavailable */ }
					document.getElementById('update-bar').style.display = 'none';
				});
			}).catch(function () { /* no update info - stay quiet */ });
		}
		checkUpdate();

		function refreshBalance() {
			if (!AUTH_STATUS.signedIn) { balanceBar.style.display = 'none'; return; }
			fetch('api/balance').then(function (res) { return res.json(); }).then(function (data) {
				if (!data || typeof data.balanceCents !== 'number' || typeof data.totalCents !== 'number' || data.totalCents <= 0) {
					balanceBar.style.display = 'none';
					return;
				}
				var pct = Math.max(0, Math.min(100, (data.balanceCents / data.totalCents) * 100));
				balanceBarFill.style.width = pct + '%';
				balanceBarFill.style.background = pct <= 15 ? 'var(--danger)' : pct <= 40 ? 'var(--warn)' : 'var(--accent)';
				var balanceText = '$' + (data.balanceCents / 100).toFixed(2) + ' credit remaining';
				accountBtn.title = (AUTH_STATUS.email || 'Signed in') + ' \\u2022 ' + balanceText;
				accountMenuBalance.textContent = balanceText;
				balanceBar.style.display = 'block';
				var sideCredit = document.getElementById('side-credit');
				if (sideCredit) sideCredit.innerHTML = '<b>$' + (data.balanceCents / 100).toFixed(2) + '</b> credit left';
			}).catch(function () {});
		}

		function renderAccountButton() {
			if (AUTH_STATUS.signedIn) {
				accountLabel.textContent = AUTH_STATUS.email || 'Signed in';
				accountBtn.title = AUTH_STATUS.email || 'Signed in';
				accountMenuEmail.textContent = AUTH_STATUS.email || 'Signed in';
			} else {
				accountLabel.textContent = 'Sign in';
				accountBtn.title = 'Sign in with kratai';
				closeAccountMenu();
			}
			accountBtn.disabled = false;
		}
		renderAccountButton();
		refreshBalance();

		function stopPolling() {
			if (statusPoll) { clearInterval(statusPoll); statusPoll = null; }
		}

		function beginSignIn() {
			if (AUTH_STATUS.signedIn || statusPoll) return;
			accountLabel.textContent = 'Waiting for sign-in\\u2026';
			accountBtn.disabled = true;
			fetch('api/auth/start', { method: 'POST' }).catch(function () {});

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
				fetch('api/auth/status').then(function (res) { return res.json(); }).then(function (status) {
					if (!status.signedIn) return;
					stopPolling();
					AUTH_STATUS = status;
					renderAccountButton();
					refreshBalance();
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

		accountBtn.addEventListener('click', function (e) {
			if (AUTH_STATUS.signedIn) {
				e.stopPropagation();
				if (accountMenuOpen) { closeAccountMenu(); return; }
				accountMenu.style.display = 'block';
				accountMenuOpen = true;
				return;
			}
			beginSignIn();
		});

		accountMenuDashboard.addEventListener('click', function (e) {
			e.stopPropagation();
			closeAccountMenu();
			// Same sentinel-URL trick as the welcome screen's own links (see
			// welcomeScreen.ts) - index.ts's will-navigate interceptor turns
			// this into shell.openExternal rather than navigating this
			// window itself, since the dashboard is a real kratai-web page,
			// not something to load inside the app's own shell. On the web it is just a page.
			window.location.href = WEB ? WEB.accountUrl : 'kratai-action://open-dashboard';
		});

		accountMenuSignout.addEventListener('click', function (e) {
			e.stopPropagation();
			closeAccountMenu();
			accountBtn.disabled = true;
			fetch('api/auth/sign-out', { method: 'POST' }).then(function () {
				if (WEB) { window.location.href = WEB.signedOutUrl; return; }
				AUTH_STATUS = { signedIn: false, email: null };
				renderAccountButton();
				refreshBalance();
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

		// ---- the web app's project switcher: the account's other projects, loaded when it is first opened ----
		var projectSwitch = document.getElementById('project-switch');
		if (projectSwitch) {
			var projectMenu = document.getElementById('project-menu');
			var projectSwitchWrap = document.getElementById('project-switch-wrap');
			var projectsLoaded = false;
			function addProjectItem(label, href, current) {
				var item = document.createElement('div');
				item.className = 'view-picker-item' + (current ? ' selected' : '');
				item.setAttribute('role', 'menuitem');
				var check = document.createElement('span');
				check.className = 'check';
				check.textContent = current ? '\u2713' : '';
				var text = document.createElement('span');
				text.textContent = label;
				item.appendChild(check);
				item.appendChild(text);
				item.addEventListener('click', function () { window.location.href = href; });
				projectMenu.appendChild(item);
			}
			function loadProjects() {
				projectsLoaded = true;
				projectMenu.textContent = 'Loading\u2026';
				fetch(WEB.projectsApiUrl).then(function (res) { return res.json(); }).then(function (data) {
					projectMenu.textContent = '';
					(data && data.projects || []).forEach(function (p) {
						var href = WEB.projectUrlTemplate.replace('{id}', encodeURIComponent(p.id));
						addProjectItem(p.name, href, href === location.pathname);
					});
					var sep = document.createElement('div');
					sep.className = 'account-menu-sep';
					projectMenu.appendChild(sep);
					addProjectItem('All projects', WEB.projectsUrl, false);
				}).catch(function () {
					projectsLoaded = false;
					projectMenu.textContent = '';
					addProjectItem('All projects', WEB.projectsUrl, false);
				});
			}
			projectSwitch.addEventListener('click', function (e) {
				e.stopPropagation();
				if (openPickerMenu && openPickerMenu.btn === projectSwitch) { closeOpenPickerMenu(); return; }
				closeOpenPickerMenu();
				closeAccountMenu();
				if (!projectsLoaded) loadProjects();
				projectMenu.style.display = 'block';
				projectSwitch.classList.add('open');
				openPickerMenu = { btn: projectSwitch, menu: projectMenu, wrap: projectSwitchWrap };
			});
		}

		// The saved layout is one setting for every project, so a project set up right after leaving some other
		// view on screen (Progress, say) would open on that instead of its new Spec. Only the Spec-showing sides
		// change (the left panel, and the single panel of a narrow window); the right panel and sizes stay as
		// they were. Saved, so a reload keeps it, and the address is reset so a refresh does not repeat this.
		if (START_ON_SPEC) {
			leftMode = 'srs';
			narrowMode = 'srs';
			// Only the query goes: the page may live below the site root (a web app project's /p/<id>/).
			history.replaceState(null, '', location.pathname);
		}
		applyMode();
		renderPickers();
		if (START_ON_SPEC) saveLayout();
		window.addEventListener('resize', function () {
			applyMode();
			renderPickers();
		});

		// Re-scans the whole project from disk - a frame doesn't re-parse on
		// its own reload (see view.ts's runView: the parse is cached server-
		// side for the process's lifetime), so this is currently the only
		// way to pick up source changes without restarting the server. The web
		// app has no code to re-scan, so no button.
		var refreshBtn = document.getElementById('refresh-btn');
		if (refreshBtn) refreshBtn.addEventListener('click', function () {
			var btn = this;
			if (btn.disabled) return;
			btn.disabled = true;
			btn.classList.add('spinning');
			fetch('api/refresh', { method: 'POST' })
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

		// ---- AI dialog: real backend (POST /api/chat, relayed through the
		// desktop app's device token to kratai-web - see chatProxy.ts). The
		// dialog's height and open/closed state ARE persisted (see
		// saveLayout()) - the message log/history itself starts fresh every
		// reload, same as before, since there's nowhere durable to replay it
		// from yet. ----
		if (storedLayout.chatWidth) {
			document.getElementById('chat-panel').style.width = storedLayout.chatWidth;
		}
		// On a phone the open chat covers the page, so the web app starts it closed there (not saved).
		if (storedLayout.chatOpen === false || (WEB && window.matchMedia('(max-width: 720px)').matches)) {
			document.getElementById('chat-panel').classList.add('collapsed');
			document.getElementById('chat-toggle').classList.remove('active');
		} else {
			// Matches the toggle button's initial "active" state (chat starts open).
			document.getElementById('chat-resizer').classList.add('active');
		}
		var chatClose = document.getElementById('chat-close');
		if (chatClose) chatClose.addEventListener('click', function () { document.getElementById('chat-toggle').click(); });
		document.getElementById('chat-toggle').addEventListener('click', function () {
			var panel = document.getElementById('chat-panel');
			var collapsed = panel.classList.toggle('collapsed');
			this.classList.toggle('active', !collapsed);
			document.getElementById('chat-resizer').classList.toggle('active', !collapsed);
			if (!collapsed) document.getElementById('chat-input').focus();
			saveLayout();
		});

		// ---- minimal markdown rendering for AI replies: bold/italic/code/
		// headers/bullet-lists/hr. Escapes HTML first (the reply is model
		// output, not code this page trusts blindly), then applies regex
		// substitutions on the now-inert escaped text - the markdown
		// characters themselves (asterisk, backtick, hash) aren't HTML-special, so escaping
		// first doesn't interfere with matching them afterward. Deliberately
		// not a full markdown parser (tables, nested lists, links) - this
		// covers what the model's replies actually use in practice. ----
		function escapeHtml(s) {
			var d = document.createElement('div');
			d.textContent = s;
			return d.innerHTML;
		}
		function inlineMarkdown(s) {
			return s
				.replace(/\`([^\`]+)\`/g, '<code>$1</code>')
				.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>')
				.replace(/\\*([^*]+)\\*/g, '<em>$1</em>');
		}
		function renderMarkdownLite(text) {
			var lines = escapeHtml(text).split('\\n');
			var html = '';
			var inList = false;
			function closeList() { if (inList) { html += '</ul>'; inList = false; } }
			lines.forEach(function (line) {
				var trimmed = line.trim();
				if (trimmed === '---' || trimmed === '***') { closeList(); html += '<hr>'; return; }
				var header = trimmed.match(/^(#{1,6})\\s+(.*)$/);
				if (header) { closeList(); html += '<h6>' + inlineMarkdown(header[2]) + '</h6>'; return; }
				var item = trimmed.match(/^[*-]\\s+(.*)$/);
				if (item) {
					if (!inList) { html += '<ul>'; inList = true; }
					html += '<li>' + inlineMarkdown(item[1]) + '</li>';
					return;
				}
				closeList();
				if (trimmed) html += '<p>' + inlineMarkdown(trimmed) + '</p>';
			});
			closeList();
			return html;
		}

		function appendChatMessage(role, text) {
			var log = document.getElementById('chat-log');
			var entry = document.createElement('div');
			entry.className = 'chat-msg ' + role;
			var speaker = document.createElement('span');
			speaker.className = 'speaker';
			speaker.textContent = (role === 'user' ? 'You' : 'kratai') + ': ';
			var line = document.createElement('span');
			line.className = 'line';
			if (role === 'thinking') {
				line.innerHTML = '<span class="thinking-dots"><span></span><span></span><span></span></span><span class="status"></span>';
			} else if (role === 'ai') {
				line.innerHTML = renderMarkdownLite(text);
			} else {
				line.textContent = text;
			}
			entry.appendChild(speaker);
			entry.appendChild(line);
			log.appendChild(entry);
			log.scrollTop = log.scrollHeight;
			return entry;
		}

		// Client-held history, not server-stored - resent in full each turn
		// (see /api/chat's own doc comment on why that's an accepted
		// simplicity tradeoff for a first version). Seeded from
		// STORED_CHAT_HISTORY (view.ts persists it to kratai.chat.json after
		// each reply) rather than starting empty every reload. Only plain
		// {role, text} entries go in here - the tool-call loop (a model
		// asking to search/inspect the codebase mid-answer) happens entirely
		// server-side in view.ts before a reply ever comes back, so this
		// page only ever sees a final answer, never a pending tool call. A
		// failed request doesn't add anything, so the next attempt just
		// resends the same pending question.
		var chatHistory = STORED_CHAT_HISTORY.slice();
		chatHistory.forEach(function (m) {
			if (m.text) appendChatMessage(m.role === 'assistant' ? 'ai' : 'user', m.text);
		});
		// Drawn only, never pushed onto chatHistory - see NO_CODE_OPENER.
		if (NO_CODE && chatHistory.length === 0) appendChatMessage('ai', NO_CODE_OPENER);

		// The AI can change what's on screen, unprompted, as part of
		// answering (show_view/highlight_class tool calls - see
		// chatToolDefinitions.ts). It always drives the right panel in
		// split view (or the single panel in narrow view) rather than the
		// left, so it never clobbers a side the user deliberately picked
		// for themselves. pendingHighlight covers the case where a
		// highlight targets a frame that show_view just switched to in the
		// same batch - the iframe's own 'load' event (below) has to fire
		// before focusNodeByName exists on its contentWindow.
		var pendingHighlight = { 'frame-a': null, 'frame-b': null };
		function highlightInFrame(frameId, name) {
			var frame = document.getElementById(frameId);
			if (frame.contentWindow && frame.contentWindow.focusNodeByName) {
				frame.contentWindow.focusNodeByName(name);
			} else {
				pendingHighlight[frameId] = name;
			}
		}
		function applyAiUiActions(actions) {
			if (!actions || !actions.length) return;
			actions.forEach(function (action) {
				// Validated against SRC_BY_MODE (every mode the shell knows how
				// to render), not VIEW_GROUPS/VIEW_OPTIONS (only what the manual
				// picker currently offers) - Knowledge Graph/Stack Layer were
				// pulled from the picker but stay reachable this way, e.g. when
				// the AI wants to show a class's position in the graph.
				if (action.type === 'show_view' && Object.prototype.hasOwnProperty.call(SRC_BY_MODE, action.view)) {
					if (isWide()) { rightMode = action.view; } else { narrowMode = action.view; }
					applyMode(); renderPickers(); saveLayout();
				}
				if (action.type === 'highlight_class' && action.name) {
					['frame-a', 'frame-b'].forEach(function (frameId) {
						if (frameKind[frameId] === 'graph') highlightInFrame(frameId, action.name);
					});
				}
				// Queued by view.ts's chat loop after a spec-editing tool call
				// (update_srs_metadata/update_use_case_model/update_data_model)
				// actually changes something - reloads whichever frame is
				// showing the affected view, same location.reload() the
				// refresh button already uses, so an edit made via chat shows
				// up without the user manually refreshing.
				if (action.type === 'refresh_view' && action.view) {
					['frame-a', 'frame-b'].forEach(function (frameId) {
						if (frameKind[frameId] !== action.view) return;
						var frame = document.getElementById(frameId);
						if (frame.contentWindow) frame.contentWindow.location.reload();
					});
				}
			});
		}

		// Guards against a second send firing while one is already in flight -
		// the send button disables, but Enter's keydown handler doesn't check
		// button state on its own, so without this a fast double-Enter could
		// fire two overlapping requests against the same chatHistory.
		var chatSending = false;
		var chatRun = null;

		// "42s", then "1m 05s".
		function formatElapsed(ms) {
			var total = Math.floor(ms / 1000);
			if (total < 60) return total + 's';
			var seconds = total % 60;
			return Math.floor(total / 60) + 'm ' + (seconds < 10 ? '0' : '') + seconds + 's';
		}
		// Send turns into Stop while the chat works.
		function setChatBusy(busy) {
			var button = document.getElementById('chat-send');
			button.textContent = busy ? 'Stop' : 'Send';
			button.classList.toggle('stop', busy);
			button.title = busy ? 'Stop (Esc)' : '';
		}
		// A dim line under an answer (or a stopped run): how long it took and, opening to a list, what it did.
		function appendChatSteps(summary, steps) {
			var log = document.getElementById('chat-log');
			var box = document.createElement('details');
			box.className = 'chat-steps';
			var head = document.createElement('summary');
			head.textContent = summary;
			box.appendChild(head);
			var list = document.createElement('ul');
			steps.forEach(function (label) {
				var item = document.createElement('li');
				item.textContent = label;
				list.appendChild(item);
			});
			box.appendChild(list);
			if (!steps.length) { box.removeChild(list); head.style.cursor = 'default'; head.style.listStyle = 'none'; box.className += ' no-steps'; }
			log.appendChild(box);
			log.scrollTop = log.scrollHeight;
		}
		function stepCount(steps) { return steps.length + (steps.length === 1 ? ' step' : ' steps'); }

		// The chat answers as a stream of one-line JSON events (see chatActivity.ts): what it is doing now,
		// view changes as they happen, then the answer. Calls onEvent for each; resolves when the stream ends.
		function readChatEvents(res, onEvent) {
			var reader = res.body.getReader();
			var decoder = new TextDecoder();
			var pending = '';
			function pump() {
				return reader.read().then(function (chunk) {
					if (chunk.done) {
						if (pending.trim()) onEvent(JSON.parse(pending));
						return;
					}
					pending += decoder.decode(chunk.value, { stream: true });
					var lines = pending.split('\\n');
					pending = lines.pop();
					lines.forEach(function (line) { if (line.trim()) onEvent(JSON.parse(line)); });
					return pump();
				});
			}
			return pump();
		}

		function stopChat() {
			if (chatRun) chatRun.controller.abort();
		}

		function sendChatMessage() {
			if (chatSending) return;
			var input = document.getElementById('chat-input');
			var text = input.value.trim();
			if (!text) return;
			chatSending = true;
			appendChatMessage('user', text);
			chatHistory.push({ role: 'user', text: text });
			input.value = '';
			growChatInput();
			input.disabled = true;
			setChatBusy(true);
			// A tool-call loop server-side (view.ts) can mean many real model round trips before the answer, so
			// this line says what it is doing and for how long, and Stop (or Esc) ends it.
			var run = chatRun = { controller: new AbortController(), startedAt: Date.now(), detail: 'Thinking', steps: [], changed: false, finished: false };
			var thinkingEntry = appendChatMessage('thinking', '');
			var statusEl = thinkingEntry.querySelector('.status');
			function drawStatus() {
				statusEl.textContent = run.detail + ' \\u00B7 ' + formatElapsed(Date.now() - run.startedAt) + ' \\u00B7 Esc to stop';
			}
			drawStatus();
			var timer = setInterval(drawStatus, 1000);

			function onEvent(event) {
				if (event.type === 'thinking') { run.detail = 'Thinking'; drawStatus(); }
				else if (event.type === 'tool') { run.detail = event.label; run.steps.push(event.label); if (event.editsSpec) run.changed = true; drawStatus(); }
				else if (event.type === 'ui') { applyAiUiActions(event.actions); }
				else if (event.type === 'error') { throw new Error(event.error); }
				else if (event.type === 'done') {
					run.finished = true;
					thinkingEntry.remove();
					appendChatMessage('ai', event.reply);
					chatHistory.push({ role: 'assistant', text: event.reply });
					refreshCounts();
					if (event.steps.length || event.elapsedMs >= 3000) {
						appendChatSteps('Worked for ' + formatElapsed(event.elapsedMs) + (event.steps.length ? ' \\u00B7 ' + stepCount(event.steps) : ''), event.steps);
					}
				}
			}

			fetch('api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messages: chatHistory }),
				signal: run.controller.signal
			})
				.then(function (res) {
					if (!res.ok) return res.json().then(function (data) { throw new Error(data.error || 'Chat request failed.'); });
					return readChatEvents(res, onEvent);
				})
				.then(function () {
					if (!run.finished) throw new Error('The connection ended before kratai finished. Try again.');
				})
				.catch(function (error) {
					thinkingEntry.remove();
					if (run.controller.signal.aborted) {
						// Stopped by the user. The question goes back in the box to edit or send again, and out of what
						// the model is shown next time. Spec edits already made are kept, which the note says.
						if (chatHistory.length && chatHistory[chatHistory.length - 1].role === 'user') chatHistory.pop();
						input.value = text;
						growChatInput();
						appendChatMessage('stopped', 'Stopped after ' + formatElapsed(Date.now() - run.startedAt) + (run.changed ? ' \\u00B7 edits already made to your spec were kept' : ''));
						if (run.steps.length) appendChatSteps(stepCount(run.steps) + ' before stopping', run.steps);
					} else {
						appendChatMessage('error', error.message);
					}
					refreshBalance();
				})
				.then(function () { if (run.finished) refreshBalance(); })
				.finally(function () {
					clearInterval(timer);
					chatSending = false;
					chatRun = null;
					setChatBusy(false);
					input.disabled = false;
					input.focus();
				});
		}

		function prefillChat(text) {
			var panel = document.getElementById('chat-panel');
			if (panel.classList.contains('collapsed')) document.getElementById('chat-toggle').click();
			var input = document.getElementById('chat-input');
			input.value = text;
			growChatInput();
			input.focus();
			input.setSelectionRange(input.value.length, input.value.length);
		}

		document.getElementById('chat-send').addEventListener('click', function () { if (chatSending) stopChat(); else sendChatMessage(); });
		// Esc stops a chat that is working, as in a terminal.
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && chatSending) { e.preventDefault(); stopChat(); }
		});
		// A box that grows with what you type (up to its max height). Enter sends; Shift+Enter adds a
		// line. While an input method (Thai, Japanese, Chinese...) is composing, Enter confirms the
		// characters and must not send, so composing keystrokes are ignored here.
		function growChatInput() {
			var box = document.getElementById('chat-input');
			// Empty: back to the one-line default (a long placeholder wrapping in a narrow dock would
			// otherwise inflate the measured height).
			if (!box.value) { box.style.height = ''; return; }
			box.style.height = 'auto';
			box.style.height = Math.min(box.scrollHeight + 2, 150) + 'px';
		}
		document.getElementById('chat-input').addEventListener('input', growChatInput);
		document.getElementById('chat-input').addEventListener('keydown', function (e) {
			if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) {
				e.preventDefault();
				sendChatMessage();
			}
		});
	</script>
</body>
</html>`;
}
