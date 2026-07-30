import type { PlanRepository } from '@/2_domain';

import { isMongoConfigured } from './db/mongoClient';
import { MongoPlanRepository } from './db/MongoPlanRepository';
import { MockPlanRepository } from './mock/MockPlanRepository';

// Composition point: picks the active PlanRepository implementation. Gated
// on Mongo (like viewRepository), not on Stripe - storage and
// payment-processing are separate concerns. Whether checkout/portal
// actually call the real Stripe API or short-circuit to a direct upsert is
// decided separately in 1_application/billing.ts, based on
// isStripeConfigured(). That split means "Mongo configured, Stripe not"
// is a coherent state: purchases simulate directly into the real database
// instead of a per-browser cookie.
export const planRepository: PlanRepository = isMongoConfigured()
	? new MongoPlanRepository()
	: new MockPlanRepository();
