import 'server-only';

import type { DiagramSourceRepository } from '@/2_domain';

import { MockDiagramSource } from './mock/MockDiagramSource';

// Composition point: picks the active DiagramSourceRepository
// implementation. Always the mock today - a server-side git clone +
// CodeParserService.parseWorkspace implementation joins MockDiagramSource
// here later, selected e.g. by env var.
export const diagramSource: DiagramSourceRepository = new MockDiagramSource();
