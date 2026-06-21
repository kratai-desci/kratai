import { ClassInfo, ClassRelationship } from '../../../types/domain';

/**
 * Abstract base class for all language parsers.
 * Provides shared utilities for relationship ID generation and relationship creation.
 */
export abstract class AbstractParserStrategy {
	/**
	 * File extensions supported by this parser (e.g., ['.ts', '.tsx'])
	 */
	abstract supportedExtensions: string[];

	/**
	 * Parse a single file and extract class/interface/function information
	 */
	abstract parseFile(filePath: string): ClassInfo[];

	/**
	 * Extract relationships between classes across all parsed files
	 */
	abstract extractRelationships(
		classes: ClassInfo[],
		allClassNames: Set<string>,
		workspacePath: string
	): ClassRelationship[];

	/**
	 * Generate a unique ID for a class using the format: filePath__className
	 * This format prevents ambiguity when multiple files have classes with the same name.
	 * 
	 * @example
	 * createClassId({ filePath: '/path/to/User.ts', name: 'User' })
	 * // Returns: '/path/to/User.ts__User'
	 */
	protected createClassId(classInfo: ClassInfo): string {
		return `${classInfo.filePath}__${classInfo.name}`;
	}

	/**
	 * Create relationships from a source class to all target classes with a given name.
	 * Handles cases where multiple classes have the same name (in different files).
	 * 
	 * @param fromInfo - Source class information
	 * @param targetName - Name of the target class(es) to create relationships to
	 * @param classMap - Map of class names to all ClassInfo instances with that name
	 * @param type - Type of relationship (extends, implements, composition, etc.)
	 * @param filter - Optional filter to apply to target classes
	 * 
	 * @example
	 * // Create 'extends' relationships to all BaseService classes
	 * relationships.push(...this.createRelationshipsToTargets(
	 *   classInfo, 'BaseService', classMap, 'extends'
	 * ));
	 * 
	 * @example
	 * // Create 'calls' relationships only to module targets
	 * relationships.push(...this.createRelationshipsToTargets(
	 *   classInfo, 'validateUser', classMap, 'calls', 
	 *   (target) => target.isModule === true
	 * ));
	 */
	protected createRelationshipsToTargets(
		fromInfo: ClassInfo,
		targetName: string,
		classMap: Map<string, ClassInfo[]>,
		type: ClassRelationship['type'],
		filter?: (target: ClassInfo) => boolean
	): ClassRelationship[] {
		const fromId = this.createClassId(fromInfo);
		const targets = classMap.get(targetName) || [];
		const filtered = filter ? targets.filter(filter) : targets;

		return filtered.map(target => ({
			from: fromId,
			to: this.createClassId(target),
			type
		}));
	}
}
