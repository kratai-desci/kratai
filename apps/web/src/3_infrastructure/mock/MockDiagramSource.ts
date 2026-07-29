import 'server-only';

import type { DiagramData, KrataiConfig } from '@kratai/core';
import type { DiagramSourceRepository } from '@/2_domain';

import sampleDiagram from '../fixtures/sample-diagram.json';

// The only fixture available in this UI-only phase - every generated view
// renders this same real DiagramData regardless of which (mock) repo/branch
// was selected, and the repoFullName/branch/config arguments are ignored.
// Swapped for a server-side git clone + CodeParserService.parseWorkspace
// call later, behind the same interface - which is why the interface
// already takes those arguments even though this implementation doesn't
// use them.
const FIXTURE_DIAGRAM_DATA = sampleDiagram as DiagramData;

export class MockDiagramSource implements DiagramSourceRepository {
	async getDiagramData(
		_repoFullName: string,
		_branch: string,
		_config: KrataiConfig
	): Promise<DiagramData> {
		return FIXTURE_DIAGRAM_DATA;
	}
}
