import { PropertyInfo } from './PropertyInfo';
import { MethodInfo } from './MethodInfo';

export interface ClassInfo {
	name: string;
	filePath: string;
	properties: PropertyInfo[];
	methods: MethodInfo[];
	extends?: string;
	implements?: string[];
	isInterface?: boolean;
	isAbstract?: boolean;
	isModule?: boolean;
	classType?: 
		// Basic types
		| 'class' 
		| 'interface' 
		| 'abstract' 
		| 'module' 
		| 'enum' 
		| 'function'
		// HTTP types (HTTPParser)
		| 'route'
		// Template types (HTMLParser)
		| 'template'      // HTML/Blade/Twig template files
		// Framework types (Enrichers)
		| 'middleware'    // Next.js/Laravel middleware
		| 'layout'        // Next.js layout component
		| 'page'          // Next.js page component
		| 'server-action' // Next.js server action
		| 'controller'    // Laravel/Django controller
		| 'service'       // Service layer
		| 'repository';   // Data access layer
	changeStatus?: 'added' | 'deleted' | 'modified' | 'unchanged';
	
	// HTTP route metadata (for route nodes)
	routeMeta?: {
		path: string;        // '/api/users/:id'
		method: string;      // 'GET', 'POST', '*' (any)
		definedIn?: string;  // Source file path
	};
}
