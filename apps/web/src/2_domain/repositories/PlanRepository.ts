import type { Plan } from '../entities/Plan';

/**
 * Contract for a user's subscription plan. 3_infrastructure provides the
 * implementation - a mock (cookie-based, for previewing the Free/Pro UI
 * without real billing) today, a real payment-processor-backed one later
 * behind the same interface (see REQUIREMENTS.md §9). 1_application only
 * ever depends on this interface.
 */
export interface PlanRepository {
	getPlan(userId: string): Promise<Plan>;
}
