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
		| 'routes-to'    // Route maps to handler
		// Framework-specific relationships (added by enrichers)
		| 'server-action'   // Next.js: Form component → Server action
		| 'middleware'      // Next.js/Laravel: Middleware → Protected route
		| 'data-fetching'   // Next.js: Data fetching function → Page component
		| 'layout-wraps'    // Next.js: Layout → Nested page/layout
		| 'injects'         // Laravel/Django: DI container → Service
		| 'observes'        // Laravel: Observer → Model
		| 'triggers';       // Django: Signal → Handler
	
	// Optional metadata for additional context
	metadata?: {
		[key: string]: any;
	};
}
