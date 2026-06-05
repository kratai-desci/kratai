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

export interface PropertyInfo {
	name: string;
	type: string;
	visibility: 'public' | 'private' | 'protected';
	isStatic?: boolean;
	isReadonly?: boolean;
	changeStatus?: 'added' | 'deleted' | 'modified' | 'unchanged';
	lineNumber?: number;
}

export interface MethodInfo {
	name: string;
	parameters: ParameterInfo[];
	returnType: string;
	visibility: 'public' | 'private' | 'protected';
	isStatic?: boolean;
	isAsync?: boolean;
	changeStatus?: 'added' | 'deleted' | 'modified' | 'unchanged';
	lineNumber?: number;
}

export interface ParameterInfo {
	name: string;
	type: string;
	optional?: boolean;
}

export interface ClassRelationship {
	from: string;
	to: string;
	type: 'extends' | 'implements' | 'uses' | 'composition';
}

export interface DiagramData {
	classes: ClassInfo[];
	relationships: ClassRelationship[];
}

export interface ReactFlowNode {
	id: string;
	type: string;
	position: { x: number; y: number };
	data: {
		label: string;
		classInfo: ClassInfo;
	};
}

export interface ReactFlowEdge {
	id: string;
	source: string;
	target: string;
	type: string;
	label?: string;
	animated?: boolean;
	style?: Record<string, any>;
}
