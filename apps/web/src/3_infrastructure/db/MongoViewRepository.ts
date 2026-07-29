import 'server-only';

import type { Collection } from 'mongodb';
import type { CreateViewInput, ViewGenerationStatus, ViewRepository, WebDiagramView } from '@/2_domain';
import type { DiagramData, KrataiConfig } from '@kratai/core';

import { getDb } from './mongoClient';

const COLLECTION = 'diagramViews';
const STUCK_GENERATING_MS = 5 * 60 * 1000;

// Same shape as WebDiagramView, but _id (not id) - Mongo's own primary key
// field, set to our own generated string id rather than an ObjectId, so no
// id <-> _id translation table is needed elsewhere.
interface ViewDocument {
	_id: string;
	userId: string;
	repoFullName: string;
	branch: string;
	name: string;
	config: KrataiConfig;
	createdAt: string;
	lastGenerated?: string;
	status: ViewGenerationStatus;
	commitSha?: string;
	generatingSince?: string;
	lastError?: string;
	diagramData?: DiagramData;
}

function toDomain(doc: ViewDocument): WebDiagramView {
	const { _id, ...rest } = doc;
	return { id: _id, ...rest };
}

function makeId(): string {
	return `view_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Real ViewRepository implementation, backed by MongoDB Atlas. Constructed
 * once at module load (see 3_infrastructure/viewRepository.ts) - unlike
 * GitHubApiRepository/GitCloneDiagramSource, it isn't per-request state,
 * since which DB to use doesn't depend on who's signed in, only on
 * whether MONGODB_URI is configured.
 *
 * Every query includes userId in the filter itself (not a post-fetch
 * check), so a user can never read, modify, or delete another user's
 * document even if they know its id.
 */
export class MongoViewRepository implements ViewRepository {
	private async collection(): Promise<Collection<ViewDocument>> {
		const db = await getDb();
		return db.collection<ViewDocument>(COLLECTION);
	}

	async listViews(
		userId: string,
		filter?: { repoFullName?: string; branch?: string }
	): Promise<WebDiagramView[]> {
		const collection = await this.collection();
		const query: Partial<Pick<ViewDocument, 'userId' | 'repoFullName' | 'branch'>> = { userId };
		if (filter?.repoFullName) query.repoFullName = filter.repoFullName;
		if (filter?.branch) query.branch = filter.branch;

		// diagramData is comparatively large - excluded here so listing a
		// user's views never transfers every view's full cached payload.
		// getView() (used wherever the payload is actually needed) doesn't
		// exclude it.
		const docs = await collection
			.find(query, { projection: { diagramData: 0 } })
			.sort({ lastGenerated: -1, createdAt: -1 })
			.toArray();
		return docs.map(toDomain);
	}

	async getView(id: string, userId: string): Promise<WebDiagramView | undefined> {
		const collection = await this.collection();
		const doc = await collection.findOne({ _id: id, userId });
		return doc ? toDomain(doc) : undefined;
	}

	async createView(userId: string, input: CreateViewInput): Promise<WebDiagramView> {
		const collection = await this.collection();
		const doc: ViewDocument = {
			_id: makeId(),
			userId,
			repoFullName: input.repoFullName,
			branch: input.branch,
			name: input.name,
			config: input.config,
			createdAt: new Date().toISOString(),
			status: 'idle',
		};
		await collection.insertOne(doc);
		return toDomain(doc);
	}

	async updateView(
		id: string,
		userId: string,
		updates: Partial<Pick<WebDiagramView, 'name' | 'config'>>
	): Promise<WebDiagramView | undefined> {
		const collection = await this.collection();
		// Editing config invalidates any cached diagramData - reset to
		// 'idle' so the next view of this diagram regenerates inline (same
		// as first-ever creation), rather than silently rendering stale
		// data under the new config.
		const result = await collection.findOneAndUpdate(
			{ _id: id, userId },
			{
				$set: { ...updates, status: 'idle' },
				$unset: { diagramData: '', commitSha: '', lastError: '', generatingSince: '' },
			},
			{ returnDocument: 'after' }
		);
		return result ? toDomain(result) : undefined;
	}

	async deleteView(id: string, userId: string): Promise<void> {
		const collection = await this.collection();
		await collection.deleteOne({ _id: id, userId });
	}

	async beginGeneration(id: string, userId: string): Promise<WebDiagramView | undefined> {
		const collection = await this.collection();
		const stuckCutoff = new Date(Date.now() - STUCK_GENERATING_MS).toISOString();

		// Atomic: the "is a generation already running" check and the
		// transition to 'generating' happen in a single findOneAndUpdate, so
		// two concurrent requests (possibly on different server instances)
		// can't both win the lock.
		const result = await collection.findOneAndUpdate(
			{
				_id: id,
				userId,
				$or: [{ status: { $ne: 'generating' } }, { generatingSince: { $lt: stuckCutoff } }],
			},
			{ $set: { status: 'generating', generatingSince: new Date().toISOString() } },
			{ returnDocument: 'after' }
		);
		return result ? toDomain(result) : undefined;
	}

	async completeGeneration(
		id: string,
		userId: string,
		result: { diagramData: DiagramData; commitSha: string }
	): Promise<WebDiagramView | undefined> {
		const collection = await this.collection();
		const updated = await collection.findOneAndUpdate(
			{ _id: id, userId },
			{
				$set: {
					status: 'ready',
					diagramData: result.diagramData,
					commitSha: result.commitSha,
					lastGenerated: new Date().toISOString(),
				},
				$unset: { generatingSince: '', lastError: '' },
			},
			{ returnDocument: 'after' }
		);
		return updated ? toDomain(updated) : undefined;
	}

	async failGeneration(id: string, userId: string, errorMessage: string): Promise<WebDiagramView | undefined> {
		const collection = await this.collection();

		// Whether to fall back to 'ready' (keep last good data) or 'failed'
		// (nothing to fall back to) depends on whether diagramData already
		// exists - fetched first since it can't be expressed in a single
		// $set without an aggregation-pipeline update. Safe as a
		// read-then-write here (unlike beginGeneration): this generation
		// attempt already holds the 'generating' lock, so no other writer
		// is racing this same transition.
		const existing = await collection.findOne({ _id: id, userId });
		const hasPriorData = existing?.diagramData != null;

		const updated = await collection.findOneAndUpdate(
			{ _id: id, userId },
			{
				$set: { status: hasPriorData ? 'ready' : 'failed', lastError: errorMessage },
				$unset: { generatingSince: '' },
			},
			{ returnDocument: 'after' }
		);
		return updated ? toDomain(updated) : undefined;
	}
}
