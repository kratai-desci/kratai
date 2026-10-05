import type { UseCaseDiagramData } from './useCaseDiagramData.js';
import type { ProgressRow } from './progressData.js';
import { buildUseCaseDiagramSvg } from './useCaseDiagramView.js';
import { SRS_PAGE_CSS, DOC_SECTION, numberNfrs, useCaseModelBody, useCaseItemsBody, projectNfrBody, escapeDocText as esc } from './srsDocView.js';

const STATUS_LABEL: Record<string, string> = { 'open': 'Open', 'in-progress': 'In progress', 'done': 'Done' };
const PRIO_LABEL: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' };

const ABOUT_REPORT_TEXT = "This progress report shows how far the project has come against its requirements as of the date above. It lists every use case and non-functional requirement with its current status and priority, and then describes each use case in detail. Status is kept up to date by the project team.";

// Only what the report adds on top of the SRS stylesheet: the progress summary, the table's status
// marks and the status tag next to a use case's title. Status is always written in words, with a
// mark that differs by shape as well as colour (solid / half / hollow), so it reads in black and white.
const REPORT_CSS = `
	.progress-summary { display: flex; gap: 28px; flex-wrap: wrap; margin: 4px 0 12px; }
	.progress-summary .k { font-size: 10.5px; font-weight: 650; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-faint); margin-bottom: 2px; }
	.progress-summary .v { font-size: 20px; font-weight: 700; color: var(--text); }
	.progress-summary .v small { font-size: 12px; font-weight: 600; color: var(--text-dim); }
	.progress-bar { display: flex; height: 8px; border-radius: 99px; overflow: hidden; background: #E3E9F6; margin: 0 0 6px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
	.progress-bar .done { background: #1FA37C; }
	.progress-bar .doing { background: #3459E0; }
	.progress-legend { display: flex; gap: 16px; margin-bottom: 18px; font-size: 11.5px; color: var(--text-dim); }
	.mark { display: inline-block; width: 9px; height: 9px; border-radius: 3px; margin-right: 6px; vertical-align: -0.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
	.mark.done { background: #1FA37C; }
	.mark.in-progress { background: linear-gradient(90deg, #3459E0 50%, #fff 50%); border: 1.5px solid #3459E0; }
	.mark.open { background: #fff; border: 1.5px solid #94A0BE; }
	td.num { font-family: ui-monospace, monospace; font-size: 11px; color: var(--text-faint); white-space: nowrap; }
	td.name { font-weight: 600; }
	td.name .for { display: block; margin-top: 1px; font-weight: 400; font-size: 11.5px; color: var(--text-dim); }
	td.status { white-space: nowrap; font-weight: 600; }
	td.dim { color: var(--text-dim); white-space: nowrap; }
	.uc-status { display: inline-block; margin-left: 10px; font-size: 11px; font-weight: 600; color: var(--text-dim); white-space: nowrap; vertical-align: 1px; }
`;

export interface ProgressReportOptions {
	/** The spec as the user sees it (AI-removed items already left out). */
	spec: UseCaseDiagramData;
	/** Rows in the order to print in the table (removed ones already left out). */
	rows: ProgressRow[];
	/** Every row, to say which use case a requirement belongs to and each use case's status. */
	allRows: ProgressRow[];
	/** Already formatted, e.g. "5 October 2026". */
	asOf: string;
}

/**
 * The client-facing progress report, printed to PDF by the desktop app with the same two-pass
 * printing as the SRS (cover page without the running header, then header + "Page X of Y").
 * Built from the SRS document's own stylesheet and section builders, so the two read as one
 * family: cover page with "About this document", the project Overview, the use case model with
 * its diagram, the progress table (in the order the user had on screen), each use case in
 * detail with its status, and the project-wide non-functional requirements. No actors section.
 * Nothing internal appears (no "edited by AI" notes, no priority or closer inside the details).
 */
export function generateProgressReportHTML(opts: ProgressReportOptions): string {
	const { spec, rows, allRows } = opts;
	const title = spec.systemName || spec.workspaceName;
	const nfrInfo = numberNfrs(spec);
	const { svg: diagramSvg } = buildUseCaseDiagramSvg(spec);

	const total = rows.length;
	const count = (status: string, list: ProgressRow[] = rows) => list.filter(r => r.status === status).length;
	const done = count('done');
	const doing = count('in-progress');
	const open = count('open');
	const openHigh = rows.filter(r => r.status === 'open' && r.priority === 'high').length;
	const pct = (n: number) => (total ? (n / total) * 100 : 0);
	const ofType = (t: string) => rows.filter(r => r.type === t);
	const doneOf = (list: ProgressRow[]) => `${list.filter(r => r.status === 'done').length}<small> / ${list.length} done</small>`;

	const label = (r: ProgressRow) => (r.n == null ? '' : `${r.type === 'uc' ? 'UC' : 'NFR'}-${r.n}`);
	const forNote = (r: ProgressRow): string => {
		if (r.type !== 'nfr') return '';
		const uc = r.ucId ? allRows.find(u => u.type === 'uc' && u.id === r.ucId) : undefined;
		return `<span class="for">${uc ? `For ${uc.n == null ? '' : `UC-${uc.n} `}${esc(uc.name)}` : 'Project-wide'}</span>`;
	};
	const tableRow = (r: ProgressRow) => `<tr>
			<td class="num">${label(r)}</td>
			<td class="name">${esc(r.name)}${forNote(r)}</td>
			<td class="dim">${r.status === 'done' || !r.priority ? '' : PRIO_LABEL[r.priority]}</td>
			<td class="status"><span class="mark ${r.status}"></span>${STATUS_LABEL[r.status]}</td>
			<td class="dim">${r.status === 'done' ? esc(r.closedBy) : ''}</td>
		</tr>`;

	const progressBody =
		`<p class="section-intro">The table shows the current status of every use case and non-functional requirement as of ${esc(opts.asOf)}.</p>` +
		`<div class="progress-summary">
			<div><div class="k">Use cases</div><div class="v">${doneOf(ofType('uc'))}</div></div>
			<div><div class="k">Non-functional</div><div class="v">${doneOf(ofType('nfr'))}</div></div>
			<div><div class="k">Overall</div><div class="v">${doneOf(rows)}</div></div>
			<div><div class="k">Open, high priority</div><div class="v">${openHigh}</div></div>
		</div>
		<div class="progress-bar"><span class="done" style="width:${pct(done)}%"></span><span class="doing" style="width:${pct(doing)}%"></span></div>
		<div class="progress-legend"><span><span class="mark done"></span>Done ${done}</span><span><span class="mark in-progress"></span>In progress ${doing}</span><span><span class="mark open"></span>Open ${open}</span></div>` +
		(rows.length === 0
			? '<p>There is nothing to report yet.</p>'
			: `<table>
				<thead><tr><th>#</th><th>Requirement</th><th>Priority</th><th>Status</th><th>Closed by</th></tr></thead>
				<tbody>${rows.map(tableRow).join('')}</tbody>
			</table>`);

	// In the use case details, status only (no priority, no closer).
	const statusById = new Map(allRows.filter(r => r.type === 'uc').map(r => [r.id, r.status]));
	const statusTag = (u: { id: string }) => {
		const status = statusById.get(u.id) ?? 'open';
		return `<span class="uc-status"><span class="mark ${status}"></span>${STATUS_LABEL[status]}</span>`;
	};

	const sections: { title: string; body: string }[] = [
		{ title: 'Use Case Model', body: useCaseModelBody(spec, diagramSvg) },
		{ title: 'Progress', body: progressBody },
		{ title: DOC_SECTION.useCases.title, body: useCaseItemsBody(spec, nfrInfo, statusTag) }
	];
	if (nfrInfo.projectNfrs.length > 0) sections.push({ title: DOC_SECTION.nfrs.title, body: projectNfrBody(nfrInfo) });

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} - Progress report</title>
<style>
${SRS_PAGE_CSS}
${REPORT_CSS}
</style>
</head>
<body>
	<div id="doc">
		<div id="doc-header">
			<div class="cover-top">
				<div class="kicker">Progress report</div>
				<h1>${esc(title)}</h1>
				<div class="doc-meta">
					<div class="meta-field"><span class="meta-label">As of</span><span class="meta-value">${esc(opts.asOf)}</span></div>
					${spec.preparedBy ? `<div class="meta-field"><span class="meta-label">Prepared by</span><span class="meta-value">${esc(spec.preparedBy)}</span></div>` : ''}
					${spec.clientName ? `<div class="meta-field"><span class="meta-label">Client</span><span class="meta-value">${esc(spec.clientName)}</span></div>` : ''}
				</div>
			</div>
			<div class="cover-block cover-about">
				<div class="cover-label">About this document</div>
				<p>${ABOUT_REPORT_TEXT}</p>
			</div>
		</div>

		${spec.overview ? `<div class="section overview-section">
			<h2>Overview</h2>
			<p>${esc(spec.overview)}</p>
		</div>` : ''}

		${sections.map((s, i) => `<div class="section${i > 0 ? ' section-new-page' : ''}">
			<h2>${i + 1}. ${s.title}</h2>
			${s.body}
		</div>`).join('\n')}
	</div>
</body>
</html>`;
}
