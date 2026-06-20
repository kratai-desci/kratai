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
	classType?: 'class' | 'interface' | 'abstract' | 'module' | 'enum';
	changeStatus?: 'added' | 'deleted' | 'modified' | 'unchanged';
}
