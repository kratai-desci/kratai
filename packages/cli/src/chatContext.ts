import { DiagramData } from '@kratai/analysis';
import { UseCaseDiagramData, DataModelData } from '@kratai/llm';
import { buildUseCaseExtractionSummary } from './useCaseDiagramData.js';

function specSection(useCaseData: UseCaseDiagramData | undefined, dataModelData: DataModelData | undefined): string {
	if (!useCaseData && !dataModelData) return '';

	const lines: string[] = ['', '## Spec (current data - you can read AND edit this via tools)'];

	if (useCaseData) {
		lines.push('', `Prepared by: ${useCaseData.preparedBy || '(not set)'}`, `Client: ${useCaseData.clientName || '(not set)'}`);
		lines.push('', '### Use Case Model');
		if (useCaseData.overview) lines.push(`Overview: ${useCaseData.overview}`);
		if (useCaseData.narrative) lines.push(`Narrative: ${useCaseData.narrative}`);

		lines.push('', 'Actors:');
		useCaseData.actors.forEach(a => {
			const useCases = useCaseData.associations
				.filter(x => x.actorId === a.id)
				.map(x => useCaseData.useCases.find(u => u.id === x.useCaseId)?.name.replace(/\n/g, ' ') || '')
				.filter(Boolean);
			lines.push(`- ${a.id} "${a.name.replace(/\n/g, ' ')}"${a.role ? ` (role: ${a.role})` : ''}${a.description ? `: ${a.description}` : ''}${useCases.length ? ` - use cases: ${useCases.join(', ')}` : ''}`);
		});

		const nfrsByUseCase = new Map<string, string[]>();
		(useCaseData.nfrs || []).forEach(n => {
			if (n.useCaseId === null) return;
			const list = nfrsByUseCase.get(n.useCaseId) || [];
			list.push(`${n.name}: ${n.text}`);
			nfrsByUseCase.set(n.useCaseId, list);
		});
		lines.push('', 'Use cases:');
		useCaseData.useCases.forEach(u => {
			const nfrs = nfrsByUseCase.get(u.id) || [];
			lines.push(`- ${u.id} "${u.name.replace(/\n/g, ' ')}"${u.description ? `: ${u.description}` : ''}${nfrs.length ? ` - NFRs: ${nfrs.join('; ')}` : ''}`);
		});

		if (useCaseData.relations.length > 0) {
			lines.push('', 'Use case relations:');
			useCaseData.relations.forEach(r => lines.push(`- ${r.fromId} <<${r.kind}>> ${r.toId}`));
		}

		const projectNfrs = (useCaseData.nfrs || []).filter(n => n.useCaseId === null);
		if (projectNfrs.length > 0) {
			lines.push('', 'Project-wide NFRs:');
			projectNfrs.forEach(n => lines.push(`- ${n.id} "${n.name}": ${n.text}`));
		}
	}

	if (dataModelData) {
		lines.push('', '### Data Model');
		if (dataModelData.narrative) lines.push(`Narrative: ${dataModelData.narrative}`);

		lines.push('', 'Entities:');
		if (dataModelData.entities.length === 0) lines.push('(none)');
		dataModelData.entities.forEach(e => {
			const attrs = e.attributes.map(a => `${a.name}: ${a.type}${a.isPK ? ' [PK]' : ''}${a.isFK ? ' [FK]' : ''}`).join(', ');
			lines.push(`- ${e.id} "${e.name}" - ${attrs || '(no attributes)'}`);
		});

		if (dataModelData.relationships.length > 0) {
			lines.push('', 'Relationships:');
			dataModelData.relationships.forEach(r => lines.push(`- ${r.fromId} -> ${r.toId} (${r.kind}${r.label ? `, "${r.label}"` : ''})`));
		}
	}

	return lines.join('\n');
}

/**
 * Everything the chat model needs in one text block: the existing
 * codebase-routes summary (buildUseCaseExtractionSummary) plus a full
 * plain-text dump of the Spec, when it exists - actors/use cases/NFRs/
 * narratives, data entities/relationships, and document metadata. Ids are
 * included so the model can reference exact existing items when it calls
 * one of the update_* tools (see chatToolDefinitions.ts) to edit them.
 */
export function buildChatSummary(
	diagramData: DiagramData,
	workspaceName: string,
	useCaseData: UseCaseDiagramData | undefined,
	dataModelData: DataModelData | undefined
): string {
	return buildUseCaseExtractionSummary(diagramData, workspaceName) + specSection(useCaseData, dataModelData);
}
