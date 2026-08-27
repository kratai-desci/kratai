import { ClassInfo } from './ClassInfo';
import { ClassRelationship } from './ClassRelationship';

export interface DiagramData {
	classes: ClassInfo[];
	relationships: ClassRelationship[];
}
