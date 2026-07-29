import 'server-only';

import type { Collection } from 'mongodb';
import type { CreateViewInput, ViewRepository, WebDiagramView } from '@/2_domain';
import type { KrataiConfig } from '@kratai/core';

import { getDb } from './mongoClient';

const COLLECTION = 'diagramViews';

// Same shape as WebDiagramView, but _id (not id) - Mongo's own primary key
// field, set to our own generated string id rather than an ObjectId, so no
// id <-> _id translation table is needed elsewhere.
interface ViewDocument {
	_id: string;
	repoFullName: string;
	branch: string;
	name: string;
	config: KrataiConfig;
	createdAt: string;
	lastGenerated?: string;
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
 */
export class MongoViewRepository implements ViewRepository {
	private async collection(): Promise<Collection<ViewDocument>> {
		const db = await getDb();
		return db.collection<ViewDocument>(COLLECTION);
	}

	async listViews(filter?: { repoFullName?: string; branch?: string }): Promise<WebDiagramView[]> {
		const collection = await this.collection();
		const query: Partial<Pick<ViewDocument, 'repoFullName' | 'branch'>> = {};
		if (filter?.repoFullName) query.repoFullName = filter.repoFullName;
		if (filter?.branch) query.branch = filter.branch;

		const docs = await collection
			.find(query)
			.sort({ lastGenerated: -1, createdAt: -1 })
			.toArray();
		return docs.map(toDomain);
	}

	async getView(id: string): Promise<WebDiagramView | undefined> {
		const collection = await this.collection();
		const doc = await collection.findOne({ _id: id });
		return doc ? toDomain(doc) : undefined;
	}

	async createView(input: CreateViewInput): Promise<WebDiagramView> {
		const collection = await this.collection();
		const now = new Date().toISOString();
		const doc: ViewDocument = {
			_id: makeId(),
			repoFullName: input.repoFullName,
			branch: input.branch,
			name: input.name,
			config: input.config,
			createdAt: now,
			lastGenerated: now,
		};
		await collection.insertOne(doc);
		return toDomain(doc);
	}

	async updateView(
		id: string,
		updates: Partial<Pick<WebDiagramView, 'name' | 'config'>>
	): Promise<WebDiagramView | undefined> {
		const collection = await this.collection();
		const result = await collection.findOneAndUpdate(
			{ _id: id },
			{ $set: { ...updates, lastGenerated: new Date().toISOString() } },
			{ returnDocument: 'after' }
		);
		return result ? toDomain(result) : undefined;
	}

	async deleteView(id: string): Promise<void> {
		const collection = await this.collection();
		await collection.deleteOne({ _id: id });
	}
}
