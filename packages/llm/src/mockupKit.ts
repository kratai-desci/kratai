import type { MockupTheme } from './mockupSchema.js';

/**
 * The built-in UI kit every mockup is made from. The AI never writes CSS: it composes a screen from these
 * classes, so every mockup in a project shares one look by construction, and changing the theme restyles
 * all of them at once without regenerating anything. The page is fully self-contained and inert (no
 * scripts, nothing loaded from outside) - see buildMockupPage's Content-Security-Policy.
 */

export const MOCKUP_KIT_CSS = `
:root { --primary: #2563EB; --radius: 10px; }
:root[data-mode="light"] { --bg: #F4F6FA; --surface: #FFFFFF; --text: #1B2437; --muted: #66708A; --border: #DDE3EE; --sidebar: #FFFFFF; --stripe: #F8FAFD; }
:root[data-mode="dark"] { --bg: #0F1424; --surface: #171E33; --text: #E8ECFB; --muted: #98A2C3; --border: #2A3354; --sidebar: #131A2E; --stripe: #1B2340; }
:root { --primary-soft: color-mix(in srgb, var(--primary) 13%, var(--surface)); --primary-ink: color-mix(in srgb, var(--primary) 82%, var(--text)); --success: #16A34A; --warn: #D97706; --danger: #DC2626; --info: #0284C7; }
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
body { background: var(--bg); color: var(--text); font: 14px/1.5 "Noto Sans Thai", "Sarabun", system-ui, -apple-system, "Segoe UI", sans-serif; }
.mk-app { display: grid; grid-template-rows: 56px 1fr; min-height: 100vh; }
.mk-topbar { display: flex; align-items: center; gap: 16px; padding: 0 22px; background: var(--primary); color: #fff; }
.mk-brand { font-weight: 700; font-size: 16px; letter-spacing: .01em; }
.mk-topbar .mk-spacer { flex: 1; }
.mk-user { display: flex; align-items: center; gap: 10px; font-size: 13px; opacity: .95; }
.mk-avatar { width: 30px; height: 30px; border-radius: 50%; background: rgba(255,255,255,.22); display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; }
.mk-body { display: grid; grid-template-columns: 232px 1fr; min-height: 0; }
.mk-side { background: var(--sidebar); border-right: 1px solid var(--border); padding: 16px 12px; }
.mk-nav-title { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); padding: 6px 10px; }
.mk-nav a { display: block; padding: 8px 10px; border-radius: 8px; color: var(--text); text-decoration: none; font-size: 13.5px; }
.mk-nav a:hover { background: var(--primary-soft); }
.mk-nav a.active { background: var(--primary-soft); color: var(--primary-ink); font-weight: 650; }
.mk-main { padding: 26px 30px 70px; position: relative; min-width: 0; }
.mk-page-title { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
.mk-sub { color: var(--muted); margin: 0 0 20px; }
.mk-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px 20px; margin-bottom: 16px; }
.mk-card > h3, .mk-card-title { margin: 0 0 12px; font-size: 15px; font-weight: 650; }
.mk-grid { display: grid; gap: 16px; }
.mk-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.mk-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.mk-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.mk-split { display: grid; gap: 16px; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
.mk-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.mk-between { justify-content: space-between; }
.mk-right { margin-left: auto; }
.mk-stat { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 18px; }
.mk-stat .mk-label { color: var(--muted); font-size: 12.5px; }
.mk-stat .mk-value { font-size: 26px; font-weight: 700; margin-top: 2px; }
.mk-stat .mk-delta { font-size: 12.5px; color: var(--success); }
.mk-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.mk-table th { text-align: left; color: var(--muted); font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; padding: 8px 10px; border-bottom: 1px solid var(--border); }
.mk-table td { padding: 10px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.mk-table tbody tr:nth-child(even) { background: var(--stripe); }
.mk-table tr.mk-selected td { background: var(--primary-soft); }
.mk-num { text-align: right; font-variant-numeric: tabular-nums; }
.mk-btn { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font: inherit; font-weight: 600; padding: 8px 16px; border-radius: 8px; cursor: pointer; text-decoration: none; }
.mk-btn.mk-primary { background: var(--primary); border-color: var(--primary); color: #fff; }
.mk-btn.mk-danger { background: var(--danger); border-color: var(--danger); color: #fff; }
.mk-btn.mk-ghost { background: transparent; }
.mk-btn.mk-sm { padding: 4px 10px; font-size: 12.5px; }
.mk-btn[disabled], .mk-btn.mk-disabled { opacity: .5; }
.mk-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
.mk-field > label { font-size: 12.5px; font-weight: 600; color: var(--muted); }
.mk-input, .mk-select, .mk-textarea { font: inherit; color: var(--text); background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 8px 11px; min-width: 0; }
.mk-textarea { min-height: 84px; }
.mk-hint { font-size: 12px; color: var(--muted); }
.mk-badge { display: inline-block; font-size: 11.5px; font-weight: 650; padding: 2px 9px; border-radius: 999px; background: var(--primary-soft); color: var(--primary-ink); }
.mk-badge.mk-success { background: color-mix(in srgb, var(--success) 15%, var(--surface)); color: var(--success); }
.mk-badge.mk-warn { background: color-mix(in srgb, var(--warn) 17%, var(--surface)); color: var(--warn); }
.mk-badge.mk-danger { background: color-mix(in srgb, var(--danger) 14%, var(--surface)); color: var(--danger); }
.mk-badge.mk-neutral { background: var(--stripe); color: var(--muted); border: 1px solid var(--border); }
.mk-alert { border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; border: 1px solid var(--border); background: var(--primary-soft); }
.mk-alert.mk-warn { background: color-mix(in srgb, var(--warn) 12%, var(--surface)); border-color: color-mix(in srgb, var(--warn) 40%, var(--border)); }
.mk-alert.mk-danger { background: color-mix(in srgb, var(--danger) 10%, var(--surface)); border-color: color-mix(in srgb, var(--danger) 40%, var(--border)); }
.mk-alert.mk-success { background: color-mix(in srgb, var(--success) 12%, var(--surface)); border-color: color-mix(in srgb, var(--success) 40%, var(--border)); }
.mk-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: 16px; }
.mk-tabs a { padding: 8px 14px; color: var(--muted); text-decoration: none; border-bottom: 2px solid transparent; font-weight: 600; }
.mk-tabs a.active { color: var(--primary-ink); border-bottom-color: var(--primary); }
.mk-list { list-style: none; margin: 0; padding: 0; }
.mk-list li { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
.mk-list li:last-child { border-bottom: 0; }
.mk-kv { display: grid; grid-template-columns: 150px 1fr; gap: 6px 14px; margin: 0; }
.mk-kv dt { color: var(--muted); }
.mk-kv dd { margin: 0; }
.mk-total { font-size: 18px; font-weight: 700; }
.mk-muted { color: var(--muted); }
.mk-mono { font-family: ui-monospace, "SF Mono", Menlo, monospace; }
.mk-divider { height: 1px; background: var(--border); margin: 14px 0; }
.mk-empty { text-align: center; color: var(--muted); padding: 36px 10px; }
.mk-progress { height: 8px; border-radius: 99px; background: var(--stripe); border: 1px solid var(--border); overflow: hidden; }
.mk-progress > span { display: block; height: 100%; background: var(--primary); }
.mk-steps { display: flex; gap: 8px; margin-bottom: 18px; }
.mk-steps > span { flex: 1; padding: 8px 12px; border-radius: 8px; background: var(--stripe); border: 1px solid var(--border); color: var(--muted); font-size: 12.5px; font-weight: 600; }
.mk-steps > span.active { background: var(--primary-soft); color: var(--primary-ink); border-color: var(--primary); }
.mk-bars { display: flex; align-items: flex-end; gap: 10px; height: 150px; padding-top: 8px; }
.mk-bars > div { flex: 1; background: var(--primary); border-radius: 6px 6px 0 0; min-height: 4px; position: relative; opacity: .9; }
.mk-bars > div > small { position: absolute; bottom: -20px; left: 0; right: 0; text-align: center; color: var(--muted); font-size: 11px; }
.mk-calendar { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
.mk-calendar .mk-day { min-height: 74px; border: 1px solid var(--border); border-radius: 8px; padding: 6px 8px; background: var(--surface); font-size: 12px; }
.mk-calendar .mk-day.mk-off { background: var(--stripe); color: var(--muted); }
.mk-calendar .mk-event { margin-top: 4px; padding: 2px 6px; border-radius: 5px; background: var(--primary-soft); color: var(--primary-ink); font-size: 11.5px; }
.mk-modal-backdrop { position: absolute; inset: 0; background: rgba(15,20,36,.45); display: flex; align-items: flex-start; justify-content: center; padding-top: 70px; }
.mk-modal { background: var(--surface); border-radius: 14px; padding: 22px 24px; width: min(460px, 90%); box-shadow: 0 20px 60px rgba(0,0,0,.35); }
.mk-modal h3 { margin: 0 0 8px; }
.mk-login { min-height: calc(100vh - 56px); display: flex; align-items: center; justify-content: center; }
.mk-login .mk-card { width: min(380px, 92%); }
.mk-draft { position: fixed; right: 14px; bottom: 12px; background: #17203A; color: #fff; font-size: 11px; font-weight: 700; letter-spacing: .06em; padding: 5px 10px; border-radius: 999px; opacity: .85; }
`;

/** What the model is told about the kit: every class it may use, with the markup shape. */
export const MOCKUP_KIT_REFERENCE = `
Page structure (already provided around your content - you write ONLY the content that goes inside <main class="mk-main">):
  .mk-page-title (h1), .mk-sub (a muted line under it)
Layout:   .mk-card (a panel; give it an <h3> title), .mk-grid + .mk-cols-2 | .mk-cols-3 | .mk-cols-4, .mk-split (a wide column and a narrow side column), .mk-row (horizontal group; add .mk-between to spread, .mk-right on a child to push it right)
Numbers:  .mk-stat > .mk-label + .mk-value (+ .mk-delta)
Tables:   <table class="mk-table"><thead><tr><th>..</th></tr></thead><tbody>..</tbody></table>; add class mk-num to numeric cells; tr.mk-selected highlights a row
Buttons:  <a class="mk-btn">, <a class="mk-btn mk-primary">, mk-danger, mk-ghost, mk-sm (combine, e.g. "mk-btn mk-primary mk-sm"); use <span class="mk-btn mk-disabled"> for a disabled one
Forms:    <div class="mk-field"><label>..</label><input class="mk-input" value=".."></div>; <select class="mk-select"><option>..</option></select>; <textarea class="mk-textarea">..</textarea>; <div class="mk-hint">..</div>
Status:   <span class="mk-badge">, mk-success, mk-warn, mk-danger, mk-neutral
Messages: <div class="mk-alert">, mk-warn, mk-danger, mk-success
Tabs:     <div class="mk-tabs"><a class="active">..</a><a>..</a></div>
Lists:    <ul class="mk-list"><li>..</li></ul>; key/value: <dl class="mk-kv"><dt>..</dt><dd>..</dd></dl>
Progress: <div class="mk-progress"><span style="width:60%"></span></div>; steps: <div class="mk-steps"><span class="active">1 ..</span><span>2 ..</span></div>
Charts:   <div class="mk-bars"><div style="height:60%"><small>Mon</small></div>..</div> (simple bar chart)
Calendar: <div class="mk-calendar"> with children <div class="mk-day"><b>12</b><div class="mk-event">09:00 Lesson</div></div> (.mk-off for days outside the month)
Dialog:   <div class="mk-modal-backdrop"><div class="mk-modal"><h3>..</h3>..<div class="mk-row"><a class="mk-btn">Cancel</a><a class="mk-btn mk-danger">Delete</a></div></div></div> (place it last inside the content so it overlays the page)
Other:    .mk-total (big amount), .mk-muted, .mk-mono, .mk-divider, .mk-empty (empty state), .mk-avatar
Login screens: wrap in <div class="mk-login"><div class="mk-card">..</div></div>
Only width/height percentages may use style=""; everything else must use these classes.`.trim();

export interface MockupNavItem {
	label: string;
	/** Where the item goes: another mockup's page, when one exists for that use case. */
	href?: string;
	active?: boolean;
}

export interface MockupPageOptions {
	title: string;
	theme: MockupTheme;
	/** Whose view this is, shown in the top bar ("Cashier"). */
	actorLabel?: string;
	navTitle?: string;
	nav: MockupNavItem[];
	/** The screen's content: the model's HTML (already sanitized). */
	bodyHtml: string;
	/** Hide the side menu (login screens). */
	bare?: boolean;
}

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * The complete page for one mockup: the kit, the theme, an app frame built from data (top bar + a menu of the
 * actor's use cases), and the model's content in the middle. The Content-Security-Policy makes the page
 * inert whatever the model wrote: no scripts, no network, no frames; only inline styles and data: images.
 */
export function buildMockupPage(o: MockupPageOptions): string {
	const initials = (o.actorLabel || o.theme.appName).split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
	const nav = o.nav.map(n => `<a${n.active ? ' class="active"' : ''}${n.href ? ` href="${esc(n.href)}"` : ''}>${esc(n.label)}</a>`).join('');
	return `<!DOCTYPE html>
<html lang="en" data-mode="${o.theme.mode}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'">
<title>${esc(o.title)} - draft mockup</title>
<style>
${MOCKUP_KIT_CSS}
:root { --primary: ${o.theme.primary}; }
</style>
</head>
<body>
<div class="mk-app">
	<header class="mk-topbar">
		<span class="mk-brand">${esc(o.theme.appName)}</span>
		<span class="mk-spacer"></span>
		<span class="mk-user">${o.actorLabel ? esc(o.actorLabel) : ''}<span class="mk-avatar">${esc(initials)}</span></span>
	</header>
	<div class="mk-body"${o.bare ? ' style="grid-template-columns: 1fr"' : ''}>
		${o.bare ? '' : `<aside class="mk-side"><div class="mk-nav-title">${esc(o.navTitle || 'Menu')}</div><nav class="mk-nav">${nav}</nav></aside>`}
		<main class="mk-main">
${o.bodyHtml}
		</main>
	</div>
</div>
<div class="mk-draft">DRAFT MOCKUP</div>
</body>
</html>`;
}
