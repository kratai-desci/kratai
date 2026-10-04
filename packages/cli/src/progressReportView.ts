import type { ProgressRow } from './progressData.js';

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const STATUS_LABEL: Record<string, string> = { 'open': 'Open', 'in-progress': 'In progress', 'done': 'Done' };
const PRIO_LABEL: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' };

export interface ProgressReportOptions {
	projectName: string;
	preparedBy?: string;
	clientName?: string;
	/** Already formatted, e.g. "5 October 2026". */
	asOf: string;
	/** The rows in the order to print (removed ones left out by the caller). */
	rows: ProgressRow[];
	/** Every row, only used to say which use case a requirement belongs to. */
	allRows: ProgressRow[];
}

/**
 * The client-facing progress report, printed to PDF by the desktop app. A fixed light
 * layout (not the app's theme), nothing internal: no "edited by AI" notes, and status is
 * written out in words so it still reads in black and white. The row order is whatever
 * the user had on screen when they pressed the button.
 */
export function generateProgressReportHTML(opts: ProgressReportOptions): string {
	const { rows } = opts;
	const count = (status: string, list: ProgressRow[] = rows) => list.filter(r => r.status === status).length;
	const total = rows.length;
	const done = count('done');
	const doing = count('in-progress');
	const open = count('open');
	const openHigh = rows.filter(r => r.status === 'open' && r.priority === 'high').length;
	const pct = (n: number) => (total ? (n / total) * 100 : 0);
	const ucs = rows.filter(r => r.type === 'uc');
	const nfrs = rows.filter(r => r.type === 'nfr');

	const label = (r: ProgressRow) => (r.n == null ? '' : `${r.type === 'uc' ? 'UC' : 'NFR'}-${r.n}`);
	const note = (r: ProgressRow): string => {
		if (r.type !== 'nfr') return '';
		const uc = r.ucId ? opts.allRows.find(u => u.type === 'uc' && u.id === r.ucId) : undefined;
		return uc ? `For ${uc.n == null ? '' : `UC-${uc.n} `}${esc(uc.name)}` : 'Project-wide';
	};
	const line = (r: ProgressRow) => `<tr>
		<td class="num">${label(r)}</td>
		<td class="name">${esc(r.name)}${r.type === 'nfr' ? `<span class="for">${note(r)}</span>` : ''}</td>
		<td>${r.status === 'done' || !r.priority ? '' : PRIO_LABEL[r.priority]}</td>
		<td><span class="status ${r.status}"><i></i>${STATUS_LABEL[r.status]}</span></td>
		<td class="by">${r.status === 'done' ? esc(r.closedBy) : ''}</td>
	</tr>`;
	const card = (title: string, list: ProgressRow[]) => {
		const d = list.filter(r => r.status === 'done').length;
		const p = list.filter(r => r.status === 'in-progress').length;
		return `<div class="card"><div class="k">${title}</div><div class="v">${d}<small> / ${list.length} done</small></div><div class="note">${p} in progress</div></div>`;
	};

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(opts.projectName)} - Progress report</title>
<style>
	* { box-sizing: border-box; }
	html, body { margin: 0; padding: 0; }
	body { font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; color: #17203A; background: #fff; font-size: 12.5px; line-height: 1.45; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
	#doc { max-width: 760px; margin: 0 auto; padding: 8px 4px 24px; }
	.kicker { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #3459E0; }
	h1 { margin: 4px 0 14px; font-size: 28px; letter-spacing: -0.02em; }
	.meta { display: flex; gap: 28px; flex-wrap: wrap; margin-bottom: 22px; color: #5C6785; }
	.meta b { display: block; font-size: 10.5px; font-weight: 650; text-transform: uppercase; letter-spacing: 0.05em; color: #94A0BE; }
	.meta span { color: #17203A; font-weight: 600; }
	.cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px; }
	.card { border: 1px solid #DCE3F2; border-radius: 10px; padding: 10px 12px; }
	.card .k { font-size: 10.5px; font-weight: 650; text-transform: uppercase; letter-spacing: 0.05em; color: #5C6785; }
	.card .v { margin-top: 4px; font-size: 22px; font-weight: 700; }
	.card .v small { font-size: 12px; font-weight: 600; color: #5C6785; }
	.card .note { margin-top: 2px; font-size: 11px; color: #5C6785; }
	.card.attention .v { color: #D6455B; }
	.bar { display: flex; height: 10px; border-radius: 99px; overflow: hidden; background: #E3E9F6; margin-bottom: 6px; }
	.bar .done { background: #1FA37C; }
	.bar .doing { background: #3459E0; }
	.legend { display: flex; gap: 16px; margin-bottom: 22px; font-size: 11px; color: #5C6785; }
	.legend i, .status i { display: inline-block; width: 9px; height: 9px; border-radius: 3px; margin-right: 6px; vertical-align: -0.5px; }
	h2 { margin: 0 0 8px; font-size: 14px; }
	table { width: 100%; border-collapse: collapse; }
	thead { display: table-header-group; }
	th { text-align: left; font-size: 10.5px; font-weight: 650; text-transform: uppercase; letter-spacing: 0.05em; color: #5C6785; background: #F4F7FD; border-bottom: 1px solid #DCE3F2; padding: 7px 8px; }
	td { padding: 7px 8px; border-bottom: 1px solid #E8EDF7; vertical-align: top; }
	tr { page-break-inside: avoid; }
	td.num { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11px; color: #5C6785; white-space: nowrap; }
	td.name { font-weight: 600; }
	.for { display: block; font-weight: 400; font-size: 11px; color: #5C6785; margin-top: 1px; }
	td.by { color: #5C6785; white-space: nowrap; }
	.status { white-space: nowrap; font-weight: 600; }
	.status.done i { background: #1FA37C; }
	.status.in-progress i { background: linear-gradient(90deg, #3459E0 50%, #fff 50%); border: 1.5px solid #3459E0; width: 9px; height: 9px; }
	.status.open i { background: #fff; border: 1.5px solid #94A0BE; }
	.empty { color: #5C6785; padding: 20px 0; }
</style>
</head>
<body>
<div id="doc">
	<div class="kicker">Progress report</div>
	<h1>${esc(opts.projectName)}</h1>
	<div class="meta">
		<div><b>As of</b><span>${esc(opts.asOf)}</span></div>
		${opts.preparedBy ? `<div><b>Prepared by</b><span>${esc(opts.preparedBy)}</span></div>` : ''}
		${opts.clientName ? `<div><b>Client</b><span>${esc(opts.clientName)}</span></div>` : ''}
	</div>
	<div class="cards">
		${card('Use cases', ucs)}
		${card('Non-functional', nfrs)}
		${card('Overall', rows)}
		<div class="card attention"><div class="k">Open, high priority</div><div class="v">${openHigh}</div><div class="note">not started and important</div></div>
	</div>
	<div class="bar"><span class="done" style="width:${pct(done)}%"></span><span class="doing" style="width:${pct(doing)}%"></span></div>
	<div class="legend"><span><i style="background:#1FA37C"></i>Done ${done}</span><span><i style="background:#3459E0"></i>In progress ${doing}</span><span><i style="background:#fff;border:1.5px solid #94A0BE"></i>Open ${open}</span></div>
	<h2>Requirements</h2>
	${rows.length === 0 ? '<div class="empty">There is nothing to report yet.</div>' : `<table>
		<thead><tr><th>#</th><th>Requirement</th><th>Priority</th><th>Status</th><th>Closed by</th></tr></thead>
		<tbody>${rows.map(line).join('')}</tbody>
	</table>`}
</div>
</body>
</html>`;
}
