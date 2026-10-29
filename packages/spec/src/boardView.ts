import type { Task, BoardMember, LinkOption } from './tasks.js';

function escapeXml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export interface BoardViewData {
	tasks: Task[];
	members: BoardMember[];
	links: LinkOption[];
	/** The person looking, for "My tasks". */
	me: string;
	/** A viewer: the board is shown but nothing on it can change. */
	readOnly: boolean;
}

/**
 * The web app's task board: To do / Doing / Done, cards that can be dragged between and within them,
 * and a side panel for one card (its details, and the brief for a coding agent the AI writes from it).
 * Every change goes to api/tasks, which answers with the whole board again.
 */
export function generateBoardHTML(workspaceName: string, data: BoardViewData): string {
	// JSON inside a <script>: "<" is escaped so a title can never close the tag.
	const json = JSON.stringify(data).replace(/</g, '\\u003c');
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeXml(workspaceName)} - board</title>
<script>
	try {
		var krataiTheme = localStorage.getItem('kratai-theme');
		if (krataiTheme) document.documentElement.setAttribute('data-theme', krataiTheme);
	} catch (e) {}
</script>
<style>
	:root {
		--bg: #EEF2FA; --surface: #FFFFFF; --surface-2: #F4F7FD; --column: #E4E9F5;
		--text: #17203A; --text-dim: #5C6785; --text-faint: #94A0BE;
		--border: #DCE3F2; --accent: #3459E0; --accent-2: #0E7A87;
		--ok: #1FA37C; --danger: #D6455B;
	}
	@media (prefers-color-scheme: dark) {
		:root:not([data-theme="light"]) {
			--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38; --column: #10162A;
			--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
			--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
			--ok: #3FCB9F; --danger: #F0687D;
		}
	}
	:root[data-theme="dark"] {
		--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38; --column: #10162A;
		--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
		--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
		--ok: #3FCB9F; --danger: #F0687D;
	}
	* { box-sizing: border-box; }
	html, body { margin: 0; height: 100%; }
	body { background: var(--bg); color: var(--text); font-family: ui-sans-serif, -apple-system, 'Segoe UI', system-ui, sans-serif; overflow: hidden; }
	button, select, input, textarea { font: inherit; color: inherit; }
	#page { height: 100%; display: flex; flex-direction: column; padding: 22px 24px; gap: 16px; }
	#head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
	h1 { margin: 0; font-size: 22px; font-weight: 750; }
	.sub { margin: 2px 0 0; font-size: 13px; color: var(--text-dim); }
	#tools { display: flex; align-items: center; gap: 8px; }
	select, input[type=text], textarea {
		border: 1px solid var(--border); border-radius: 8px; background: var(--surface); padding: 7px 10px; font-size: 13.5px;
	}
	.btn { min-height: 36px; padding: 0 14px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); font-size: 13px; font-weight: 600; cursor: pointer; }
	.btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
	.btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
	.btn.primary:hover:not(:disabled) { color: #fff; opacity: 0.92; }
	.btn:disabled { opacity: 0.5; cursor: default; }
	#columns { flex: 1; min-height: 0; display: flex; gap: 12px; overflow-x: auto; }
	.col { flex: 1 1 0; min-width: 240px; background: var(--column); border-radius: 12px; padding: 10px; display: flex; flex-direction: column; gap: 8px; min-height: 0; }
	.col.drop { outline: 2px dashed var(--accent); outline-offset: -2px; }
	.col-head { display: flex; justify-content: space-between; align-items: center; padding: 2px 6px 4px; font-size: 13px; font-weight: 700; }
	.col-count { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 12px; color: var(--text-dim); }
	.cards { flex: 1; min-height: 40px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
	.card {
		background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 11px 12px;
		display: flex; flex-direction: column; gap: 9px; cursor: pointer; text-align: left; width: 100%;
		box-shadow: 0 1px 2px rgba(10, 14, 25, 0.05);
	}
	.card:hover, .card:focus-visible { border-color: var(--accent); outline: none; }
	.card.dragging { opacity: 0.4; }
	.card.drop-before { box-shadow: 0 -3px 0 var(--accent); }
	.card.ai { border-color: color-mix(in srgb, var(--accent-2) 45%, var(--border)); }
	.card-title { font-size: 14px; font-weight: 600; line-height: 1.4; overflow-wrap: anywhere; }
	.col[data-status=done] .card-title { color: var(--text-dim); }
	.card-meta { display: flex; align-items: center; gap: 8px; min-height: 22px; }
	.chip { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 11.5px; font-weight: 650; color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--surface)); border-radius: 6px; padding: 2px 7px; }
	.chip.nfr { color: var(--accent-2); background: color-mix(in srgb, var(--accent-2) 12%, var(--surface)); }
	.ai-mark { font-size: 11.5px; font-weight: 600; color: var(--accent-2); }
	.has-prompt { font-size: 11.5px; color: var(--text-dim); }
	.avatar { margin-left: auto; width: 24px; height: 24px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
	.add-row { display: flex; }
	.add-btn { flex: 1; text-align: left; min-height: 34px; padding: 0 8px; border: none; border-radius: 8px; background: none; color: var(--text-dim); font-size: 13px; font-weight: 600; cursor: pointer; }
	.add-btn:hover { background: color-mix(in srgb, var(--text) 6%, transparent); color: var(--text); }
	.add-input { width: 100%; }
	.empty { font-size: 13px; color: var(--text-dim); padding: 6px; }

	#scrim { position: fixed; inset: 0; background: rgba(10, 14, 25, 0.3); display: none; }
	#panel {
		position: fixed; top: 0; right: 0; bottom: 0; width: min(600px, 100%); background: var(--surface);
		box-shadow: -12px 0 40px rgba(10, 14, 25, 0.2); display: none; flex-direction: column;
	}
	body.panel-open #scrim { display: block; }
	body.panel-open #panel { display: flex; }
	#panel-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px 10px 22px; border-bottom: 1px solid var(--border); font-size: 12.5px; color: var(--text-dim); }
	#panel-body { flex: 1; overflow-y: auto; padding: 18px 22px 28px; display: flex; flex-direction: column; gap: 16px; }
	#f-title { font-size: 19px; font-weight: 700; border-color: transparent; padding: 6px 8px; margin: -6px -8px 0; background: none; }
	#f-title:hover:not(:disabled), #f-title:focus { border-color: var(--border); background: var(--surface); }
	.fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
	@media (max-width: 560px) { .fields { grid-template-columns: 1fr; } }
	.field label { display: block; font-size: 12px; font-weight: 700; color: var(--text-dim); margin-bottom: 5px; }
	.field select { width: 100%; }
	#f-notes { width: 100%; resize: vertical; min-height: 90px; line-height: 1.55; }
	.origin { margin: -8px 0 0; font-size: 12px; color: var(--text-dim); }
	.icon-btn { width: 36px; height: 36px; border: none; border-radius: 8px; background: none; color: var(--text-dim); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
	.icon-btn:hover { background: var(--surface-2); color: var(--text); }
	#prompt-box { border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
	#prompt-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 14px; background: var(--surface-2); border-bottom: 1px solid var(--border); }
	#prompt-head h2 { margin: 0; font-size: 14px; }
	#prompt-when { margin: 2px 0 0; font-size: 12px; color: var(--text-dim); }
	#prompt-text { margin: 0; padding: 14px 16px; font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 12.5px; line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; max-height: 420px; overflow-y: auto; }
	#prompt-empty { padding: 14px 16px; font-size: 13px; color: var(--text-dim); }
	#toast { position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%); background: var(--text); color: var(--bg); padding: 8px 14px; border-radius: 8px; font-size: 13px; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
	#toast.show { opacity: 1; }
</style>
</head>
<body>
<div id="page">
	<div id="head">
		<div>
			<h1>Board</h1>
			<p class="sub">Tasks for building ${escapeXml(workspaceName)}. Link each to the use case or requirement it delivers; its Progress follows.</p>
		</div>
		<div id="tools">
			<label for="filter" class="sub" style="margin:0">Show</label>
			<select id="filter"><option value="all">Everyone's tasks</option><option value="mine">My tasks</option><option value="nobody">Not assigned</option></select>
			<button type="button" class="btn primary" id="new-task">New task</button>
		</div>
	</div>
	<div id="columns"></div>
</div>
<div id="scrim"></div>
<section id="panel" role="dialog" aria-modal="true" aria-labelledby="f-title">
	<div id="panel-head">
		<span id="panel-where"></span>
		<span>
			<button type="button" class="btn" id="f-delete" style="border:none;color:var(--text-dim)">Delete</button>
			<button type="button" class="icon-btn" id="panel-close" aria-label="Close"><svg width="13" height="13" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
		</span>
	</div>
	<div id="panel-body">
		<input type="text" id="f-title" aria-label="Title" maxlength="200">
		<div class="fields">
			<div class="field"><label for="f-status">Status</label><select id="f-status"><option value="todo">To do</option><option value="doing">Doing</option><option value="done">Done</option></select></div>
			<div class="field"><label for="f-link">Delivers</label><select id="f-link"></select></div>
			<div class="field"><label for="f-assignee">Assigned to</label><select id="f-assignee"></select></div>
		</div>
		<p class="origin" id="f-origin"></p>
		<div class="field"><label for="f-notes">Notes</label><textarea id="f-notes" rows="4" placeholder="What this task covers, anything to watch out for..."></textarea></div>
		<div id="prompt-box">
			<div id="prompt-head">
				<div><h2>Prompt for your coding agent</h2><p id="prompt-when"></p></div>
				<span style="display:flex;gap:8px">
					<button type="button" class="btn" id="prompt-write">Write prompt</button>
					<button type="button" class="btn primary" id="prompt-copy">Copy</button>
				</span>
			</div>
			<pre id="prompt-text"></pre>
			<div id="prompt-empty">The AI writes a brief from this task and the spec - the use case it delivers, its requirements and data - for you to paste into Claude Code, Cursor or another coding agent. It uses your AI credit.</div>
		</div>
	</div>
</section>
<div id="toast" role="status"></div>
<script>
(function () {
	var DATA = ${json};
	var tasks = DATA.tasks, members = DATA.members, links = DATA.links, ME = DATA.me, READONLY = DATA.readOnly;
	var COLUMNS = [['todo', 'To do'], ['doing', 'Doing'], ['done', 'Done']];
	var STATUS_NAME = { todo: 'To do', doing: 'Doing', done: 'Done' };
	var openId = null;
	var filter = 'all';

	function $(id) { return document.getElementById(id); }
	function linkOf(t) { return t.link ? links.filter(function (o) { return o.type === t.link.type && o.id === t.link.id; })[0] : null; }
	function memberName(uid) { var m = members.filter(function (x) { return x.uid === uid; })[0]; return m ? m.name : 'a former member'; }
	function toast(msg) { var el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove('show'); }, 2600); }
	function tell(command) { try { window.parent.postMessage({ command: command }, '*'); } catch (e) {} }

	function send(path, payload) {
		return fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
			.then(function (r) { return r.json().catch(function () { return { ok: false, error: 'Unexpected response.' }; }); })
			.then(function (j) {
				if (!j.ok) throw new Error(j.error || 'That did not save.');
				tasks = j.tasks;
				render();
				tell('countsChanged');
				return j;
			})
			.catch(function (err) { toast(err.message); render(); throw err; });
	}

	function visible(t) {
		if (filter === 'mine') return t.assigneeUid === ME;
		if (filter === 'nobody') return !t.assigneeUid;
		return true;
	}

	// ---- the columns ----
	var dragId = null;
	function render() {
		var root = $('columns');
		root.textContent = '';
		COLUMNS.forEach(function (c) {
			var status = c[0];
			var list = tasks.filter(function (t) { return t.status === status; }).sort(function (a, b) { return a.order - b.order; });
			var col = document.createElement('section');
			col.className = 'col';
			col.dataset.status = status;
			col.setAttribute('aria-label', c[1]);
			var head = document.createElement('div');
			head.className = 'col-head';
			head.innerHTML = '<span></span><span class="col-count"></span>';
			head.firstChild.textContent = c[1];
			head.lastChild.textContent = String(list.length);
			col.appendChild(head);
			var cards = document.createElement('div');
			cards.className = 'cards';
			list.filter(visible).forEach(function (t) { cards.appendChild(cardFor(t)); });
			if (!tasks.length && status === 'todo') {
				var empty = document.createElement('p');
				empty.className = 'empty';
				empty.textContent = READONLY ? 'No tasks yet.' : 'No tasks yet. Add one, or ask the chat to plan the tasks for a use case.';
				cards.appendChild(empty);
			}
			col.appendChild(cards);
			if (!READONLY && status !== 'done') col.appendChild(addRow(status));
			if (!READONLY) dropTarget(col, status);
			root.appendChild(col);
		});
		if (openId) fillPanel();
	}

	function cardFor(t) {
		var card = document.createElement('button');
		card.type = 'button';
		card.className = 'card' + (t.createdByAi ? ' ai' : '');
		card.dataset.id = t.id;
		var title = document.createElement('span');
		title.className = 'card-title';
		title.textContent = t.title;
		card.appendChild(title);
		var meta = document.createElement('span');
		meta.className = 'card-meta';
		var link = linkOf(t);
		if (link) { var chip = document.createElement('span'); chip.className = 'chip' + (link.type === 'nfr' ? ' nfr' : ''); chip.textContent = link.label; chip.title = link.name; meta.appendChild(chip); }
		if (t.createdByAi) { var ai = document.createElement('span'); ai.className = 'ai-mark'; ai.textContent = 'Added by AI'; meta.appendChild(ai); }
		if (t.prompt) { var p = document.createElement('span'); p.className = 'has-prompt'; p.textContent = 'Prompt ready'; meta.appendChild(p); }
		if (t.assigneeUid) { var av = document.createElement('span'); av.className = 'avatar'; var name = memberName(t.assigneeUid); av.textContent = name.charAt(0).toUpperCase(); av.title = 'Assigned to ' + name; meta.appendChild(av); }
		card.appendChild(meta);
		card.addEventListener('click', function () { openPanel(t.id); });
		if (!READONLY) {
			card.draggable = true;
			card.addEventListener('dragstart', function (e) { dragId = t.id; card.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', t.id); } catch (err) {} });
			card.addEventListener('dragend', function () { dragId = null; card.classList.remove('dragging'); clearDropMarks(); });
		}
		return card;
	}

	function clearDropMarks() {
		document.querySelectorAll('.drop').forEach(function (el) { el.classList.remove('drop'); });
		document.querySelectorAll('.drop-before').forEach(function (el) { el.classList.remove('drop-before'); });
	}
	// The card the pointer is above, so a drop lands before it; none means the end of the column.
	function cardBelow(col, y) {
		var cards = Array.prototype.slice.call(col.querySelectorAll('.card:not(.dragging)'));
		return cards.filter(function (c) { var r = c.getBoundingClientRect(); return y < r.top + r.height / 2; })[0] || null;
	}
	function dropTarget(col, status) {
		col.addEventListener('dragover', function (e) {
			if (!dragId) return;
			e.preventDefault();
			clearDropMarks();
			col.classList.add('drop');
			var before = cardBelow(col, e.clientY);
			if (before) before.classList.add('drop-before');
		});
		col.addEventListener('dragleave', function (e) { if (!col.contains(e.relatedTarget)) col.classList.remove('drop'); });
		col.addEventListener('drop', function (e) {
			if (!dragId) return;
			e.preventDefault();
			var before = cardBelow(col, e.clientY);
			var id = dragId;
			clearDropMarks();
			send('api/tasks', { action: 'move', id: id, status: status, beforeId: before ? before.dataset.id : null });
		});
	}

	function addRow(status) {
		var row = document.createElement('div');
		row.className = 'add-row';
		var btn = document.createElement('button');
		btn.type = 'button';
		btn.className = 'add-btn';
		btn.textContent = '+ Add a task';
		btn.addEventListener('click', function () {
			var input = document.createElement('input');
			input.type = 'text';
			input.className = 'add-input';
			input.placeholder = 'Task title, then Enter';
			input.maxLength = 200;
			row.replaceChild(input, btn);
			input.focus();
			var done = false;
			function finish(save) {
				if (done) return;
				done = true;
				var title = input.value.trim();
				if (save && title) send('api/tasks', { action: 'create', task: { title: title, status: status } });
				else render();
			}
			input.addEventListener('keydown', function (e) {
				if (e.key === 'Enter') finish(true);
				if (e.key === 'Escape') finish(false);
			});
			input.addEventListener('blur', function () { finish(true); });
		});
		row.appendChild(btn);
		return row;
	}

	// ---- one card, in the side panel ----
	function current() { return tasks.filter(function (t) { return t.id === openId; })[0]; }
	function option(value, text, selected) { var o = document.createElement('option'); o.value = value; o.textContent = text; if (selected) o.selected = true; return o; }
	function openPanel(id) { openId = id; document.body.classList.add('panel-open'); fillPanel(); $('f-title').focus(); }
	function closePanel() { saveText(); openId = null; document.body.classList.remove('panel-open'); }

	function fillPanel() {
		var t = current();
		if (!t) { openId = null; document.body.classList.remove('panel-open'); return; }
		$('panel-where').textContent = 'Board \\u203A ' + STATUS_NAME[t.status];
		if (document.activeElement !== $('f-title')) $('f-title').value = t.title;
		if (document.activeElement !== $('f-notes')) $('f-notes').value = t.notes;
		$('f-status').value = t.status;
		var link = $('f-link');
		link.textContent = '';
		link.appendChild(option('', 'Nothing', !t.link));
		links.forEach(function (o) { link.appendChild(option(o.type + ':' + o.id, o.label + ' ' + o.name, !!t.link && t.link.type === o.type && t.link.id === o.id)); });
		if (t.link && !linkOf(t)) link.appendChild(option('gone', 'An item no longer in the spec', true));
		var who = $('f-assignee');
		who.textContent = '';
		who.appendChild(option('', 'Nobody', !t.assigneeUid));
		members.forEach(function (m) { who.appendChild(option(m.uid, m.name + (m.uid === ME ? ' (you)' : ''), m.uid === t.assigneeUid)); });
		if (t.assigneeUid && !members.some(function (m) { return m.uid === t.assigneeUid; })) who.appendChild(option(t.assigneeUid, 'A former member', true));
		$('f-origin').textContent = t.createdByAi ? 'Added by the AI from the chat.' : '';
		['f-title', 'f-status', 'f-link', 'f-assignee', 'f-notes', 'f-delete', 'prompt-write'].forEach(function (id) { $(id).disabled = READONLY; });
		$('f-delete').style.display = READONLY ? 'none' : '';
		$('prompt-write').style.display = READONLY ? 'none' : '';
		$('prompt-write').textContent = t.prompt ? 'Write again' : 'Write prompt';
		$('prompt-copy').style.display = t.prompt ? '' : 'none';
		$('prompt-text').style.display = t.prompt ? '' : 'none';
		$('prompt-empty').style.display = t.prompt ? 'none' : '';
		$('prompt-text').textContent = t.prompt ? t.prompt.text : '';
		$('prompt-when').textContent = t.prompt ? 'Written by the AI from this task and the spec, ' + new Date(t.prompt.at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Not written yet';
	}

	function update(patch) { if (openId && !READONLY) send('api/tasks', { action: 'update', id: openId, patch: patch }); }
	// Title and notes save when you leave the field (or close the panel), not on every key.
	function saveText() {
		var t = current();
		if (!t || READONLY) return;
		var title = $('f-title').value.trim(), notes = $('f-notes').value;
		var patch = {};
		if (title && title !== t.title) patch.title = title;
		if (notes !== t.notes) patch.notes = notes;
		if (Object.keys(patch).length) update(patch);
	}
	$('f-title').addEventListener('blur', saveText);
	$('f-title').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('f-title').blur(); } });
	$('f-notes').addEventListener('blur', saveText);
	$('f-status').addEventListener('change', function () { update({ status: this.value }); });
	$('f-assignee').addEventListener('change', function () { update({ assigneeUid: this.value || null }); });
	$('f-link').addEventListener('change', function () {
		if (this.value === 'gone') return;
		var i = this.value.indexOf(':');
		update({ link: this.value ? { type: this.value.slice(0, i), id: this.value.slice(i + 1) } : null });
	});
	$('f-delete').addEventListener('click', function () {
		var t = current();
		if (!t || !window.confirm('Delete "' + t.title + '"?')) return;
		var id = openId;
		openId = null;
		document.body.classList.remove('panel-open');
		send('api/tasks', { action: 'delete', id: id });
	});
	$('panel-close').addEventListener('click', closePanel);
	$('scrim').addEventListener('click', closePanel);
	document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openId) closePanel(); });

	$('prompt-write').addEventListener('click', function () {
		var btn = this, id = openId;
		saveText();
		btn.disabled = true;
		btn.textContent = 'Writing\\u2026';
		$('prompt-when').textContent = 'The AI is writing it - about ten seconds';
		send('api/tasks/prompt', { id: id })
			.then(function () { tell('balanceChanged'); })
			.catch(function () {})
			.finally(function () { btn.disabled = false; if (openId === id) fillPanel(); });
	});
	$('prompt-copy').addEventListener('click', function () {
		var t = current();
		if (!t || !t.prompt) return;
		navigator.clipboard.writeText(t.prompt.text)
			.then(function () { toast('Copied - paste it into your coding agent.'); })
			.catch(function () { toast('Could not copy - select the text and copy it yourself.'); });
	});

	$('filter').addEventListener('change', function () { filter = this.value; render(); });
	$('new-task').addEventListener('click', function () {
		send('api/tasks', { action: 'create', task: { title: 'New task', status: 'todo' } }).then(function (j) { if (j.created) openPanel(j.created); });
	});
	if (READONLY) $('new-task').style.display = 'none';

	render();
})();
</script>
</body>
</html>`;
}
