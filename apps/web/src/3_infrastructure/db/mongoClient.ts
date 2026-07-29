import 'server-only';

import { MongoClient } from 'mongodb';

export function isMongoConfigured(): boolean {
	return Boolean(process.env.MONGODB_URI);
}

// Cached across Next.js dev-mode HMR reloads via `global` - without this, a
// fresh module instance on every hot reload would open a brand new
// MongoClient (and connection pool) each time, eventually exhausting
// Atlas's connection limit. Standard pattern for MongoDB + Next.js.
declare global {
	var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | undefined;

function connect(): Promise<MongoClient> {
	const uri = process.env.MONGODB_URI;
	if (!uri) {
		throw new Error('MONGODB_URI is not set');
	}
	return new MongoClient(uri).connect();
}

export function getMongoClient(): Promise<MongoClient> {
	if (process.env.NODE_ENV === 'development') {
		if (!global._mongoClientPromise) {
			global._mongoClientPromise = connect();
		}
		return global._mongoClientPromise;
	}

	if (!clientPromise) {
		clientPromise = connect();
	}
	return clientPromise;
}

export async function getDb() {
	const client = await getMongoClient();
	return process.env.MONGODB_DB_NAME ? client.db(process.env.MONGODB_DB_NAME) : client.db();
}
