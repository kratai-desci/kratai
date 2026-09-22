import { UseCaseDiagramData } from './useCaseDiagramData.js';
import { DomainModelData } from './domainModelData.js';

function escapeXml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Software Requirements Specification preview - a formatted document
 * assembled from the same use-case/domain data the diagram views render,
 * same idea as the existing /download.md markdown export but composed
 * from the spec-driven data (use cases/roles/NFRs/domain model) instead
 * of MarkdownExporter's code-facing export. Static/mock this phase (built
 * from buildMockUseCaseDiagramData/buildMockDomainModelData, see
 * view.ts) - a real version would assemble from whatever's actually
 * cached/committed once that data is real.
 */
export function generateSrsDocHTML(useCaseData: UseCaseDiagramData, domainData: DomainModelData, options: { mock?: boolean } = {}): string {
	const projectNfrs = (useCaseData.nfrs || []).filter(n => n.useCaseId === null);
	const scopedNfrs = (useCaseData.nfrs || []).filter(n => n.useCaseId !== null);

	function useCasesForActor(actorId: string): string[] {
		return useCaseData.associations
			.filter(a => a.actorId === actorId)
			.map(a => useCaseData.useCases.find(u => u.id === a.useCaseId)?.name.replace(/\n/g, ' ') || '')
			.filter(Boolean);
	}

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeXml(useCaseData.workspaceName)} - SRS</title>
<script>
	try {
		var krataiTheme = localStorage.getItem('kratai-theme');
		if (krataiTheme) document.documentElement.setAttribute('data-theme', krataiTheme);
	} catch (e) {}
</script>
<style>
	:root {
		--bg: #EEF2FA; --surface: #FFFFFF; --text: #17203A; --text-dim: #5C6785; --text-faint: #94A0BE;
		--border: #DCE3F2; --accent: #3459E0; --accent-2: #14A6B8;
	}
	@media (prefers-color-scheme: dark) {
		:root:not([data-theme="light"]) {
			--bg: #0A0E19; --surface: #131A2E; --text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
			--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
		}
	}
	:root[data-theme="dark"] {
		--bg: #0A0E19; --surface: #131A2E; --text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
		--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
	}
	* { box-sizing: border-box; }
	html, body { margin: 0; padding: 0; }
	body {
		background: var(--bg); color: var(--text);
		font-family: ui-sans-serif, -apple-system, 'Segoe UI', system-ui, sans-serif;
	}
	#doc { max-width: 760px; margin: 0 auto; padding: 48px 28px 60px; }
	#doc-header { margin-bottom: 8px; }
	#doc-header .kicker { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent); font-weight: 700; }
	#doc-header h1 { margin: 4px 0 0; font-size: 24px; }
	#doc-header .mock-tag { font-size: 11.5px; color: var(--text-faint); font-family: ui-monospace, monospace; }
	.section { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 22px 26px; margin-top: 18px; }
	.section h2 { margin: 0 0 12px; font-size: 14px; }
	.section p { color: var(--text-dim); font-size: 13px; line-height: 1.6; margin: 0; }
	table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
	th { text-align: left; color: var(--text-faint); font-weight: 650; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.03em; padding: 4px 8px; }
	td { padding: 8px; border-top: 1px solid var(--border); vertical-align: top; }
	td.mono { font-family: ui-monospace, monospace; color: var(--text-faint); font-size: 11px; }
	ul { margin: 0; padding-left: 18px; color: var(--text-dim); font-size: 12.5px; line-height: 1.7; }
	.nfr-scope { display: inline-block; font-size: 10px; font-family: ui-monospace, monospace; color: var(--accent-2); margin-right: 6px; }
</style>
</head>
<body>
	<div id="doc">
		<div id="doc-header">
			<div class="kicker">Software Requirements Specification</div>
			<h1>${escapeXml(useCaseData.workspaceName)}</h1>
			${options.mock ? `<div class="mock-tag">Preview - generated from mock spec data</div>` : ''}
		</div>

		<div class="section">
			<h2>1. Overview</h2>
			<p>${escapeXml(useCaseData.overview || 'No project overview captured yet.')}</p>
		</div>

		<div class="section">
			<h2>2. Actors &amp; roles</h2>
			<table>
				<tr><th>Actor</th><th>Role</th><th>Description</th><th>Use cases</th></tr>
				${useCaseData.actors.map(a => `<tr>
					<td>${escapeXml(a.name.replace(/\n/g, ' '))}</td>
					<td>${escapeXml(a.role || '—')}</td>
					<td>${escapeXml(a.description || '—')}</td>
					<td>${escapeXml(useCasesForActor(a.id).join(', ') || '—')}</td>
				</tr>`).join('\n')}
			</table>
		</div>

		<div class="section">
			<h2>3. Use cases</h2>
			<ul>${useCaseData.useCases.map(u => `<li>${escapeXml(u.name.replace(/\n/g, ' '))}</li>`).join('\n')}</ul>
		</div>

		<div class="section">
			<h2>4. Non-functional requirements</h2>
			${projectNfrs.length === 0 && scopedNfrs.length === 0 ? `<p>None captured yet.</p>` : `<ul>
				${projectNfrs.map(n => `<li><span class="nfr-scope">project-wide</span>${escapeXml(n.text)}</li>`).join('\n')}
				${scopedNfrs.map(n => `<li><span class="nfr-scope">${escapeXml((useCaseData.useCases.find(u => u.id === n.useCaseId)?.name || '').replace(/\n/g, ' '))}</span>${escapeXml(n.text)}</li>`).join('\n')}
			</ul>`}
		</div>

		<div class="section">
			<h2>5. Domain model</h2>
			${domainData.entities.map(e => `<div style="margin-bottom:14px">
				<strong style="font-size:13px">${escapeXml(e.name)}</strong>
				<table>
					<tr><th>Attribute</th><th>Type</th><th>Key</th></tr>
					${e.attributes.map(attr => `<tr><td class="mono">${escapeXml(attr.name)}</td><td class="mono">${escapeXml(attr.type)}</td><td>${attr.isPK ? 'PK' : attr.isFK ? 'FK' : ''}</td></tr>`).join('\n')}
				</table>
			</div>`).join('\n')}
			<ul>${domainData.relationships.map(r => `<li>${escapeXml(domainData.entities.find(e => e.id === r.fromId)?.name || r.fromId)} &rarr; ${escapeXml(domainData.entities.find(e => e.id === r.toId)?.name || r.toId)} (${escapeXml(r.kind)}${r.label ? ` - ${escapeXml(r.label)}` : ''})</li>`).join('\n')}</ul>
		</div>
	</div>
</body>
</html>`;
}
