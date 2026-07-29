import type { ViewRepository } from '@/2_domain';

import { MockViewRepository } from './mock/MockViewRepository';

// Composition point: picks the active ViewRepository implementation.
// Always the mock today - a MongoDB Atlas-backed implementation joins
// MockViewRepository here later, selected e.g. by env var.
export const viewRepository: ViewRepository = new MockViewRepository();
