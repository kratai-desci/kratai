export interface ClassRelationship {
	from: string;
	to: string;
	// Can be single string or array (after deduplication, same edge may have multiple types)
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
		| 'triggers'        // Django: Signal → Handler
		// ORM relationships
		| 'belongs-to'      // Django/Laravel: ForeignKey, belongsTo
		| 'has-many'        // Django/Laravel: Reverse ForeignKey, hasMany
		| 'many-to-many'    // Django/Laravel: ManyToManyField
		| 'one-to-one'      // Django/Laravel: OneToOneField
		// JPA relationships (Spring Boot)
		| 'one-to-many'     // JPA @OneToMany: User -> List<Post>
		| 'many-to-one'     // JPA @ManyToOne: Post -> User
		// Django REST Framework
		| 'serializes'      // DRF: Serializer → Model
		| 'protected-by'    // Middleware/Guard → View/Route
		// Template rendering
		| 'renders'        // View/Controller → Template file
		| string[];
	
	// Optional metadata for additional context
	metadata?: {
		[key: string]: any;
	};
}
