import type { ViewRepository } from '@/2_domain';

import { isMongoConfigured } from './db/mongoClient';
import { MongoViewRepository } from './db/MongoViewRepository';
import { MockViewRepository } from './mock/MockViewRepository';

// Composition point: picks the active ViewRepository implementation.
// Unlike githubRepository.ts/diagramSource.ts, this doesn't depend on the
// current request's session - whether to use Mongo or the mock is a
// static decision (is MONGODB_URI configured?), so a plain module-level
// singleton is enough; no per-request re-evaluation needed. The actual
// DB connection itself is still established lazily, on first real query.
export const viewRepository: ViewRepository = isMongoConfigured()
	? new MongoViewRepository()
	: new MockViewRepository();
