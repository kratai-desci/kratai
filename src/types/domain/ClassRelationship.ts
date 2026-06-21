export interface ClassRelationship {
	from: string;
	to: string;
	type: 
		// OOP relationships
		| 'extends' 
		| 'implements' 
		| 'uses' 
		| 'composition'
		// Type relationships
		| 'returns'
		| 'parameter'
		| 'generic'
		// Method calls
		| 'calls'
		| 'calls-super'
		| 'calls-static'
		| 'async-calls'
		// Factory/creation
		| 'creates'
		// Module graph
		| 'imports'
		| 're-exports'
		// Higher-order
		| 'callback'
		// HTTP relationships
		| 'http-call'    // Client calls HTTP endpoint
		| 'routes-to';   // Route maps to handler
	
	// Optional metadata for additional context
	metadata?: {
		[key: string]: any;
	};
}
