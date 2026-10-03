import { BRAND_STYLE } from './welcomeScreen.js';

function escapeHtml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Full-window guided first draft for a project with no code - shown before the
 * project view opens (see index.ts's promptNewProjectSetup), in the same card
 * style as the welcome screen so it reads as setup, not as part of the app.
 * Steps: overview, actors, use cases per actor, non-functional requirements,
 * review. UI PREVIEW ONLY: every suggestion is hard-coded mock data, nothing
 * calls the AI or writes a spec, and both exits ("Skip" and "Open project")
 * just continue into the app. Like every screen here it has no preload, so the
 * exits are kratai-action:// links that index.ts's will-navigate handler turns
 * into a real action.
 */
export function getNewProjectHTML(workspaceName: string, logoDataUrl: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>New project</title>
<style>
	${BRAND_STYLE}
	:root { --text-faint: color-mix(in srgb, var(--text-dim) 75%, var(--bg)); --accent-2: var(--ok); }
	button, a.btn { font: inherit; cursor: pointer; text-decoration: none; }
	#card { width: min(700px, calc(100vw - 48px)); max-height: calc(100vh - 48px); display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; box-shadow: var(--card-shadow); overflow: hidden; }
	#head { display: flex; align-items: center; gap: 12px; padding: 22px 28px 4px; }
	#head img { width: 38px; height: 38px; border-radius: 9px; box-shadow: 0 4px 12px -4px rgba(23, 32, 58, 0.35); }
	#head .who { flex: 1; min-width: 0; }
	#head .kicker { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--accent); }
	#head .kicker .preview { margin-left: 6px; padding: 1px 7px; border: 1px dashed var(--border); border-radius: 999px; color: var(--text-dim); text-transform: none; letter-spacing: 0; font-weight: 600; }
	#head h1 { margin: 2px 0 0; font-size: 18px; letter-spacing: -0.01em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	#head .skip { font-size: 12.5px; font-weight: 600; color: var(--text-dim); text-decoration: none; }
	#head .skip:hover { color: var(--accent); }
	#steps { display: flex; gap: 6px; padding: 14px 28px 6px; flex-wrap: wrap; }
	.step { display: flex; align-items: center; gap: 7px; padding: 5px 11px 5px 7px; border-radius: 999px; border: 1px solid var(--border); color: var(--text-faint); font-size: 12px; font-weight: 600; }
	.step .num { width: 19px; height: 19px; border-radius: 50%; display: grid; place-items: center; font-size: 10.5px; background: var(--bg); }
	.step.active { color: var(--text); border-color: var(--accent); }
	.step.active .num { background: var(--accent); color: #fff; }
	.step.done { color: var(--text-dim); }
	.step.done .num { background: var(--accent-2); color: #fff; }
	#stage { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 28px 18px; }
	@media (min-height: 800px) { #stage { min-height: 470px; } }
	#stage h2 { margin: 4px 0 4px; font-size: 18px; }
	#stage .sub { margin: 0 0 16px; color: var(--text-dim); font-size: 13.5px; line-height: 1.55; }
	label.field { display: block; margin-bottom: 15px; }
	.field .label { display: block; font-size: 12.5px; font-weight: 650; margin-bottom: 6px; }
	.field .hint { display: block; font-size: 12px; color: var(--text-faint); margin-top: 5px; }
	textarea, input[type="text"] { width: 100%; font: inherit; font-size: 14px; color: var(--text); background: var(--bg); border: 1px solid var(--border); border-radius: 9px; padding: 10px 12px; outline: none; }
	textarea { min-height: 88px; resize: vertical; line-height: 1.5; }
	textarea:focus, input[type="text"]:focus { border-color: var(--accent); }
	input[readonly] { color: var(--text-dim); }
	.tag { font-size: 10.5px; font-weight: 650; letter-spacing: 0.03em; text-transform: uppercase; color: var(--accent-2); }
	.addrow { display: flex; gap: 8px; margin-bottom: 12px; }
	.addrow input { flex: 1; }
	.btn { border: 1px solid var(--border); background: var(--surface); color: var(--text); border-radius: 9px; padding: 9px 16px; font-size: 13.5px; font-weight: 600; display: inline-block; }
	.btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
	.btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; box-shadow: 0 8px 20px -8px color-mix(in srgb, var(--accent) 60%, transparent); }
	.btn.primary:hover:not(:disabled) { color: #fff; opacity: 0.92; }
	.btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
	.opt { display: flex; gap: 12px; align-items: flex-start; padding: 11px 14px; border: 1px solid var(--border); border-radius: 11px; margin-bottom: 7px; cursor: pointer; }
	.opt:hover { border-color: var(--accent); }
	.opt.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 7%, var(--surface)); }
	.opt input { margin-top: 3px; accent-color: var(--accent); }
	.opt .t { font-size: 14px; font-weight: 650; }
	.opt .d { font-size: 12.5px; color: var(--text-dim); margin-top: 2px; line-height: 1.45; }
	.opt .cat { margin-left: auto; padding-left: 12px; font-size: 10.5px; font-weight: 650; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text-faint); white-space: nowrap; }
	#stage h2 .count { margin-left: 10px; font-size: 11.5px; font-weight: 600; color: var(--text-faint); }
	.empty { padding: 14px; border: 1px dashed var(--border); border-radius: 10px; color: var(--text-faint); font-size: 13px; }
	.loading { padding: 18px 0 8px; }
	.loading h2 { display: flex; align-items: center; gap: 12px; }
	.spin { width: 20px; height: 20px; flex: none; border-radius: 50%; border: 3px solid var(--border); border-top-color: var(--accent); animation: spin 0.8s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }
	.skel { margin-top: 18px; }
	.sk { height: 52px; border-radius: 11px; margin-bottom: 8px; background: linear-gradient(90deg, var(--bg) 25%, color-mix(in srgb, var(--border) 60%, var(--bg)) 50%, var(--bg) 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; }
	.sk:nth-child(2) { animation-delay: 0.1s; } .sk:nth-child(3) { animation-delay: 0.2s; } .sk:nth-child(4) { animation-delay: 0.3s; }
	@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
	.checks { list-style: none; margin: 18px 0 0; padding: 0; }
	.checks li { display: flex; align-items: center; gap: 12px; padding: 9px 0; font-size: 14px; color: var(--text-faint); }
	.checks li.active { color: var(--text); font-weight: 600; }
	.checks li.done { color: var(--text-dim); }
	.checks .mark { width: 20px; height: 20px; flex: none; display: grid; place-items: center; border-radius: 50%; font-size: 11px; border: 2px solid var(--border); }
	.checks li.done .mark { background: var(--accent-2); border-color: var(--accent-2); color: #fff; }
	.checks li.active .mark { border-color: var(--border); border-top-color: var(--accent); animation: spin 0.8s linear infinite; }
	#nav { display: flex; align-items: center; justify-content: space-between; padding: 14px 28px; border-top: 1px solid var(--border); }
	#nav .where { font-size: 12.5px; color: var(--text-faint); }
	#nav .right { display: flex; gap: 8px; align-items: center; }
	.review h3 { margin: 16px 0 6px; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-faint); }
	.review h3:first-of-type { margin-top: 0; }
	.review p { margin: 0 0 4px; font-size: 14px; line-height: 1.55; }
	.review ul { margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.7; }
	.review .actor-line { font-weight: 650; margin-top: 4px; }
	.will { margin-top: 16px; padding: 12px 14px; border-radius: 10px; background: var(--bg); color: var(--text-dim); font-size: 13px; line-height: 1.55; }
	.will strong, #note strong { color: var(--text); }
	#note { margin-top: 12px; padding: 13px 15px; border-radius: 10px; border: 1px dashed var(--accent); color: var(--text-dim); font-size: 13px; line-height: 1.55; }
</style>
</head>
<body>
<div id="card">
	<div id="head">
		<img src="${logoDataUrl}" alt="">
		<div class="who"><div class="kicker">New project<span class="preview">UI preview - examples only, nothing is saved</span></div><h1>${escapeHtml(workspaceName)}</h1></div>
		<a class="skip" href="kratai-action://skip-setup">Skip for now</a>
	</div>
	<div id="steps"></div>
	<div id="stage"></div>
	<div id="nav"></div>
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

	var state = { step: 0, ucIndex: 0, what: '', who: '', actors: null, useCases: {}, nfrs: null, created: false, loading: null, creating: null };
	// What each AI-backed step's suggestions were last generated from, so moving
	// forward only "regenerates" them when an earlier choice actually changed.
	var lastSig = {};

	function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
	function ensureActors() { if (!state.actors) state.actors = ACTOR_SUGGESTIONS.map(function (a) { return { name: a.name, desc: a.desc, on: a.on }; }); }
	function ensureNfrs() { if (!state.nfrs) state.nfrs = NFR_SUGGESTIONS.map(function (n) { return { name: n.name, desc: n.desc, cat: n.cat, on: n.on }; }); }
	function chosenActors() { ensureActors(); return state.actors.filter(function (a) { return a.on; }); }
	function ensureUseCases(actor) {
		if (!state.useCases[actor.name]) {
			var list = USE_CASE_SUGGESTIONS[actor.name] || USE_CASE_DEFAULT;
			state.useCases[actor.name] = list.map(function (n, i) { return { name: n, on: i < 3 }; });
		}
		return state.useCases[actor.name];
	}
	function chosenNfrs() { ensureNfrs(); return state.nfrs.filter(function (n) { return n.on; }); }

	function opt(kind, idx, on, title, desc, cat) {
		return '<label class="opt' + (on ? ' on' : '') + '"><input type="checkbox" data-kind="' + kind + '" data-idx="' + idx + '"' + (on ? ' checked' : '') + '>' +
			'<span><div class="t">' + esc(title) + '</div>' + (desc ? '<div class="d">' + esc(desc) + '</div>' : '') + '</span>' +
			(cat ? '<span class="cat">' + esc(cat) + '</span>' : '') + '</label>';
	}

	function stepOverview() {
		return '<h2>Tell us about your project</h2><p class="sub">A few sentences is enough - this is what the AI uses to suggest everything that follows.</p>' +
			'<label class="field"><span class="label">Project name</span><input type="text" value="' + esc(PROJECT) + '" readonly></label>' +
			'<label class="field"><span class="label">What is it?</span><textarea id="what" placeholder="A web app where housemates share chores and keep track of whose turn it is.">' + esc(state.what) + '</textarea></label>' +
			'<label class="field"><span class="label">Who will use it, and what problem does it solve?</span><textarea id="who" placeholder="Housemates who keep forgetting whose turn it is, which causes arguments.">' + esc(state.who) + '</textarea><span class="hint">Optional, but it makes the suggestions better.</span></label>';
	}
	function stepActors() {
		ensureActors();
		return '<h2>Who will use it?</h2><p class="sub">An actor is a kind of person (or system) that interacts with your app. <span class="tag">Suggested from your description</span> - tick the ones that fit, or add your own.</p>' +
			'<div class="addrow"><input type="text" id="add-actor" placeholder="Add your own, e.g. Landlord"><button class="btn" data-action="add-actor">Add</button></div>' +
			state.actors.map(function (a, i) { return opt('actor', i, a.on, a.name, a.desc || 'Added by you'); }).join('');
	}
	// One actor per screen (state.ucIndex), so each actor gets its own full
	// attention instead of a long list of everyone's use cases.
	function stepUseCases() {
		var actors = chosenActors();
		if (actors.length === 0) return '<h2>What can they do?</h2><div class="empty">Choose at least one actor in the previous step.</div>';
		var actor = actors[state.ucIndex];
		var list = ensureUseCases(actor);
		var picked = list.filter(function (u) { return u.on; }).length;
		return '<h2>What can ' + esc(actor.name) + ' do?<span class="count">' + picked + ' selected</span></h2>' +
			'<p class="sub">' + (actor.desc ? esc(actor.desc) + '. ' : '') + 'A use case is one thing this actor does, named with a verb (for example "Log in"). <span class="tag">Suggested</span> - keep the ones you need and add the rest.</p>' +
			'<div class="addrow"><input type="text" data-add-uc="' + state.ucIndex + '" placeholder="Add a use case for ' + esc(actor.name) + '"><button class="btn" data-action="add-uc" data-idx="' + state.ucIndex + '">Add</button></div>' +
			list.map(function (u, i) { return opt('uc', state.ucIndex + ':' + i, u.on, u.name, '', ''); }).join('');
	}
	function stepNfrs() {
		ensureNfrs();
		return '<h2>What qualities matter?</h2><p class="sub">Non-functional requirements describe how well the system must work, not what it does. <span class="tag">Suggested</span> - grouped the way FURPS+ organises them.</p>' +
			'<div class="addrow"><input type="text" id="add-nfr" placeholder="Add your own, e.g. Works offline"><button class="btn" data-action="add-nfr">Add</button></div>' +
			state.nfrs.map(function (n, i) { return opt('nfr', i, n.on, n.name, n.desc, n.cat); }).join('');
	}
	function stepReview() {
		var actors = chosenActors();
		var html = '<div class="review"><h2>Review</h2><p class="sub">This is what the first draft of your spec will be built from.</p>';
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
		if (state.created) html += '<div id="note"><strong>This is a UI preview.</strong> Nothing was generated or saved. In the real flow this step builds the spec (overview, use case model, data model) and the chat takes over for edits.</div>';
		return html + '</div>';
	}

	var RENDER = [stepOverview, stepActors, stepUseCases, stepNfrs, stepReview];

	// --- Simulated AI processing (the real flow calls the model here) ---
	function names(list) { return list.map(function (x) { return x.name; }).join(', '); }
	function sigFor(step) {
		if (step === 1) return state.what + '|' + state.who;
		if (step === 2) return names(chosenActors());
		if (step === 3) return chosenActors().map(function (a) { return a.name + ':' + names(ensureUseCases(a).filter(function (u) { return u.on; })); }).join(';');
		return '';
	}
	function needsGeneration(step) { return step >= 1 && step <= 3 && lastSig[step] !== sigFor(step); }
	var LOADING = {
		1: function () { return { title: 'Thinking about who will use ' + PROJECT, sub: 'Reading your description to suggest the people and systems involved.', ms: 1800 }; },
		2: function () { return { title: 'Drafting use cases', sub: 'Working out what ' + names(chosenActors()) + ' will each need to do.', ms: 2300 }; },
		3: function () { return { title: 'Choosing requirements that fit', sub: 'Matching quality needs to the use cases you picked.', ms: 1600 }; }
	};
	function startLoading(step) {
		var info = LOADING[step]();
		state.loading = info;
		render(true);
		setTimeout(function () { lastSig[step] = sigFor(step); state.loading = null; render(true); }, info.ms);
	}
	var CREATE_STEPS = ['Writing the overview', 'Drafting the use case model', 'Drafting the data model', 'Putting the spec together'];
	function startCreating() {
		state.creating = { done: 0 };
		render(false);
		var tick = function () {
			state.creating.done++;
			if (state.creating.done >= CREATE_STEPS.length) { state.creating = null; state.created = true; render(false); var st = document.getElementById('stage'); st.scrollTop = st.scrollHeight; return; }
			render(false);
			setTimeout(tick, 900);
		};
		setTimeout(tick, 900);
	}
	function loadingView() {
		if (state.creating) {
			return '<div class="loading"><h2><span class="spin"></span>Building your spec</h2><p class="sub">This is where the real version writes your first draft.</p><ul class="checks">' +
				CREATE_STEPS.map(function (t, i) {
					var cls = i < state.creating.done ? 'done' : (i === state.creating.done ? 'active' : '');
					return '<li class="' + cls + '"><span class="mark">' + (i < state.creating.done ? '&#10003;' : '') + '</span>' + t + '</li>';
				}).join('') + '</ul></div>';
		}
		return '<div class="loading"><h2><span class="spin"></span>' + esc(state.loading.title) + '</h2><p class="sub">' + esc(state.loading.sub) + '</p><div class="skel"><div class="sk"></div><div class="sk"></div><div class="sk"></div><div class="sk"></div></div></div>';
	}

	// The use cases step covers one actor per screen, so Continue/Back move
	// through the actors before they move between steps.
	function goNext() {
		if (state.step === 1) state.ucIndex = 0;
		if (state.step === 2 && state.ucIndex < chosenActors().length - 1) state.ucIndex++;
		else state.step++;
	}
	function goBack() {
		if (state.step === 2 && state.ucIndex > 0) state.ucIndex--;
		else {
			state.step--;
			if (state.step === 2) state.ucIndex = Math.max(0, chosenActors().length - 1);
		}
	}
	function canContinue() {
		if (state.step === 0) return state.what.trim().length > 0;
		if (state.step === 1) return chosenActors().length > 0;
		return true;
	}

	// toTop only when moving between steps - ticking or adding an item re-renders
	// the same step and must leave the scroll position alone.
	function render(toTop) {
		var stage = document.getElementById('stage');
		var scroll = stage.scrollTop;
		document.getElementById('steps').innerHTML = STEPS.map(function (s, i) {
			var cls = i === state.step ? 'active' : (i < state.step ? 'done' : '');
			var n = chosenActors().length;
			var label = i === 2 && state.step === 2 && n > 0 ? s + ' ' + (state.ucIndex + 1) + '/' + n : s;
			return '<div class="step ' + cls + '"><span class="num">' + (i < state.step ? '&#10003;' : (i + 1)) + '</span>' + label + '</div>';
		}).join('');
		var busy = !!(state.loading || state.creating);
		stage.innerHTML = busy ? loadingView() : RENDER[state.step]();
		stage.scrollTop = toTop ? 0 : scroll;
		var last = state.step === STEPS.length - 1;
		var actors = chosenActors();
		var perActor = state.step === 2 && actors.length > 0;
		var nextLabel = perActor && state.ucIndex < actors.length - 1 ? 'Next: ' + esc(actors[state.ucIndex + 1].name) : 'Continue';
		var primary = last
			? (state.created ? '<a class="btn primary" href="kratai-action://finish-setup">Open project</a>' : '<button class="btn primary" data-action="create"' + (busy ? ' disabled' : '') + '>Create my spec</button>')
			: '<button class="btn primary" data-action="next"' + (canContinue() && !busy ? '' : ' disabled') + '>' + nextLabel + '</button>';
		var where = 'Step ' + (state.step + 1) + ' of ' + STEPS.length + (perActor ? ' - ' + esc(actors[state.ucIndex].name) + ' (' + (state.ucIndex + 1) + ' of ' + actors.length + ')' : '');
		document.getElementById('nav').innerHTML = '<span class="where">' + where + '</span><div class="right">' +
			(state.step > 0 && !state.created ? '<button class="btn" data-action="back"' + (busy ? ' disabled' : '') + '>Back</button>' : '') + primary + '</div>';
	}

	var card = document.getElementById('card');
	card.addEventListener('click', function (e) {
		var t = e.target.closest ? e.target.closest('[data-action]') : null;
		if (!t) return;
		var a = t.getAttribute('data-action');
		var stage = document.getElementById('stage');
		if (a === 'next') { var before = state.step; goNext(); if (state.step !== before && needsGeneration(state.step)) startLoading(state.step); else render(true); }
		else if (a === 'back') { goBack(); render(true); }
		else if (a === 'create') { startCreating(); }
		else if (a === 'add-actor') {
			var v = document.getElementById('add-actor').value.trim();
			if (v) { state.actors.push({ name: v, desc: '', on: true }); render(false); }
		} else if (a === 'add-nfr') {
			var w = document.getElementById('add-nfr').value.trim();
			if (w) { state.nfrs.push({ name: w, desc: 'Added by you', cat: 'Yours', on: true }); render(false); }
		} else if (a === 'add-uc') {
			var idx = +t.getAttribute('data-idx'), name = stage.querySelector('[data-add-uc="' + idx + '"]').value.trim();
			if (name) { ensureUseCases(chosenActors()[idx]).push({ name: name, on: true }); render(false); }
		}
	});
	card.addEventListener('change', function (e) {
		var el = e.target;
		if (!el.matches || !el.matches('input[type="checkbox"]')) return;
		var kind = el.getAttribute('data-kind'), idx = el.getAttribute('data-idx');
		if (kind === 'actor') state.actors[+idx].on = el.checked;
		else if (kind === 'nfr') state.nfrs[+idx].on = el.checked;
		else if (kind === 'uc') { var p = idx.split(':'); ensureUseCases(chosenActors()[+p[0]])[+p[1]].on = el.checked; }
		var label = el.closest('.opt'); if (label) label.classList.toggle('on', el.checked);
		if (kind === 'uc') render(false);
	});
	card.addEventListener('input', function (e) {
		if (e.target.id === 'what') { state.what = e.target.value; var b = document.querySelector('[data-action="next"]'); if (b) b.disabled = !canContinue(); }
		else if (e.target.id === 'who') state.who = e.target.value;
	});
	card.addEventListener('keydown', function (e) {
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
