import * as fs from 'fs';
import * as path from 'path';
import { AbstractParserStrategy } from './AbstractParserStrategy';
import { ClassInfo, ClassRelationship } from '../../../types/domain';

/**
 * HTML parser for template files
 * 
 * Simple parser that creates one ClassInfo node per template file.
 * Does NOT parse template syntax (Django, Blade, Twig, etc.)
 * Framework enrichers handle template relationships.
 * 
 * Supports:
 * - .html (standard HTML, Django, Jinja2, Flask)
 * - .htm (alternative HTML extension)
 * - .blade.php (Laravel Blade - detected by file extension in factory)
 * - .html.twig (Symfony Twig - detected by file extension in factory)
 */
export class HTMLParser extends AbstractParserStrategy {
	supportedExtensions = ['.html', '.htm'];

	/**
	 * Parse an HTML template file
	 * Creates a single ClassInfo node representing the template
	 * 
	 * @param filePath - Absolute path to the HTML file
	 * @returns Array with one ClassInfo node (or empty if file doesn't exist)
	 */
	parseFile(filePath: string): ClassInfo[] {
		// Verify file exists
		if (!fs.existsSync(filePath)) {
			return [];
		}

		// Extract filename from path
		const fileName = path.basename(filePath);

		// Create a ClassInfo node for the template
		const templateNode: ClassInfo = {
			name: fileName,
			filePath: filePath, // Will be normalized to workspace-relative by CodeParserService
			classType: 'template',
			properties: [],
			methods: [],
			isAbstract: false,
		};

		return [templateNode];
	}

	/**
	 * Extract relationships between templates
	 * 
	 * HTMLParser does NOT parse template content or create relationships.
	 * Framework enrichers (Django, Laravel, Flask) handle:
	 * - View → Template relationships (render() calls)
	 * - Template inheritance (extends, includes)
	 * 
	 * @returns Empty array (no relationships from file parsing)
	 */
	extractRelationships(
		classes: ClassInfo[],
		allClassNames: Set<string>,
		workspacePath: string
	): ClassRelationship[] {
		// No relationships extracted from HTML files
		// Framework enrichers handle template relationships
		return [];
	}

	/**
	 * Parse method compatible with test interface
	 * Wraps parseFile() for test compatibility
	 */
	async parse(filePath: string, workspacePath: string): Promise<{ classes: ClassInfo[]; relationships: ClassRelationship[] }> {
		const classes = this.parseFile(filePath);
		const relationships = this.extractRelationships(classes, new Set(), workspacePath);
		
		// Normalize file paths to workspace-relative
		classes.forEach(classInfo => {
			classInfo.filePath = path.relative(workspacePath, classInfo.filePath);
		});

		return { classes, relationships };
	}
}
