export interface ClassRelationship {
	from: string;
	to: string;
	type: 'extends' | 'implements' | 'uses' | 'composition' | 'calls';
}
