import 'server-only';

import type { Collection } from 'mongodb';
import type { PlanRepository, UserBillingRecord } from '@/2_domain';

import { getDb } from './mongoClient';

const COLLECTION = 'users';

// Same shape as UserBillingRecord, but _id (not userId) - Mongo's own
// primary key, set directly to the GitHub account id (already a stable
// natural key everywhere else in this app - diagramViews.userId uses the
// same value), so lookups by userId never need a translation table.
interface UserDocument {
	_id: string;
	plan: UserBillingRecord['plan'];
	stripeCustomerId?: string;
	stripeSubscriptionId?: string;
	subscriptionStatus?: UserBillingRecord['subscriptionStatus'];
	billingInterval?: UserBillingRecord['billingInterval'];
	currentPeriodEnd?: string;
}

function toDomain(doc: UserDocument): UserBillingRecord {
	const { _id, ...rest } = doc;
	return { userId: _id, ...rest };
}

/**
 * Real PlanRepository implementation, backed by MongoDB Atlas - a `users`
 * collection that didn't exist before monetization (REQUIREMENTS.md §9).
 * Constructed once at module load (see 3_infrastructure/planRepository.ts),
 * same as viewRepository - which DB to use only depends on whether
 * MONGODB_URI is configured, not on the current request's session.
 */
export class MongoPlanRepository implements PlanRepository {
	private async collection(): Promise<Collection<UserDocument>> {
		const db = await getDb();
		return db.collection<UserDocument>(COLLECTION);
	}

	async getBillingRecord(userId: string): Promise<UserBillingRecord | undefined> {
		const collection = await this.collection();
		const doc = await collection.findOne({ _id: userId });
		return doc ? toDomain(doc) : undefined;
	}

	async upsertBillingRecord(
		userId: string,
		updates: Partial<Omit<UserBillingRecord, 'userId'>>
	): Promise<void> {
		const collection = await this.collection();
		await collection.updateOne({ _id: userId }, { $set: updates }, { upsert: true });
	}

	async findByStripeCustomerId(stripeCustomerId: string): Promise<UserBillingRecord | undefined> {
		const collection = await this.collection();
		const doc = await collection.findOne({ stripeCustomerId });
		return doc ? toDomain(doc) : undefined;
	}
}
