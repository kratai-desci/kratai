import { ClassInfo } from '../domain';

export interface ReactFlowNode {
	id: string;
	type: string;
	position: { x: number; y: number };
	data: {
		label: string;
		classInfo: ClassInfo;
	};
}
