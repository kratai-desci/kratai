import { ClassInfo, ClassRelationship } from '../../../types/diagram';

export interface IParserStrategy {
	/** File extensions this parser handles (e.g. ['.ts', '.tsx']) */
	supportedExtensions: string[];

	/** Parse a single file and return all class/interface/module info found */
	parseFile(filePath: string): ClassInfo[];

	/** Extract relationships (extends, implements, uses) from a list of parsed classes */
	extractRelationships(classes: ClassInfo[], allClassNames: Set<string>, workspacePath: string): ClassRelationship[];
}
