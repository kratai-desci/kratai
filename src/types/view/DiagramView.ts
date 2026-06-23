import { KrataiConfig } from '../config';

export interface DiagramView {
	id: string;              // Unique identifier (slugified name)
	name: string;            // Display name ("API Routes", "Domain Model")
	config: KrataiConfig;    // The actual diagram configuration
	createdAt: string;       // ISO timestamp
	lastGenerated?: string;  // Last time diagram was generated
}

export interface DiagramViewRegistry {
	views: DiagramView[];
}
