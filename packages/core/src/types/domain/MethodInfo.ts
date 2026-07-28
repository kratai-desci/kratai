import { ParameterInfo } from './ParameterInfo';

export interface MethodInfo {
	name: string;
	parameters: ParameterInfo[];
	returnType: string;
	visibility: 'public' | 'private' | 'protected';
	isStatic?: boolean;
	isAsync?: boolean;
	changeStatus?: 'added' | 'deleted' | 'modified' | 'unchanged';
	lineNumber?: number;
	endLineNumber?: number;
	hasInternalCalls?: boolean; // Pre-computed: true if method calls other methods
}
