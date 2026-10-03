function escapeHtml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Full-window guided first draft for a project with no code and no spec,
 * served at /new-project (view.ts redirects a blank project here from /) in
 * the same card style as the desktop welcome screen so it reads as setup, not
 * as part of the app. Steps: overview, actors, use cases per actor,
 * non-functional requirements, review. Each suggestion step asks the AI via
 * POST /api/new-project/ai; "Create my spec" posts every choice to
 * /api/new-project/create, which builds and saves the spec; "Skip for now"
 * posts to /api/new-project/skip. All three end by going back to "/".
 */
export function generateNewProjectHTML(workspaceName: string, logoDataUrl: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>New project</title>
<style>
	:root {
		--bg: #EEF2FA; --surface: #FFFFFF; --text: #17203A; --text-dim: #5C6785;
		--border: #DCE3F2; --accent: #3459E0; --ok: #1FA37C; --warn: #C87A17;
		--dot: color-mix(in srgb, #94A0BE 55%, transparent);
		--card-shadow: 0 24px 64px -24px rgba(23, 32, 58, 0.22), 0 8px 24px -8px rgba(23, 32, 58, 0.10);
	}
	@media (prefers-color-scheme: dark) {
		:root {
			--bg: #0A0E19; --surface: #131A2E; --text: #E8ECFB; --text-dim: #939CBE; --border: #262E4E; --accent: #6D93F5; --ok: #3FCB9F; --warn: #E6A23C; --dot: color-mix(in srgb, #262E4E 70%, transparent);
			--card-shadow: 0 24px 64px -24px rgba(0, 0, 0, 0.55), 0 8px 24px -8px rgba(0, 0, 0, 0.35);
		}
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
	:root { --text-faint: color-mix(in srgb, var(--text-dim) 75%, var(--bg)); --accent-2: var(--ok); }
	button { font: inherit; cursor: pointer; }
	#card { width: min(700px, calc(100vw - 48px)); max-height: calc(100vh - 48px); display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; box-shadow: var(--card-shadow); overflow: hidden; }
	#head { display: flex; align-items: center; gap: 12px; padding: 22px 28px 4px; }
	#head img { width: 38px; height: 38px; border-radius: 9px; box-shadow: 0 4px 12px -4px rgba(23, 32, 58, 0.35); }
	#head .who { flex: 1; min-width: 0; }
	#head .kicker { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--accent); }
	#head h1 { margin: 2px 0 0; font-size: 18px; letter-spacing: -0.01em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	#head .skip { border: none; background: none; padding: 0; font-size: 12.5px; font-weight: 600; color: var(--text-dim); }
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
	/* Choices are cards in two columns - click anywhere on one to select it. A
	   selected card gets a bold ring, a tinted fill, a glow and a check badge so
	   the choice is unmistakable even in a long list. */
	.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
	.opt { position: relative; display: flex; flex-direction: column; justify-content: center; min-height: 62px; padding: 13px 40px 13px 16px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); cursor: pointer; user-select: none; outline: none; transition: border-color 0.12s, background 0.12s, box-shadow 0.12s, transform 0.12s; }
	.opt:hover { border-color: var(--accent); transform: translateY(-1px); }
	.opt:active { transform: scale(0.985); }
	.opt:focus-visible { box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 35%, transparent); }
	.opt.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 15%, var(--surface)); box-shadow: 0 0 0 1.5px var(--accent), 0 10px 26px -12px color-mix(in srgb, var(--accent) 70%, transparent); }
	.opt .tick { position: absolute; top: 10px; right: 10px; width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 700; color: #fff; background: var(--accent); opacity: 0; transform: scale(0.4); transition: opacity 0.12s, transform 0.18s cubic-bezier(0.3, 1.6, 0.5, 1); }
	.opt.on .tick { opacity: 1; transform: scale(1); }
	.opt .t { font-size: 14px; font-weight: 650; line-height: 1.35; }
	.opt .d { font-size: 12.5px; color: var(--text-dim); margin-top: 3px; line-height: 1.45; }
	.opt .cat { margin-bottom: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-faint); }
	.opt.on .cat { color: var(--accent); }
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
	.problem { padding: 14px 16px; border: 1px solid var(--warn); border-radius: 10px; color: var(--text); font-size: 13.5px; line-height: 1.55; }
	.problem + .actions { margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap; }
	#nav { display: flex; align-items: center; justify-content: space-between; padding: 14px 28px; border-top: 1px solid var(--border); }
	#nav .where { font-size: 12.5px; color: var(--text-faint); }
	#nav .right { display: flex; gap: 8px; align-items: center; }
	.review h3 { margin: 16px 0 6px; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-faint); }
	.review h3:first-of-type { margin-top: 0; }
	.review p { margin: 0 0 4px; font-size: 14px; line-height: 1.55; }
	.review ul { margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.7; }
	.review .actor-line { font-weight: 650; margin-top: 4px; }
	.will { margin-top: 16px; padding: 12px 14px; border-radius: 10px; background: var(--bg); color: var(--text-dim); font-size: 13px; line-height: 1.55; }
	.will strong { color: var(--text); }
</style>
</head>
<body>
<div id="card">
	<div id="head">
		${logoDataUrl ? `<img src="${escapeHtml(logoDataUrl)}" alt="">` : ''}
		<div class="who"><div class="kicker">New project</div><h1>${escapeHtml(workspaceName)}</h1></div>
		<button class="skip" data-action="skip">Skip for now</button>
	</div>
	<div id="steps"></div>
	<div id="stage"></div>
	<div id="nav"></div>
</div>
<script>
(function () {
	'use strict';
	var PROJECT = ${JSON.stringify(workspaceName).replace(/</g, '\\u003c')};
	var STEPS = ['Overview', 'Actors', 'Use cases', 'Requirements', 'Review'];
	var PRETICKED = 3;

	// actors / nfrs stay null until the AI (or "continue without suggestions")
	// fills them; useCases is keyed by actor name. Items added by the user carry
	// mine: true so a regenerated suggestion list does not drop them.
	var state = { step: 0, ucIndex: 0, name: PROJECT, what: '', who: '', actors: null, actorsSig: null, useCases: {}, nfrs: null, loading: null, creating: null, error: null };

	function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
	function chosenActors() { return (state.actors || []).filter(function (a) { return a.on; }); }
	function ucList(actor) { return state.useCases[actor.name] || []; }
	function chosenUcs(actor) { return ucList(actor).filter(function (u) { return u.on; }); }
	function totalUcs() { return chosenActors().reduce(function (n, a) { return n + chosenUcs(a).length; }, 0); }
	function chosenNfrs() { return (state.nfrs || []).filter(function (n) { return n.on; }); }
	function has(list, name) { var k = name.toLowerCase(); return list.filter(function (x) { return x.name.toLowerCase() === k; })[0]; }

	function opt(kind, idx, on, title, desc, cat) {
		return '<div class="opt' + (on ? ' on' : '') + '" role="checkbox" aria-checked="' + (on ? 'true' : 'false') + '" tabindex="0" data-kind="' + kind + '" data-idx="' + idx + '">' +
			'<span class="tick">&#10003;</span>' + (cat ? '<div class="cat">' + esc(cat) + '</div>' : '') +
			'<div class="t">' + esc(title) + '</div>' + (desc ? '<div class="d">' + esc(desc) + '</div>' : '') + '</div>';
	}
	function grid(html) { return '<div class="grid">' + html + '</div>'; }

	function stepOverview() {
		return '<h2>Tell us about your project</h2><p class="sub">A few sentences is enough - this is what the AI uses to suggest everything that follows.</p>' +
			'<label class="field"><span class="label">Project name</span><input type="text" id="name" value="' + esc(state.name) + '"><span class="hint">Used as the title of your spec. You can change it later in chat.</span></label>' +
			'<label class="field"><span class="label">What is it?</span><textarea id="what" placeholder="A web app where housemates share chores and keep track of whose turn it is.">' + esc(state.what) + '</textarea></label>' +
			'<label class="field"><span class="label">Who will use it, and what problem does it solve?</span><textarea id="who" placeholder="Housemates who keep forgetting whose turn it is, which causes arguments.">' + esc(state.who) + '</textarea><span class="hint">Optional, but it makes the suggestions better.</span></label>';
	}
	function stepActors() {
		var actors = state.actors || [];
		return '<h2>Who will use it?</h2><p class="sub">An actor is a kind of person (or system) that interacts with your app. <span class="tag">Suggested from your description</span> - tick the ones that fit, or add your own.</p>' +
			'<div class="addrow"><input type="text" id="add-actor" placeholder="Add your own, e.g. Landlord"><button class="btn" data-action="add-actor">Add</button></div>' +
			(actors.length ? grid(actors.map(function (a, i) { return opt('actor', i, a.on, a.name, a.desc || (a.mine ? 'Added by you' : ''), ''); }).join('')) : '<div class="empty">No suggestions - add the actors yourself above.</div>');
	}
	// One actor per screen (state.ucIndex), so each actor gets its own full
	// attention instead of a long list of everyone's use cases.
	function stepUseCases() {
		var actors = chosenActors();
		if (actors.length === 0) return '<h2>What can they do?</h2><div class="empty">Choose at least one actor in the previous step.</div>';
		var actor = actors[state.ucIndex];
		var list = ucList(actor);
		return '<h2>What can ' + esc(actor.name) + ' do?<span class="count">' + chosenUcs(actor).length + ' selected</span></h2>' +
			'<p class="sub">' + (actor.desc ? esc(actor.desc) + '. ' : '') + 'A use case is one thing this actor does, named with a verb (for example "Log in"). <span class="tag">Suggested</span> - keep the ones you need and add the rest.</p>' +
			'<div class="addrow"><input type="text" data-add-uc="' + state.ucIndex + '" placeholder="Add a use case for ' + esc(actor.name) + '"><button class="btn" data-action="add-uc" data-idx="' + state.ucIndex + '">Add</button></div>' +
			(list.length ? grid(list.map(function (u, i) { return opt('uc', state.ucIndex + ':' + i, u.on, u.name, '', ''); }).join('')) : '<div class="empty">No suggestions - add this actor\\'s use cases yourself above.</div>');
	}
	function stepNfrs() {
		var nfrs = state.nfrs || [];
		return '<h2>What qualities matter?</h2><p class="sub">Non-functional requirements describe how well the system must work, not what it does. <span class="tag">Suggested</span> - grouped the way FURPS+ organises them.</p>' +
			'<div class="addrow"><input type="text" id="add-nfr" placeholder="Add your own, e.g. Works offline"><button class="btn" data-action="add-nfr">Add</button></div>' +
			(nfrs.length ? grid(nfrs.map(function (n, i) { return opt('nfr', i, n.on, n.name, n.desc, n.cat); }).join('')) : '<div class="empty">No suggestions - add requirements yourself above, or skip this step.</div>');
	}
	function stepReview() {
		var actors = chosenActors();
		var html = '<div class="review"><h2>Review</h2><p class="sub">This is what the first draft of your spec will be built from.</p>';
		html += '<h3>Overview</h3><p>' + esc(state.what) + '</p>' + (state.who ? '<p>' + esc(state.who) + '</p>' : '');
		html += '<h3>Actors and use cases</h3>';
		actors.forEach(function (a) {
			var ucs = chosenUcs(a);
			html += '<p class="actor-line">' + esc(a.name) + '</p><ul>' + (ucs.length ? ucs.map(function (u) { return '<li>' + esc(u.name) + '</li>'; }).join('') : '<li><em>no use cases chosen</em></li>') + '</ul>';
		});
		var nfrs = chosenNfrs();
		html += '<h3>Requirements</h3><ul>' + (nfrs.length ? nfrs.map(function (n) { return '<li><strong>' + esc(n.name) + '</strong> - ' + esc(n.desc) + '</li>'; }).join('') : '<li><em>none chosen</em></li>') + '</ul>';
		if (totalUcs() === 0) html += '<div class="will"><strong>Choose at least one use case</strong> before creating the spec - go back to the Use cases step.</div>';
		else html += '<div class="will">When you create the spec, kratai also drafts a <strong>data model</strong> from these use cases and writes the full document. Then the chat opens: <em>"Here is the initial design - tell me what to change."</em></div>';
		return html + '</div>';
	}
	var RENDER = [stepOverview, stepActors, stepUseCases, stepNfrs, stepReview];

	// --- Talking to the view server ---
	function api(path, body) {
		return fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(
			function (r) { return r.json().catch(function () { return { ok: false, error: 'Unexpected response from kratai.' }; }); },
			function () { throw new Error('Could not reach kratai. Check your connection and try again.'); }
		).then(function (j) { if (!j.ok) throw new Error(j.error || 'Something went wrong.'); return j; });
	}
	function missingUseCaseActors() { return chosenActors().filter(function (a) { return !state.useCases[a.name]; }); }
	function actorPayload(list) { return list.map(function (a) { return { name: a.name, description: a.desc, kind: a.kind }; }); }
	function payload(step) {
		var body = { name: state.name.trim(), what: state.what.trim(), who: state.who.trim() };
		if (step === 'use-cases') body.actors = actorPayload(missingUseCaseActors());
		else if (step !== 'actors') {
			body.actors = actorPayload(chosenActors());
			body.useCases = {};
			chosenActors().forEach(function (a) { body.useCases[a.name] = chosenUcs(a).map(function (u) { return u.name; }); });
			if (step === 'create') body.requirements = chosenNfrs().map(function (n) { return { name: n.name, description: n.mine ? n.name : n.desc, category: n.mine ? 'Constraints' : n.cat }; });
		}
		return body;
	}
	function actorsSig() { return state.name.trim() + '|' + state.what.trim() + '|' + state.who.trim(); }

	// What each step shows while the AI works on it.
	var LOADING = {
		'actors': function () { return { title: 'Thinking about who will use ' + (state.name.trim() || PROJECT), sub: 'Reading your description to suggest the people and systems involved.' }; },
		'use-cases': function () { return { title: 'Drafting use cases', sub: 'Working out what ' + missingUseCaseActors().map(function (a) { return a.name; }).join(', ') + ' will each need to do.' }; },
		'requirements': function () { return { title: 'Choosing requirements that fit', sub: 'Matching quality needs to the use cases you picked.' }; }
	};
	function apply(step, data) {
		var list = Array.isArray(data) ? data : [];
		if (step === 'actors') {
			var mine = (state.actors || []).filter(function (a) { return a.mine; });
			state.actors = list.map(function (a, i) { return { name: a.name, desc: a.description || '', kind: a.kind === 'system' ? 'system' : 'person', on: i < PRETICKED }; });
			mine.forEach(function (a) { if (!has(state.actors, a.name)) state.actors.push(a); });
			state.actorsSig = actorsSig();
		} else if (step === 'use-cases') {
			var byActor = data && typeof data === 'object' ? data : {};
			missingUseCaseActors().forEach(function (a) {
				state.useCases[a.name] = (Array.isArray(byActor[a.name]) ? byActor[a.name] : []).map(function (n, i) { return { name: n, on: i < PRETICKED }; });
			});
		} else if (step === 'requirements') {
			state.nfrs = list.map(function (r) { return { name: r.name, desc: r.description, cat: r.category, on: !!r.recommended }; });
		}
	}
	function applyNothing(step) {
		if (step === 'actors') { state.actors = state.actors || []; state.actorsSig = actorsSig(); }
		else if (step === 'use-cases') missingUseCaseActors().forEach(function (a) { state.useCases[a.name] = []; });
		else if (step === 'requirements') state.nfrs = state.nfrs || [];
	}
	function fail(err, retry, skip) {
		state.loading = null; state.creating = null;
		state.error = { message: err && err.message ? err.message : 'Something went wrong.', retry: retry, skip: skip };
		render(true);
	}
	function generate(step) {
		state.error = null;
		state.loading = LOADING[step]();
		render(true);
		api('/api/new-project/ai', { step: step, input: payload(step) }).then(function (res) {
			apply(step, res.data);
			state.loading = null;
			render(true);
		}).catch(function (err) {
			fail(err, function () { generate(step); }, function () { applyNothing(step); state.error = null; render(true); });
		});
	}
	// Called after state.step has moved: asks the AI only for what is not already
	// there, so going back and forth does not throw away ticks or edits.
	function enter() {
		state.error = null;
		if (state.step === 1 && state.actorsSig !== actorsSig()) return generate('actors');
		if (state.step === 2 && chosenActors().length > 0 && missingUseCaseActors().length > 0) return generate('use-cases');
		if (state.step === 3 && !state.nfrs) return generate('requirements');
		render(true);
	}

	var CREATE_STEPS = ['Writing the overview', 'Drafting the use case model', 'Drafting the data model', 'Putting the spec together'];
	function create() {
		state.error = null;
		state.creating = { done: 0 };
		render(false);
		// The checklist is pacing, not progress: it ticks on a timer but the last
		// item only completes when the server has actually written the spec.
		var timer = setInterval(function () {
			if (state.creating && state.creating.done < CREATE_STEPS.length - 1) { state.creating.done++; render(false); }
		}, 3500);
		api('/api/new-project/create', payload('create')).then(function () {
			clearInterval(timer);
			state.creating = { done: CREATE_STEPS.length };
			render(false);
			setTimeout(function () { location.href = '/'; }, 700);
		}).catch(function (err) {
			clearInterval(timer);
			fail(err, create, null);
		});
	}
	function loadingView() {
		if (state.creating) {
			return '<div class="loading"><h2><span class="spin"></span>Building your spec</h2><p class="sub">Writing your first draft - this takes a little while.</p><ul class="checks">' +
				CREATE_STEPS.map(function (t, i) {
					var cls = i < state.creating.done ? 'done' : (i === state.creating.done ? 'active' : '');
					return '<li class="' + cls + '"><span class="mark">' + (i < state.creating.done ? '&#10003;' : '') + '</span>' + t + '</li>';
				}).join('') + '</ul></div>';
		}
		return '<div class="loading"><h2><span class="spin"></span>' + esc(state.loading.title) + '</h2><p class="sub">' + esc(state.loading.sub) + '</p><div class="skel"><div class="sk"></div><div class="sk"></div><div class="sk"></div><div class="sk"></div></div></div>';
	}
	function errorView() {
		return '<h2>That did not work</h2><div class="problem">' + esc(state.error.message) + '</div><div class="actions">' +
			'<button class="btn primary" data-action="retry">Try again</button>' +
			(state.error.skip ? '<button class="btn" data-action="skip-suggestions">Continue without suggestions</button>' : '') + '</div>';
	}

	// The use cases step covers one actor per screen, so Continue/Back move
	// through the actors before they move between steps.
	function goNext() {
		if (state.step === 1) state.ucIndex = 0;
		if (state.step === 2 && state.ucIndex < chosenActors().length - 1) { state.ucIndex++; return false; }
		state.step++;
		return true;
	}
	function goBack() {
		state.error = null;
		if (state.step === 2 && state.ucIndex > 0) state.ucIndex--;
		else {
			state.step--;
			if (state.step === 2) state.ucIndex = Math.max(0, chosenActors().length - 1);
		}
	}
	function canContinue() {
		if (state.step === 0) return state.what.trim().length > 0;
		if (state.step === 1) return chosenActors().length > 0;
		if (state.step === 2) return state.ucIndex < chosenActors().length - 1 || totalUcs() > 0;
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
		stage.innerHTML = busy ? loadingView() : (state.error ? errorView() : RENDER[state.step]());
		stage.scrollTop = toTop ? 0 : scroll;
		var last = state.step === STEPS.length - 1;
		var actors = chosenActors();
		var perActor = state.step === 2 && actors.length > 0;
		var nextLabel = perActor && state.ucIndex < actors.length - 1 ? 'Next: ' + esc(actors[state.ucIndex + 1].name) : 'Continue';
		var primary = state.error ? '' : (last
			? '<button class="btn primary" data-action="create"' + (busy || totalUcs() === 0 ? ' disabled' : '') + '>Create my spec</button>'
			: '<button class="btn primary" data-action="next"' + (canContinue() && !busy ? '' : ' disabled') + '>' + nextLabel + '</button>');
		var where = 'Step ' + (state.step + 1) + ' of ' + STEPS.length + (perActor ? ' - ' + esc(actors[state.ucIndex].name) + ' (' + (state.ucIndex + 1) + ' of ' + actors.length + ')' : '');
		document.getElementById('nav').innerHTML = '<span class="where">' + where + '</span><div class="right">' +
			(state.step > 0 ? '<button class="btn" data-action="back"' + (busy ? ' disabled' : '') + '>Back</button>' : '') + primary + '</div>';
	}

	function addTo(list, item) {
		var existing = has(list, item.name);
		if (existing) existing.on = true; else list.push(item);
	}
	var card = document.getElementById('card');
	card.addEventListener('click', function (e) {
		var t = e.target.closest ? e.target.closest('[data-action]') : null;
		if (!t) return;
		var a = t.getAttribute('data-action');
		var stage = document.getElementById('stage');
		if (a === 'next') { if (goNext()) enter(); else render(true); }
		else if (a === 'back') { goBack(); render(true); }
		else if (a === 'create') create();
		else if (a === 'retry') state.error.retry();
		else if (a === 'skip-suggestions') state.error.skip();
		else if (a === 'skip') { api('/api/new-project/skip', {}).then(function () { location.href = '/'; }, function () { location.href = '/'; }); }
		else if (a === 'add-actor') {
			var v = document.getElementById('add-actor').value.trim();
			if (v) { state.actors = state.actors || []; addTo(state.actors, { name: v, desc: '', kind: 'person', on: true, mine: true }); render(false); }
		} else if (a === 'add-nfr') {
			var w = document.getElementById('add-nfr').value.trim();
			if (w) { state.nfrs = state.nfrs || []; addTo(state.nfrs, { name: w, desc: 'Added by you', cat: 'Yours', on: true, mine: true }); render(false); }
		} else if (a === 'add-uc') {
			var idx = +t.getAttribute('data-idx'), name = stage.querySelector('[data-add-uc="' + idx + '"]').value.trim();
			var actor = chosenActors()[idx];
			if (name && actor) { state.useCases[actor.name] = state.useCases[actor.name] || []; addTo(state.useCases[actor.name], { name: name, on: true }); render(false); }
		}
	});
	// Flips a card's selection in place (no re-render, so the pop animation plays
	// and focus stays put), then refreshes whatever depends on the choice.
	function toggleOpt(el) {
		var kind = el.getAttribute('data-kind'), idx = el.getAttribute('data-idx');
		var item;
		if (kind === 'actor') item = state.actors[+idx];
		else if (kind === 'nfr') item = state.nfrs[+idx];
		else { var p = idx.split(':'); item = ucList(chosenActors()[+p[0]])[+p[1]]; }
		item.on = !item.on;
		el.classList.toggle('on', item.on);
		el.setAttribute('aria-checked', item.on ? 'true' : 'false');
		if (kind === 'uc') {
			var c = document.querySelector('#stage h2 .count');
			if (c) c.textContent = chosenUcs(chosenActors()[+idx.split(':')[0]]).length + ' selected';
		}
		var next = document.querySelector('[data-action="next"]');
		if (next) next.disabled = !canContinue();
	}
	card.addEventListener('click', function (e) {
		var o = e.target.closest ? e.target.closest('.opt') : null;
		if (o) toggleOpt(o);
	});
	card.addEventListener('keydown', function (e) {
		if ((e.key === ' ' || e.key === 'Enter') && e.target.classList && e.target.classList.contains('opt')) { e.preventDefault(); toggleOpt(e.target); }
	});
	card.addEventListener('input', function (e) {
		if (e.target.id === 'name') state.name = e.target.value;
		else if (e.target.id === 'what') { state.what = e.target.value; var b = document.querySelector('[data-action="next"]'); if (b) b.disabled = !canContinue(); }
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
