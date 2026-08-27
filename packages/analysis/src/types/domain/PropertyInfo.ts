export interface PropertyInfo {
	name: string;
	type: string;
	visibility: 'public' | 'private' | 'protected';
	isStatic?: boolean;
	isReadonly?: boolean;
	changeStatus?: 'added' | 'deleted' | 'modified' | 'unchanged';
	lineNumber?: number;
	endLineNumber?: number;
}
