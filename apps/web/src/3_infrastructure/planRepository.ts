import 'server-only';

import type { PlanRepository } from '@/2_domain';

import { MockPlanRepository } from './mock/MockPlanRepository';

/**
 * Composition point: picks the active PlanRepository implementation. A
 * plain module-level singleton (like viewRepository, not an async factory
 * like githubRepository/diagramSource) because which implementation to use
 * only ever depends on env config, never on the current request's session -
 * same reasoning, just with only one implementation to pick from today.
 * Always mock for now; add a real payment-processor-backed implementation
 * behind an `isBillingConfigured() ? new StripePlanRepository() : ...`
 * ternary here once one exists (REQUIREMENTS.md §9), same pattern
 * viewRepository already uses for Mongo vs mock.
 */
export const planRepository: PlanRepository = new MockPlanRepository();
