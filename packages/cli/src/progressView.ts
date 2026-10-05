import type { ProgressRow } from './progressData.js';

function escapeXml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * The Progress view: every use case and requirement with a status (Open / In
 * progress / Done) and an optional priority, an overview strip, sorting that only
 * changes the view (never the spec's order or numbers), and a PDF progress report
 * for the client. Rows come from the spec (see progressData.ts's buildProgressRows);
 * every change is saved through POST /api/progress. When the AI edits or removes an
 * item that has progress, a callout row under it asks the user to acknowledge it,
 * or to restore / delete it for good. Same theme variables as the other views.
 */
export function generateProgressHTML(workspaceName: string, rows: ProgressRow[]): string {
	// JSON inside a <script>: "<" is escaped so a name can never close the tag.
	const rowsJson = JSON.stringify(rows).replace(/</g, '\\u003c');
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeXml(workspaceName)} - progress</title>
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
		--border: #DCE3F2; --accent: #3459E0;
		--ok: #1FA37C; --warn: #C87A17; --danger: #D6455B;
	}
	@media (prefers-color-scheme: dark) {
		:root:not([data-theme="light"]) {
			--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38;
			--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
			--border: #262E4E; --accent: #6D93F5;
			--ok: #3FCB9F; --warn: #E6A23C; --danger: #F0687D;
		}
	}
	:root[data-theme="dark"] {
		--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38;
		--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
		--border: #262E4E; --accent: #6D93F5;
		--ok: #3FCB9F; --warn: #E6A23C; --danger: #F0687D;
	}
	* { box-sizing: border-box; }
	html, body { margin: 0; padding: 0; height: 100%; }
	body {
		background: var(--bg); color: var(--text); overflow-y: auto;
		font-family: ui-sans-serif, -apple-system, 'Segoe UI', system-ui, sans-serif;
	}
	button, select { font: inherit; color: inherit; }
	#page { max-width: 1000px; margin: 0 auto; padding: 48px 24px 56px; }

	#header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
	#header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
	#header .sub { font-size: 12.5px; color: var(--text-dim); }
	/* Same button, same place and same status line as the SRS document's "Download PDF". */
	#pdf-download {
		position: fixed; top: 18px; right: 22px; z-index: 10;
		display: flex; align-items: center; gap: 8px;
	}
	#pdf-download button {
		border: none; background: var(--accent); color: #fff; font-weight: 650;
		font-size: 12.5px; padding: 8px 16px; border-radius: 8px; cursor: pointer;
		display: flex; align-items: center; gap: 6px;
	}
	#pdf-download button:disabled { opacity: 0.6; cursor: wait; }
	#pdf-status { font-size: 12px; color: var(--text-dim); max-width: 220px; text-align: right; }
	#pdf-status.error { color: #D6455B; }

	/* ---- overview ---- */
	#overview { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
	.stat { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; }
	.stat .label { font-size: 11.5px; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.04em; }
	.stat .value { margin-top: 6px; font-size: 24px; font-weight: 700; letter-spacing: -0.01em; }
	.stat .value small { font-size: 13px; font-weight: 600; color: var(--text-dim); margin-left: 4px; }
	.stat .note { margin-top: 6px; font-size: 12px; color: var(--text-dim); }
	.bar { margin-top: 10px; height: 6px; border-radius: 99px; background: var(--surface-2); border: 1px solid var(--border); overflow: hidden; display: flex; }
	.bar .done { background: var(--ok); }
	.bar .doing { background: var(--accent); }
	.stat.attention .value { color: var(--danger); }

	/* ---- tables ---- */
	.section { margin-bottom: 30px; }
	.section-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 10px; }
	.section-head h2 { margin: 0; font-size: 15px; font-weight: 650; }
	.section-head .count { font-size: 12.5px; color: var(--text-dim); }
	.clear-sort { margin-left: auto; border: none; background: none; color: var(--accent); font-size: 12.5px; font-weight: 600; cursor: pointer; padding: 0; visibility: hidden; }
	.clear-sort.on { visibility: visible; }
	.table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 560px; }
	th { text-align: left; font-size: 11.5px; font-weight: 650; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.04em; background: var(--surface-2); border-bottom: 1px solid var(--border); padding: 0; white-space: nowrap; }
	th button {
		width: 100%; display: flex; align-items: center; gap: 6px; padding: 10px 12px; border: none; background: none;
		font-size: 11.5px; font-weight: 650; color: inherit; text-transform: inherit; letter-spacing: inherit; cursor: pointer; text-align: left;
	}
	th button:hover { color: var(--text); }
	th.sorted button { color: var(--accent); }
	.sort-rank { display: inline-grid; place-items: center; width: 16px; height: 16px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 10px; letter-spacing: 0; }
	.sort-arrow { font-size: 9px; letter-spacing: 0; }
	td { padding: 9px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
	tr:last-child td { border-bottom: none; }
	tbody tr:hover { background: color-mix(in srgb, var(--accent) 5%, var(--surface)); }
	td.num { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 12px; color: var(--text-dim); white-space: nowrap; }
	td.name { font-weight: 600; }
	td.by { color: var(--text-dim); white-space: nowrap; }
	tr.nfr td.name { font-weight: 500; }
	td.name .for { display: block; margin-top: 2px; font-size: 12px; font-weight: 400; color: var(--text-dim); }
	/* Items the AI touched get a callout row directly under them (a separate line, with its own buttons). */
	tr.has-callout td { border-bottom: none; }
	tr.removed td.num, tr.removed td.by, tr.removed td.name .t { opacity: 0.55; }
	tr.removed td.name .t { text-decoration: line-through; }
	tr.removed td.static { color: var(--text-faint); font-size: 12.5px; }
	tr.callout:hover { background: none; }
	tr.callout td { padding: 0 12px 12px; }
	.dialog {
		display: flex; align-items: center; gap: 16px; padding: 11px 14px; border-radius: 10px;
		border: 1px solid var(--warn); border-left-width: 4px;
		background: color-mix(in srgb, var(--warn) 8%, var(--surface));
	}
	.dialog.removed { border-color: var(--danger); background: color-mix(in srgb, var(--danger) 8%, var(--surface)); }
	.dialog .msg { flex: 1; min-width: 0; font-size: 13px; line-height: 1.5; color: var(--text-dim); }
	.dialog .msg strong { display: block; font-size: 13px; color: var(--text); margin-bottom: 1px; }
	.dialog.edited .msg strong { color: var(--warn); }
	.dialog.removed .msg strong { color: var(--danger); }
	.dialog .btns { display: flex; gap: 8px; flex-shrink: 0; }
	.dialog button { border: 1px solid var(--border); background: var(--surface); border-radius: 8px; padding: 6px 13px; font-size: 12.5px; font-weight: 600; cursor: pointer; }
	.dialog button:hover { border-color: var(--accent); color: var(--accent); }
	.dialog button.danger:hover { border-color: var(--danger); color: var(--danger); }
	@media (max-width: 760px) { .dialog { flex-direction: column; align-items: flex-start; } }
	select {
		appearance: none; -webkit-appearance: none; border: 1px solid var(--border); background: var(--surface); border-radius: 99px;
		padding: 3px 24px 3px 10px; font-size: 12.5px; font-weight: 600; cursor: pointer; outline: none;
		background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%);
		background-position: calc(100% - 13px) 55%, calc(100% - 9px) 55%; background-size: 4px 4px, 4px 4px; background-repeat: no-repeat;
	}
	select:focus-visible { box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 35%, transparent); }
	select.status-open { color: var(--text-dim); }
	select.status-in-progress { color: var(--accent); border-color: var(--accent); background-color: color-mix(in srgb, var(--accent) 10%, var(--surface)); }
	select.status-done { color: var(--ok); border-color: var(--ok); background-color: color-mix(in srgb, var(--ok) 10%, var(--surface)); }
	select.prio-high { color: var(--danger); }
	select.prio-medium { color: var(--warn); }
	select.prio-low, select.prio-none { color: var(--text-dim); }
	#footnote { font-size: 12px; color: var(--text-faint); line-height: 1.6; }
	#toast {
		position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%) translateY(20px); opacity: 0;
		background: var(--text); color: var(--bg); font-size: 13px; font-weight: 600; padding: 9px 16px; border-radius: 10px;
		transition: opacity 0.2s, transform 0.2s; pointer-events: none;
	}
	#toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
	@media (max-width: 760px) { #overview { grid-template-columns: repeat(2, 1fr); } }
	#empty { padding: 40px 0; text-align: center; color: var(--text-dim); font-size: 13.5px; line-height: 1.6; }
</style>
</head>
<body>
	<div id="page">
		<div id="header">
			<h1>Progress</h1>
			<span class="sub">${escapeXml(workspaceName)}</span>
		</div>
		<div id="pdf-download">
			<span id="pdf-status"></span>
			<button id="pdf-btn">Download PDF</button>
		</div>
		<div id="empty" style="display:none">There is nothing to track yet.<br>Once your Spec has use cases and requirements, they are listed here so you can follow their progress.</div>
		<div id="overview"></div>
		<div class="section" id="sec-req"></div>
		<p id="footnote">Rows keep their numbers (UC-n for use cases, NFR-n for non-functional requirements) whatever the sort - sorting only changes what you see here, never the spec. With no sort, each use case is followed by its own requirements and the project-wide ones come last. A Done item shows no priority (it comes back if the item is reopened). If the AI edits or removes an item that has progress, a note appears right under it until you act on it; a removed item stays crossed out until you restore it or delete it for good. Click a column to sort by it, click other columns to break ties (the numbers show the order), click again to reverse, and once more to remove it. Clear sorting returns to the starting order.</p>
	</div>
	<div id="toast"></div>
<script>
(function () {
	'use strict';

	// One row per use case / requirement, straight from the spec (kratai.usecases.json).
	// n is the number the Spec uses (UC-n / NFR-n) - null while the AI has removed the item.
	// Nothing here changes the order of the spec: sorting is only ever a view.
	var ROWS = ${rowsJson};
	var sortChain = [];
	var STATUS_LABEL = { 'open': 'Open', 'in-progress': 'In progress', 'done': 'Done' };
	var PRIO_LABEL = { '': 'No priority', low: 'Low', medium: 'Medium', high: 'High' };
	var STATUS_ORDER = { 'open': 0, 'in-progress': 1, 'done': 2 };
	var PRIO_ORDER = { high: 0, medium: 1, low: 2 };

	function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
	function label(r) { return r.n == null ? '—' : (r.type === 'uc' ? 'UC-' : 'NFR-') + r.n; }
	function refOf(r) { return r.type + ':' + r.id; }
	function findRow(ref) { var i = ref.indexOf(':'); var t = ref.slice(0, i), id = ref.slice(i + 1); return ROWS.filter(function (r) { return r.type === t && r.id === id; })[0]; }
	// A Done item shows no priority (the value is kept, so reopening it brings the priority back).
	function shownPrio(r) { return r.status === 'done' ? '' : r.priority; }
	function ucFor(r) { return ROWS.filter(function (u) { return u.type === 'uc' && u.id === r.ucId; })[0]; }

	// The starting order and every tie-break: each use case followed by its own
	// non-functional requirements, then the project-wide ones - flat, no indentation.
	function computeSandwich() {
		var ucs = ROWS.filter(function (r) { return r.type === 'uc'; });
		var ids = {}; ucs.forEach(function (u) { ids[u.id] = true; });
		var order = [];
		ucs.forEach(function (u) {
			order.push(u);
			ROWS.filter(function (r) { return r.type === 'nfr' && r.ucId === u.id; }).forEach(function (n) { order.push(n); });
		});
		ROWS.filter(function (r) { return r.type === 'nfr' && !(r.ucId && ids[r.ucId]); }).forEach(function (n) { order.push(n); });
		order.forEach(function (r, i) { r.pos = i; });
	}
	function docOrder(a, b) { return a.pos - b.pos; }

	// ---- sorting: a chain of columns, first clicked = primary. An unset
	// priority / closer is last in both directions. ----
	function compare(col, a, b) {
		if (col === 'n') return docOrder(a, b);
		if (col === 'status') return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
		if (col === 'prio') {
			var ap = shownPrio(a), bp = shownPrio(b);
			if (!ap && !bp) return 0;
			if (!ap) return Infinity;
			if (!bp) return -Infinity;
			return PRIO_ORDER[ap] - PRIO_ORDER[bp];
		}
		if (col === 'closedBy') {
			var ac = a.status === 'done' ? a.closedBy : '', bc = b.status === 'done' ? b.closedBy : '';
			if (!ac && !bc) return 0;
			if (!ac) return Infinity;
			if (!bc) return -Infinity;
			return ac.localeCompare(bc);
		}
		return String(a[col]).localeCompare(String(b[col]));
	}
	function sortedRows() {
		return ROWS.slice().sort(function (a, b) {
			for (var i = 0; i < sortChain.length; i++) {
				var c = compare(sortChain[i].col, a, b);
				if (c === Infinity || c === -Infinity) return c > 0 ? 1 : -1;
				if (c !== 0) return sortChain[i].dir === 'asc' ? c : -c;
			}
			return docOrder(a, b);
		});
	}
	function clickSort(col) {
		var i = sortChain.findIndex(function (s) { return s.col === col; });
		if (i === -1) sortChain.push({ col: col, dir: 'asc' });
		else if (sortChain[i].dir === 'asc') sortChain[i].dir = 'desc';
		else sortChain.splice(i, 1);
	}

	// ---- rendering ----
	function overview() {
		// An item the AI removed no longer counts while it waits for the user's decision.
		function ofType(t) { return ROWS.filter(function (r) { return !r.removedByAi && (t === 'all' || r.type === t); }); }
		function count(list, st) { return list.filter(function (r) { return r.status === st; }).length; }
		function bar(list) {
			var t = list.length || 1;
			return '<div class="bar"><span class="done" style="width:' + (count(list, 'done') / t * 100) + '%"></span><span class="doing" style="width:' + (count(list, 'in-progress') / t * 100) + '%"></span></div>';
		}
		function stat(title, list) {
			return '<div class="stat"><div class="label">' + title + '</div><div class="value">' + count(list, 'done') + '<small>/ ' + list.length + ' done</small></div>' + bar(list) +
				'<div class="note">' + count(list, 'in-progress') + ' in progress</div></div>';
		}
		var openHigh = ROWS.filter(function (r) { return !r.removedByAi && r.status === 'open' && r.priority === 'high'; }).length;
		document.getElementById('overview').innerHTML =
			stat('Use cases', ofType('uc')) + stat('Non-functional', ofType('nfr')) + stat('Overall', ofType('all')) +
			'<div class="stat attention"><div class="label">Open, high priority</div><div class="value">' + openHigh + '</div><div class="note">still to start and important</div></div>';
	}
	function section() {
		var cols = [['n', '#'], ['name', 'Requirement'], ['prio', 'Priority'], ['status', 'Status'], ['closedBy', 'Closed by']];
		var head = cols.map(function (c) {
			var i = sortChain.findIndex(function (s) { return s.col === c[0]; });
			var rank = i === -1 ? '' : '<span class="sort-rank">' + (i + 1) + '</span><span class="sort-arrow">' + (sortChain[i].dir === 'asc' ? '&#9650;' : '&#9660;') + '</span>';
			var tip = i === -1 ? 'Sort by ' + c[1] : (sortChain[i].dir === 'asc' ? 'Click to reverse' : 'Click to remove this sort');
			return '<th class="' + (i === -1 ? '' : 'sorted') + '"><button data-sort="' + c[0] + '" title="' + esc(tip) + '">' + esc(c[1]) + rank + '</button></th>';
		}).join('');
		var rows = sortedRows().map(function (r) {
			var ref = refOf(r);
			var kind = r.type === 'uc' ? 'use case' : 'requirement';
			var note = '';
			if (r.type === 'nfr') {
				var uc = r.ucId ? ucFor(r) : null;
				note = '<span class="for">' + (uc ? 'For ' + (uc.n == null ? '' : label(uc) + ' ') + esc(uc.name) : 'Project-wide') + '</span>';
			}
			var callout = '';
			var ownerGone = r.type === 'nfr' && r.ucId && ucFor(r) && ucFor(r).removedByAi;
			if (r.removedByAi && ownerGone) {
				// It went with its use case, so there is one decision to make, on that use case.
				callout = '<tr class="callout"><td colspan="5"><div class="dialog removed"><div class="msg"><strong>Removed along with its use case</strong>' +
					'Restore or delete the use case above and this requirement follows.</div></div></td></tr>';
			} else if (r.removedByAi) {
				callout = '<tr class="callout"><td colspan="5"><div class="dialog removed"><div class="msg"><strong>Removed by AI</strong>' +
					'The AI removed this ' + kind + '. It stays here, crossed out, until you decide - nothing is lost yet.</div>' +
					'<div class="btns"><button data-restore="' + esc(ref) + '">Restore</button><button class="danger" data-purge="' + esc(ref) + '">Delete for good</button></div></div></td></tr>';
			} else if (r.editedByAi) {
				callout = '<tr class="callout"><td colspan="5"><div class="dialog edited"><div class="msg"><strong>Edited by AI</strong>' +
					'The AI changed this ' + kind + ' since you last checked. Have a look at it in the Spec, then acknowledge.</div>' +
					'<div class="btns"><button data-ack="' + esc(ref) + '">Acknowledge</button></div></div></td></tr>';
			}
			var cls = r.type + (r.removedByAi ? ' removed' : '') + (callout ? ' has-callout' : '');
			var nameCell = '<td class="name"><span class="t">' + esc(r.name) + '</span>' + note + '</td>';
			if (r.removedByAi) {
				return '<tr class="' + cls + '"><td class="num">' + label(r) + '</td>' + nameCell +
					'<td class="static">' + (r.priority ? PRIO_LABEL[r.priority] : '') + '</td><td class="static">' + STATUS_LABEL[r.status] + '</td><td class="by"></td></tr>' + callout;
			}
			return '<tr class="' + cls + '"><td class="num">' + label(r) + '</td>' + nameCell +
				(r.status === 'done' ? '<td></td>' :
					'<td><select class="prio-' + (r.priority || 'none') + '" data-field="priority" data-row="' + esc(ref) + '" aria-label="Priority">' +
					Object.keys(PRIO_LABEL).map(function (p) { return '<option value="' + p + '"' + (p === r.priority ? ' selected' : '') + '>' + PRIO_LABEL[p] + '</option>'; }).join('') + '</select></td>') +
				'<td><select class="status-' + r.status + '" data-field="status" data-row="' + esc(ref) + '" aria-label="Status">' +
					Object.keys(STATUS_LABEL).map(function (s) { return '<option value="' + s + '"' + (s === r.status ? ' selected' : '') + '>' + STATUS_LABEL[s] + '</option>'; }).join('') + '</select></td>' +
				'<td class="by">' + (r.status === 'done' ? esc(r.closedBy || '') : '') + '</td></tr>' + callout;
		}).join('');
		var pending = ROWS.filter(function (r) { return r.removedByAi; }).length;
		document.getElementById('sec-req').innerHTML =
			'<div class="section-head"><h2>Requirements</h2><span class="count">' + (ROWS.length - pending) + ' items' + (pending ? ', ' + pending + ' removed' : '') + '</span>' +
			'<button class="clear-sort' + (sortChain.length ? ' on' : '') + '" data-clear="1">Clear sorting</button></div>' +
			'<div class="table-wrap"><table><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
	}
	function renderAll() {
		var empty = ROWS.length === 0;
		document.getElementById('empty').style.display = empty ? 'block' : 'none';
		document.getElementById('pdf-download').style.display = empty ? 'none' : 'flex';
		document.getElementById('footnote').style.display = empty ? 'none' : '';
		if (empty) { document.getElementById('overview').innerHTML = ''; document.getElementById('sec-req').innerHTML = ''; return; }
		overview(); section();
	}

	function toast(msg) {
		var el = document.getElementById('toast');
		el.textContent = msg; el.classList.add('show');
		clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove('show'); }, 2600);
	}
	// Every change goes through the server (it owns the spec file); it answers with the fresh rows,
	// which also renumbers anything a restore or delete shifted.
	function act(payload) {
		return fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
			.then(function (r) { return r.json().catch(function () { return { ok: false, error: 'Unexpected response.' }; }); })
			.then(function (j) {
				if (!j.ok) throw new Error(j.error || 'Could not save that.');
				ROWS = j.rows; computeSandwich(); renderAll();
			})
			.catch(function (err) { toast(err.message || 'Could not save that.'); renderAll(); });
	}
	function typeAndId(ref) { var i = ref.indexOf(':'); return { type: ref.slice(0, i), id: ref.slice(i + 1) }; }

	document.addEventListener('click', function (e) {
		var t = e.target.closest ? e.target : null; if (!t) return;
		var s = t.closest('[data-sort]'), c = t.closest('[data-clear]'), a = t.closest('[data-ack]'), rs = t.closest('[data-restore]'), pg = t.closest('[data-purge]');
		if (s) { clickSort(s.getAttribute('data-sort')); renderAll(); }
		else if (c) { sortChain = []; renderAll(); }
		else if (a) { var x = typeAndId(a.getAttribute('data-ack')); act({ action: 'acknowledge', type: x.type, id: x.id }); }
		else if (rs) { var y = typeAndId(rs.getAttribute('data-restore')); act({ action: 'restore', type: y.type, id: y.id }); }
		else if (pg) {
			var z = typeAndId(pg.getAttribute('data-purge')); var row = findRow(pg.getAttribute('data-purge'));
			if (window.confirm('Delete "' + (row ? row.name : 'this item') + '" for good? This cannot be undone.')) act({ action: 'purge', type: z.type, id: z.id });
		}
		else if (t.closest('#pdf-btn')) exportPdf();
	});
	document.addEventListener('change', function (e) {
		var el = e.target; if (!el.getAttribute || !el.getAttribute('data-field')) return;
		var x = typeAndId(el.getAttribute('data-row'));
		var payload = { action: 'update', type: x.type, id: x.id };
		payload[el.getAttribute('data-field')] = el.value;
		act(payload);
	});

	// The report follows what is on screen: same sort, removed items left out.
	function exportPdf() {
		var btn = document.getElementById('pdf-btn');
		var status = document.getElementById('pdf-status');
		btn.disabled = true; btn.textContent = 'Generating...';
		status.textContent = ''; status.classList.remove('error');
		var order = sortedRows().filter(function (r) { return !r.removedByAi; }).map(refOf);
		fetch('/api/progress/export-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: order }) })
			.then(function (r) { return r.json(); })
			.then(function (result) {
				if (!result.ok && result.error) throw new Error(result.error);
				// ok with no path means the save dialog was cancelled - nothing to say.
				if (result.ok && result.path) status.textContent = 'Saved ' + result.path;
			})
			.catch(function (err) { status.textContent = err.message || String(err); status.classList.add('error'); })
			.finally(function () { btn.disabled = false; btn.textContent = 'Download PDF'; });
	}

	computeSandwich();
	renderAll();
})();
</script>
</body>
</html>`;
}
