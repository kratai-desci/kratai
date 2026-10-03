import { DOC_STYLE, THEME_SYNC_SCRIPT } from './srsDocView.js';

function escapeXml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * First-run guided flow for a project with no code: overview, actors, use
 * cases per actor, non-functional requirements, then review. UI PREVIEW ONLY
 * for now - every suggestion below is hard-coded mock data and nothing here
 * calls the AI or writes a spec; it exists so the flow can be judged before
 * anything is wired up. Lives in the Spec view (it is what /srs-preview serves
 * for a signed-in project with no code and no spec yet).
 */
export function generateNewProjectWizardHTML(workspaceName: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeXml(workspaceName)} - New project</title>
${THEME_SYNC_SCRIPT}
<style>
${DOC_STYLE}
	body { height: auto; min-height: 100%; }
	#wiz { max-width: 720px; margin: 0 auto; padding: 36px 24px 56px; }
	.kicker { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--accent); font-weight: 700; }
	h1 { margin: 8px 0 4px; font-size: 28px; }
	.lead { margin: 0 0 22px; color: var(--text-dim); font-size: 14px; line-height: 1.55; }
	.preview-tag { display: inline-block; margin-left: 8px; padding: 1px 8px; border-radius: 999px; font-size: 10.5px; font-weight: 650; letter-spacing: 0.03em; color: var(--text-dim); border: 1px dashed var(--border); text-transform: none; vertical-align: middle; }

	#steps { display: flex; gap: 6px; margin-bottom: 18px; flex-wrap: wrap; }
	.step { display: flex; align-items: center; gap: 8px; padding: 6px 12px 6px 8px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); color: var(--text-faint); font-size: 12.5px; font-weight: 600; }
	.step .num { width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; font-size: 11px; background: var(--bg); color: var(--text-faint); }
	.step.active { color: var(--text); border-color: var(--accent); }
	.step.active .num { background: var(--accent); color: #fff; }
	.step.done { color: var(--text-dim); }
	.step.done .num { background: var(--accent-2); color: #fff; }

	.card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 24px 26px; }
	.card h2 { margin: 0 0 4px; font-size: 18px; }
	.card .sub { margin: 0 0 18px; color: var(--text-dim); font-size: 13.5px; line-height: 1.55; }
	label.field { display: block; margin-bottom: 16px; }
	.field .label { display: block; font-size: 12.5px; font-weight: 650; margin-bottom: 6px; }
	.field .hint { display: block; font-size: 12px; color: var(--text-faint); margin-top: 5px; }
	textarea, input[type="text"] { width: 100%; font: inherit; font-size: 14px; color: var(--text); background: var(--bg); border: 1px solid var(--border); border-radius: 9px; padding: 10px 12px; outline: none; }
	textarea { min-height: 92px; resize: vertical; line-height: 1.5; }
	textarea:focus, input[type="text"]:focus { border-color: var(--accent); }
	input[readonly] { color: var(--text-dim); }

	.tag { font-size: 10.5px; font-weight: 650; letter-spacing: 0.03em; text-transform: uppercase; color: var(--accent-2); }
	.addrow { display: flex; gap: 8px; margin-bottom: 14px; }
	.addrow input { flex: 1; }
	button { font: inherit; cursor: pointer; }
	.btn { border: 1px solid var(--border); background: var(--surface); color: var(--text); border-radius: 9px; padding: 9px 16px; font-size: 13.5px; font-weight: 600; }
	.btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
	.btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
	.btn.primary:hover:not(:disabled) { color: #fff; opacity: 0.92; }
	.btn:disabled { opacity: 0.45; cursor: not-allowed; }

	.opt { display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; border: 1px solid var(--border); border-radius: 11px; margin-bottom: 8px; cursor: pointer; background: var(--surface); }
	.opt:hover { border-color: var(--accent); }
	.opt.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 7%, var(--surface)); }
	.opt input { margin-top: 3px; accent-color: var(--accent); }
	.opt .t { font-size: 14px; font-weight: 650; }
	.opt .d { font-size: 12.5px; color: var(--text-dim); margin-top: 2px; line-height: 1.45; }
	.opt .cat { margin-left: auto; padding-left: 12px; font-size: 10.5px; font-weight: 650; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-faint); white-space: nowrap; }

	.group { margin-top: 20px; }
	.group:first-of-type { margin-top: 0; }
	.group h3 { margin: 0 0 8px; font-size: 14px; display: flex; align-items: center; gap: 8px; }
	.group h3 .count { font-size: 11.5px; font-weight: 600; color: var(--text-faint); }
	.empty { padding: 14px; border: 1px dashed var(--border); border-radius: 10px; color: var(--text-faint); font-size: 13px; }

	.nav { display: flex; align-items: center; justify-content: space-between; margin-top: 18px; }
	.nav .where { font-size: 12.5px; color: var(--text-faint); }
	.nav .right { display: flex; gap: 8px; align-items: center; }

	.review h3 { margin: 18px 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-faint); }
	.review h3:first-of-type { margin-top: 0; }
	.review p { margin: 0 0 4px; font-size: 14px; line-height: 1.55; }
	.review ul { margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.7; }
	.review .actor-line { font-weight: 650; }
	.will { margin-top: 18px; padding: 12px 14px; border-radius: 10px; background: var(--bg); color: var(--text-dim); font-size: 13px; line-height: 1.55; }
	#note { display: none; margin-top: 14px; padding: 14px 16px; border-radius: 10px; border: 1px dashed var(--accent); color: var(--text-dim); font-size: 13px; line-height: 1.55; }
	#note strong { color: var(--text); }
</style>
</head>
<body>
<div id="wiz">
	<div class="kicker">New project <span class="preview-tag">UI preview - suggestions are examples, nothing is saved</span></div>
	<h1>${escapeXml(workspaceName)}</h1>
	<p class="lead">Answer a few questions and kratai will draft your first spec. You can change anything afterwards by talking to it.</p>
	<div id="steps"></div>
	<div id="stage"></div>
</div>
<script>
(function () {
	'use strict';
	var PROJECT = ${JSON.stringify(workspaceName)};
	var STEPS = ['Overview', 'Actors', 'Use cases', 'Requirements', 'Review'];

	// Mock suggestions - in the real flow these come from the AI, based on step 1.
	var ACTOR_SUGGESTIONS = [
		{ name: 'User', desc: 'Someone who signs up and uses the app day to day', on: true },
		{ name: 'Administrator', desc: 'Manages accounts and keeps the system healthy', on: true },
		{ name: 'Guest', desc: 'A visitor who has not signed in yet', on: false },
		{ name: 'External service', desc: 'A third-party system the app talks to, such as email or payments', on: false }
	];
	var USE_CASE_SUGGESTIONS = {
		'User': ['Create an account', 'Log in', 'Browse listings', 'Message another user', 'Update my profile'],
		'Administrator': ['Review reported content', 'Suspend an account', 'View usage statistics'],
		'Guest': ['Browse public listings', 'Register for an account'],
		'External service': ['Deliver a notification', 'Confirm a payment']
	};
	var USE_CASE_DEFAULT = ['Log in', 'View my dashboard', 'Update my settings'];
	var NFR_SUGGESTIONS = [
		{ name: 'Security', desc: 'People can only see and change their own data.', cat: 'Functionality', on: true },
		{ name: 'Ease of use', desc: 'A new user completes their first task without any help.', cat: 'Usability', on: true },
		{ name: 'Availability', desc: 'The service is up at least 99.5% of the time.', cat: 'Reliability', on: false },
		{ name: 'Speed', desc: 'Common pages respond in under 2 seconds.', cat: 'Performance', on: true },
		{ name: 'Traceability', desc: 'Errors are logged so a problem can be traced to its cause.', cat: 'Supportability', on: false },
		{ name: 'Browser support', desc: 'Works on the latest two versions of the major browsers.', cat: 'Constraints', on: false }
	];

	var state = { step: 0, what: '', who: '', actors: null, useCases: {}, nfrs: null };

	function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
	function ensureActors() { if (!state.actors) state.actors = ACTOR_SUGGESTIONS.map(function (a) { return { name: a.name, desc: a.desc, on: a.on, ai: true }; }); }
	function ensureNfrs() { if (!state.nfrs) state.nfrs = NFR_SUGGESTIONS.map(function (n) { return { name: n.name, desc: n.desc, cat: n.cat, on: n.on, ai: true }; }); }
	function chosenActors() { ensureActors(); return state.actors.filter(function (a) { return a.on; }); }
	function ensureUseCases(actor) {
		if (!state.useCases[actor.name]) {
			var list = USE_CASE_SUGGESTIONS[actor.name] || USE_CASE_DEFAULT;
			state.useCases[actor.name] = list.map(function (n, i) { return { name: n, on: i < 3, ai: true }; });
		}
		return state.useCases[actor.name];
	}
	function chosenNfrs() { ensureNfrs(); return state.nfrs.filter(function (n) { return n.on; }); }

	function opt(kind, idx, on, title, desc, cat, extra) {
		return '<label class="opt' + (on ? ' on' : '') + '"><input type="checkbox" data-kind="' + kind + '" data-idx="' + idx + '"' + (extra || '') + (on ? ' checked' : '') + '>' +
			'<span><div class="t">' + esc(title) + '</div>' + (desc ? '<div class="d">' + esc(desc) + '</div>' : '') + '</span>' +
			(cat ? '<span class="cat">' + esc(cat) + '</span>' : '') + '</label>';
	}

	function stepOverview() {
		return '<div class="card"><h2>Tell us about your project</h2><p class="sub">A few sentences is enough - this is what the AI uses to suggest everything that follows.</p>' +
			'<label class="field"><span class="label">Project name</span><input type="text" value="' + esc(PROJECT) + '" readonly></label>' +
			'<label class="field"><span class="label">What is it?</span><textarea id="what" placeholder="A web app where housemates share chores and keep track of whose turn it is.">' + esc(state.what) + '</textarea></label>' +
			'<label class="field"><span class="label">Who will use it, and what problem does it solve?</span><textarea id="who" placeholder="Housemates who keep forgetting whose turn it is, which causes arguments.">' + esc(state.who) + '</textarea><span class="hint">Optional, but it makes the suggestions better.</span></label></div>';
	}

	function stepActors() {
		ensureActors();
		var html = '<div class="card"><h2>Who will use it?</h2><p class="sub">An actor is a kind of person (or system) that interacts with your app. <span class="tag">Suggested from your description</span> - tick the ones that fit, or add your own.</p>' +
			'<div class="addrow"><input type="text" id="add-actor" placeholder="Add your own, e.g. Landlord"><button class="btn" data-action="add-actor">Add</button></div>';
		html += state.actors.map(function (a, i) { return opt('actor', i, a.on, a.name, a.desc || 'Added by you'); }).join('');
		return html + '</div>';
	}

	function stepUseCases() {
		var actors = chosenActors();
		var html = '<div class="card"><h2>What can each of them do?</h2><p class="sub">A use case is one thing an actor does, named with a verb (for example "Log in"). <span class="tag">Suggested</span> - keep the ones you need and add the rest.</p>';
		if (actors.length === 0) return html + '<div class="empty">Choose at least one actor in the previous step.</div></div>';
		actors.forEach(function (actor, ai) {
			var list = ensureUseCases(actor);
			var picked = list.filter(function (u) { return u.on; }).length;
			html += '<div class="group"><h3>' + esc(actor.name) + '<span class="count">' + picked + ' selected</span></h3>' +
				'<div class="addrow"><input type="text" data-add-uc="' + ai + '" placeholder="Add a use case for ' + esc(actor.name) + '"><button class="btn" data-action="add-uc" data-idx="' + ai + '">Add</button></div>' +
				list.map(function (u, i) { return opt('uc', ai + ':' + i, u.on, u.name, '', ''); }).join('') + '</div>';
		});
		return html + '</div>';
	}

	function stepNfrs() {
		ensureNfrs();
		var html = '<div class="card"><h2>What qualities matter?</h2><p class="sub">Non-functional requirements describe how well the system must work, not what it does. <span class="tag">Suggested</span> - grouped the way FURPS+ organises them.</p>' +
			'<div class="addrow"><input type="text" id="add-nfr" placeholder="Add your own, e.g. Works offline"><button class="btn" data-action="add-nfr">Add</button></div>';
		html += state.nfrs.map(function (n, i) { return opt('nfr', i, n.on, n.name, n.desc, n.cat); }).join('');
		return html + '</div>';
	}

	function stepReview() {
		var actors = chosenActors();
		var html = '<div class="card review"><h2>Review</h2><p class="sub">This is what the first draft of your spec will be built from.</p>';
		html += '<h3>Overview</h3><p>' + (state.what ? esc(state.what) : '<em>(nothing entered)</em>') + '</p>' + (state.who ? '<p>' + esc(state.who) + '</p>' : '');
		html += '<h3>Actors and use cases</h3>';
		if (actors.length === 0) html += '<p><em>No actors chosen.</em></p>';
		actors.forEach(function (a) {
			var ucs = ensureUseCases(a).filter(function (u) { return u.on; });
			html += '<p class="actor-line">' + esc(a.name) + '</p><ul>' + (ucs.length ? ucs.map(function (u) { return '<li>' + esc(u.name) + '</li>'; }).join('') : '<li><em>no use cases chosen</em></li>') + '</ul>';
		});
		var nfrs = chosenNfrs();
		html += '<h3>Requirements</h3><ul>' + (nfrs.length ? nfrs.map(function (n) { return '<li><strong>' + esc(n.name) + '</strong> - ' + esc(n.desc) + '</li>'; }).join('') : '<li><em>none chosen</em></li>') + '</ul>';
		html += '<div class="will">When you create the spec, kratai also drafts a <strong>data model</strong> from these use cases and writes the full document. Then the chat opens: <em>"Here is the initial design - tell me what to change."</em></div>';
		html += '<div id="note"><strong>This is a UI preview.</strong> Nothing was generated or saved. In the real flow this step builds the spec (overview, use case model, data model) and the chat on the right takes over for edits.</div>';
		return html + '</div>';
	}

	var RENDER = [stepOverview, stepActors, stepUseCases, stepNfrs, stepReview];

	function canContinue() { return state.step !== 0 || state.what.trim().length > 0; }

	// toTop only when moving between steps - ticking or adding an item re-renders
	// the same step and must leave the scroll position alone.
	function render(toTop) {
		document.getElementById('steps').innerHTML = STEPS.map(function (s, i) {
			var cls = i === state.step ? 'active' : (i < state.step ? 'done' : '');
			return '<div class="step ' + cls + '"><span class="num">' + (i < state.step ? '&#10003;' : (i + 1)) + '</span>' + s + '</div>';
		}).join('');
		var last = state.step === STEPS.length - 1;
		document.getElementById('stage').innerHTML = RENDER[state.step]() +
			'<div class="nav"><span class="where">Step ' + (state.step + 1) + ' of ' + STEPS.length + '</span><div class="right">' +
			(state.step > 0 ? '<button class="btn" data-action="back">Back</button>' : '') +
			'<button class="btn primary" data-action="' + (last ? 'create' : 'next') + '"' + (canContinue() ? '' : ' disabled') + '>' + (last ? 'Create my spec' : 'Continue') + '</button></div></div>';
		if (toTop) window.scrollTo(0, 0);
	}

	var stage = document.getElementById('stage');
	stage.addEventListener('click', function (e) {
		var t = e.target.closest ? e.target.closest('[data-action]') : null;
		if (!t) return;
		var a = t.getAttribute('data-action');
		if (a === 'next') { state.step++; render(true); }
		else if (a === 'back') { state.step--; render(true); }
		else if (a === 'create') { document.getElementById('note').style.display = 'block'; t.disabled = true; t.textContent = 'Preview only'; }
		else if (a === 'add-actor') {
			var f = document.getElementById('add-actor'), v = f.value.trim();
			if (v) { state.actors.push({ name: v, desc: '', on: true }); render(); }
		} else if (a === 'add-nfr') {
			var g = document.getElementById('add-nfr'), w = g.value.trim();
			if (w) { state.nfrs.push({ name: w, desc: 'Added by you', cat: 'Yours', on: true }); render(); }
		} else if (a === 'add-uc') {
			var idx = +t.getAttribute('data-idx'), box = stage.querySelector('[data-add-uc="' + idx + '"]'), name = box.value.trim();
			if (name) { ensureUseCases(chosenActors()[idx]).push({ name: name, on: true }); render(); }
		}
	});
	stage.addEventListener('change', function (e) {
		var el = e.target;
		if (!el.matches || !el.matches('input[type="checkbox"]')) return;
		var kind = el.getAttribute('data-kind'), idx = el.getAttribute('data-idx');
		if (kind === 'actor') state.actors[+idx].on = el.checked;
		else if (kind === 'nfr') state.nfrs[+idx].on = el.checked;
		else if (kind === 'uc') { var p = idx.split(':'); ensureUseCases(chosenActors()[+p[0]])[+p[1]].on = el.checked; }
		var label = el.closest('.opt'); if (label) label.classList.toggle('on', el.checked);
		if (kind === 'uc') render();
	});
	stage.addEventListener('input', function (e) {
		if (e.target.id === 'what') { state.what = e.target.value; var b = stage.querySelector('[data-action="next"]'); if (b) b.disabled = !canContinue(); }
		else if (e.target.id === 'who') state.who = e.target.value;
	});
	stage.addEventListener('keydown', function (e) {
		if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
		var btn = e.target.parentNode.querySelector('[data-action^="add-"]');
		if (btn) { e.preventDefault(); btn.click(); }
	});

	render(true);
})();
</script>
</body>
</html>`;
}
