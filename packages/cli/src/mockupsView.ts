import type { MockupTheme } from '@kratai-desci/llm';

function escapeXml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export interface MockupsViewData {
	systemName: string;
	/** Why nothing can be generated right now, or '' when it can ('signin' | 'no-spec' | 'no-ai' | ''). */
	blocked: '' | 'signin' | 'no-spec' | 'no-ai';
	useCases: { id: string; number: number; name: string; actors: string[]; detailed: boolean }[];
	mockups: { id: string; title: string; description: string; useCaseIds: string[]; createdAt: string }[];
	theme: MockupTheme;
}

/**
 * The Mockups view: draft screens of the product, kept as their own artifact beside the use cases and the data
 * model. Each mockup is a card with a live (inert) preview, the use cases it serves, and Open / Delete. "Add
 * mockup" asks the AI for one more screen from the chosen use cases and an optional instruction. The look of
 * every mockup (colour, light or dark, app name) is one setting here: changing it restyles them all without
 * any AI call. The pages themselves are drawn by the built-in kit in @kratai-desci/llm.
 */
export function generateMockupsHTML(data: MockupsViewData): string {
	const json = JSON.stringify(data).replace(/</g, '\\u003c');
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeXml(data.systemName)} - mockups</title>
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
		--border: #DCE3F2; --accent: #3459E0; --danger: #D6455B;
	}
	@media (prefers-color-scheme: dark) {
		:root:not([data-theme="light"]) {
			--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38;
			--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
			--border: #262E4E; --accent: #6D93F5; --danger: #F0687D;
		}
	}
	:root[data-theme="dark"] {
		--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38;
		--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
		--border: #262E4E; --accent: #6D93F5; --danger: #F0687D;
	}
	* { box-sizing: border-box; }
	html, body { margin: 0; padding: 0; height: 100%; }
	body { background: var(--bg); color: var(--text); overflow-y: auto; font-family: ui-sans-serif, -apple-system, 'Segoe UI', system-ui, sans-serif; }
	button, input, select, textarea { font: inherit; color: inherit; }
	#page { max-width: 1100px; margin: 0 auto; padding: 48px 24px 60px; }
	#header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
	#header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
	#header .sub { font-size: 12.5px; color: var(--text-dim); }
	.btn { border: 1px solid var(--border); background: var(--surface-2); color: var(--text-dim); font-size: 12.5px; font-weight: 650; padding: 7px 14px; border-radius: 8px; cursor: pointer; }
	.btn:hover { border-color: var(--accent); color: var(--accent); }
	.btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
	.btn.primary:hover { opacity: .9; color: #fff; }
	.btn.danger { background: var(--danger); border-color: var(--danger); color: #fff; }
	.btn[disabled] { opacity: .55; cursor: not-allowed; }
	#header .spacer { flex: 1; }
	#look { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 4px 0 22px; font-size: 12.5px; color: var(--text-dim); }
	#look input[type=color] { width: 30px; height: 26px; padding: 0; border: 1px solid var(--border); border-radius: 6px; background: none; cursor: pointer; }
	#look input[type=text], #look select { border: 1px solid var(--border); background: var(--surface); border-radius: 6px; padding: 4px 8px; font-size: 12.5px; }
	#notice { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 28px; text-align: center; color: var(--text-dim); font-size: 13.5px; line-height: 1.6; }
	#notice h2 { margin: 0 0 8px; font-size: 16px; color: var(--text); }
	#grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; }
	.card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
	.preview { position: relative; height: 188px; overflow: hidden; background: var(--surface-2); border-bottom: 1px solid var(--border); cursor: pointer; }
	.preview iframe { position: absolute; top: 0; left: 0; width: 1280px; height: 800px; border: 0; transform-origin: 0 0; pointer-events: none; }
	.card-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
	.card-title { margin: 0; font-size: 14.5px; font-weight: 650; }
	.card-desc { margin: 0; font-size: 12.5px; color: var(--text-dim); line-height: 1.5; }
	.chips { display: flex; flex-wrap: wrap; gap: 5px; }
	.chip { font-size: 11px; font-weight: 650; padding: 2px 8px; border-radius: 99px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text-dim); }
	.card-actions { display: flex; gap: 8px; margin-top: auto; padding-top: 4px; }
	.overlay { position: fixed; inset: 0; z-index: 100; display: none; align-items: center; justify-content: center; padding: 24px; background: rgba(10,14,25,0.55); }
	.overlay.open { display: flex; }
	.dialog { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; width: 100%; max-width: 520px; max-height: 88vh; overflow-y: auto; padding: 22px 24px; box-shadow: 0 20px 60px rgba(0,0,0,.35); }
	.dialog h2 { margin: 0 0 6px; font-size: 16px; }
	.dialog p { margin: 0 0 12px; font-size: 12.5px; color: var(--text-dim); line-height: 1.55; }
	.uc-list { border: 1px solid var(--border); border-radius: 8px; max-height: 240px; overflow-y: auto; margin-bottom: 12px; }
	.uc-list label { display: flex; gap: 10px; align-items: flex-start; padding: 8px 12px; border-bottom: 1px solid var(--border); font-size: 13px; cursor: pointer; }
	.uc-list label:last-child { border-bottom: 0; }
	.uc-list .num { color: var(--text-faint); font-size: 11.5px; min-width: 34px; padding-top: 1px; }
	.uc-list .brief { color: var(--text-faint); font-size: 11px; }
	textarea { width: 100%; min-height: 70px; border: 1px solid var(--border); background: var(--surface); border-radius: 8px; padding: 8px 10px; font-size: 13px; resize: vertical; }
	.dialog .row { display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px; }
	#error { color: var(--danger); font-size: 12.5px; margin-top: 10px; display: none; }
	#viewer { padding: 0; background: rgba(10,14,25,0.7); }
	#viewer .bar { position: absolute; top: 0; left: 0; right: 0; height: 46px; display: flex; align-items: center; gap: 12px; padding: 0 16px; background: var(--surface); border-bottom: 1px solid var(--border); }
	#viewer .bar b { font-size: 13.5px; }
	#viewer .bar .spacer { flex: 1; }
	#viewer iframe { position: absolute; top: 46px; left: 0; width: 100%; height: calc(100% - 46px); border: 0; background: #fff; }
</style>
</head>
<body>
	<div id="page">
		<div id="header">
			<h1>Mockups</h1>
			<span class="sub" id="count"></span>
			<span class="spacer"></span>
			<button class="btn primary" id="add-btn" type="button">Add mockup</button>
		</div>
		<div id="look">
			<span>Look of all mockups:</span>
			<input type="text" id="look-name" maxlength="60" title="App name shown in the top bar">
			<input type="color" id="look-color" title="Main colour">
			<select id="look-mode"><option value="light">Light</option><option value="dark">Dark</option></select>
			<span id="look-status"></span>
		</div>
		<div id="notice" style="display:none"></div>
		<div id="grid"></div>
	</div>

	<div class="overlay" id="add-overlay">
		<div class="dialog" role="dialog" aria-modal="true">
			<h2>Add a mockup</h2>
			<p>Choose the use cases this screen serves, and say what it should show if you like. The AI designs one screen in the project's look. It uses AI credit and takes about 20 to 30 seconds.</p>
			<div class="uc-list" id="uc-list"></div>
			<textarea id="instruction" placeholder="Optional: what should this screen show? For example: the checkout page, or the manager's approval queue"></textarea>
			<div id="error"></div>
			<div class="row">
				<button class="btn" id="add-cancel" type="button">Cancel</button>
				<button class="btn primary" id="add-go" type="button">Generate</button>
			</div>
		</div>
	</div>

	<div class="overlay" id="delete-overlay">
		<div class="dialog" role="dialog" aria-modal="true">
			<h2 id="delete-title"></h2>
			<p>Its page and picture are removed from the project. This can't be undone, though a project kept in git can restore the files.</p>
			<div class="row">
				<button class="btn" id="delete-cancel" type="button">Cancel</button>
				<button class="btn danger" id="delete-go" type="button">Delete</button>
			</div>
		</div>
	</div>

	<div class="overlay" id="viewer">
		<div class="bar"><b id="viewer-title"></b><span class="spacer"></span><span class="chip">Draft mockup</span><button class="btn" id="viewer-close" type="button">Close</button></div>
		<iframe id="viewer-frame" sandbox="" title="Mockup"></iframe>
	</div>

<script>
(function () {
	'use strict';
	var DATA = ${json};
	var $ = function (id) { return document.getElementById(id); };
	var ucById = {};
	DATA.useCases.forEach(function (u) { ucById[u.id] = u; });

	function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
	function post(path, body) {
		return fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) })
			.then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || 'Something went wrong.'); return j; }); });
	}

	// ---- header + notice ----
	$('count').textContent = DATA.mockups.length + (DATA.mockups.length === 1 ? ' mockup' : ' mockups') + ' \\u2022 ' + DATA.useCases.length + ' use cases';
	var NOTICES = {
		'signin': { t: 'Sign in to design mockups', b: 'Mockups are drawn by AI, which needs your kratai account.', btn: 'Sign in' },
		'no-spec': { t: 'Create the use cases first', b: 'A mockup is designed from the use cases and the data model. Generate the Spec (or describe the project in chat) first.' },
		'no-ai': { t: 'Mockups need the kratai desktop app', b: 'Generating mockups is only available in the desktop app.' }
	};
	if (DATA.blocked) {
		var n = NOTICES[DATA.blocked];
		$('notice').style.display = 'block';
		$('notice').innerHTML = '<h2>' + n.t + '</h2><div>' + n.b + '</div>' + (n.btn ? '<p><button class="btn primary" id="notice-btn" type="button">' + n.btn + '</button></p>' : '');
		if (n.btn) $('notice-btn').addEventListener('click', function () { window.parent.postMessage({ command: 'startSignIn' }, '*'); });
		$('add-btn').disabled = true;
		$('look').style.display = 'none';
	} else if (DATA.mockups.length === 0) {
		$('notice').style.display = 'block';
		$('notice').innerHTML = '<h2>No mockups yet</h2><div>A mockup is a draft screen of the product, designed from your use cases and data model, so a client can react to something they can see. Add one to start; every mockup shares one look and the same example data.</div>';
	}

	// ---- cards ----
	function preview(m) {
		var scale = 0.24;
		return '<div class="preview" data-open="' + m.id + '"><iframe src="/mockups/' + m.id + '.html" sandbox="" loading="lazy" tabindex="-1" style="transform:scale(' + scale + ')" title="' + esc(m.title) + '"></iframe></div>';
	}
	function sizePreviews() {
		document.querySelectorAll('.preview').forEach(function (p) { p.querySelector('iframe').style.transform = 'scale(' + (p.clientWidth / 1280) + ')'; });
	}
	$('grid').innerHTML = DATA.mockups.map(function (m) {
		var chips = m.useCaseIds.map(function (id) { var u = ucById[id]; return u ? '<span class="chip" title="' + esc(u.name) + '">UC-' + u.number + ' ' + esc(u.name) + '</span>' : ''; }).join('');
		return '<div class="card">' + preview(m) +
			'<div class="card-body"><h3 class="card-title">' + esc(m.title) + '</h3>' +
			(m.description ? '<p class="card-desc">' + esc(m.description) + '</p>' : '') +
			(chips ? '<div class="chips">' + chips + '</div>' : '') +
			'<div class="card-actions"><button class="btn" data-open="' + m.id + '" type="button">Open</button><button class="btn" data-delete="' + m.id + '" type="button">Delete</button></div></div></div>';
	}).join('');
	sizePreviews();
	window.addEventListener('resize', sizePreviews);

	// ---- viewer ----
	function openViewer(id) {
		var m = DATA.mockups.filter(function (x) { return x.id === id; })[0];
		if (!m) return;
		$('viewer-title').textContent = m.title;
		$('viewer-frame').src = '/mockups/' + id + '.html';
		$('viewer').classList.add('open');
	}
	function closeViewer() { $('viewer').classList.remove('open'); $('viewer-frame').src = 'about:blank'; }
	$('viewer-close').addEventListener('click', closeViewer);

	// ---- delete (with confirmation) ----
	var deleting = null;
	function openDelete(id) {
		var m = DATA.mockups.filter(function (x) { return x.id === id; })[0];
		if (!m) return;
		deleting = id;
		$('delete-title').textContent = 'Delete "' + m.title + '"?';
		$('delete-overlay').classList.add('open');
	}
	$('delete-cancel').addEventListener('click', function () { $('delete-overlay').classList.remove('open'); deleting = null; });
	$('delete-go').addEventListener('click', function () {
		if (!deleting) return;
		$('delete-go').disabled = true;
		post('/api/mockups/delete', { id: deleting }).then(function () { location.reload(); }).catch(function (e) { $('delete-go').disabled = false; alert(e.message); });
	});

	document.addEventListener('click', function (e) {
		var open = e.target.closest('[data-open]'); if (open) { openViewer(open.getAttribute('data-open')); return; }
		var del = e.target.closest('[data-delete]'); if (del) openDelete(del.getAttribute('data-delete'));
	});

	// ---- add ----
	function buildUcList(preselect) {
		$('uc-list').innerHTML = DATA.useCases.map(function (u) {
			return '<label><input type="checkbox" value="' + u.id + '"' + (preselect.indexOf(u.id) !== -1 ? ' checked' : '') + '><span class="num">UC-' + u.number + '</span><span>' + esc(u.name) + (u.actors.length ? ' <span class="brief">(' + esc(u.actors.join(', ')) + ')</span>' : '') + (u.detailed ? '' : ' <span class="brief">- brief, no flow yet</span>') + '</span></label>';
		}).join('');
	}
	function openAdd(preselect) {
		buildUcList(preselect || []);
		$('instruction').value = '';
		$('error').style.display = 'none';
		$('add-go').disabled = false; $('add-go').textContent = 'Generate';
		$('add-overlay').classList.add('open');
	}
	$('add-btn').addEventListener('click', function () { openAdd([]); });
	$('add-cancel').addEventListener('click', function () { $('add-overlay').classList.remove('open'); });
	$('add-go').addEventListener('click', function () {
		var ids = Array.prototype.slice.call($('uc-list').querySelectorAll('input:checked')).map(function (i) { return i.value; });
		var instruction = $('instruction').value.trim();
		if (!ids.length && !instruction) { $('error').textContent = 'Choose at least one use case, or describe the screen.'; $('error').style.display = 'block'; return; }
		$('error').style.display = 'none';
		$('add-go').disabled = true; $('add-cancel').disabled = true; $('add-go').textContent = 'Designing\\u2026 (20-30 s)';
		post('/api/mockups/generate', { useCaseIds: ids, instruction: instruction }).then(function () {
			window.parent.postMessage({ command: 'balanceChanged' }, '*');
			location.reload();
		}).catch(function (e) {
			$('add-go').disabled = false; $('add-cancel').disabled = false; $('add-go').textContent = 'Generate';
			$('error').textContent = e.message; $('error').style.display = 'block';
		});
	});

	// ---- the look of every mockup ----
	$('look-name').value = DATA.theme.appName; $('look-color').value = DATA.theme.primary; $('look-mode').value = DATA.theme.mode;
	var lookTimer = null;
	function saveLook() {
		clearTimeout(lookTimer);
		lookTimer = setTimeout(function () {
			$('look-status').textContent = 'Updating all mockups\\u2026';
			post('/api/mockups/theme', { appName: $('look-name').value.trim(), primary: $('look-color').value, mode: $('look-mode').value })
				.then(function () { location.reload(); })
				.catch(function (e) { $('look-status').textContent = e.message; });
		}, 500);
	}
	$('look-name').addEventListener('change', saveLook);
	$('look-color').addEventListener('change', saveLook);
	$('look-mode').addEventListener('change', saveLook);

	// ---- deep link from a use case: /mockups?uc=<id> opens "Add" with that use case ticked ----
	var uc = new URLSearchParams(location.search).get('uc');
	if (uc && !DATA.blocked && ucById[uc]) openAdd([uc]);
	var openId = new URLSearchParams(location.search).get('open');
	if (openId) openViewer(openId);
	document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeViewer(); $('add-overlay').classList.remove('open'); $('delete-overlay').classList.remove('open'); } });
})();
</script>
</body>
</html>`;
}
