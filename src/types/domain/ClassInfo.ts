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
	classType?: 'class' | 'interface' | 'abstract' | 'module' | 'enum' | 'route';
	changeStatus?: 'added' | 'deleted' | 'modified' | 'unchanged';
	
	// HTTP route metadata (for route nodes)
	routeMeta?: {
		path: string;        // '/api/users/:id'
		method: string;      // 'GET', 'POST', '*' (any)
		definedIn?: string;  // Source file path
	};
}
