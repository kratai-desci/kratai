import * as path from 'path';
import { AbstractParserStrategy } from './AbstractParserStrategy';
import { TypeScriptParser } from './TypeScriptParser';
import { JavaScriptParser } from './JavaScriptParser';
import { PythonParser } from './PythonParser';
import { PHPParser } from './PHPParser';

export class ParserFactory {
	private parsers: Map<string, AbstractParserStrategy> = new Map();

	constructor() {
		this.register(new TypeScriptParser());
		this.register(new JavaScriptParser());
		this.register(new PythonParser());
		this.register(new PHPParser());
	}

	private register(parser: AbstractParserStrategy): void {
		for (const ext of parser.supportedExtensions) {
			this.parsers.set(ext, parser);
		}
	}

	getParser(filePath: string): AbstractParserStrategy | undefined {
		const ext = path.extname(filePath).toLowerCase();
		return this.parsers.get(ext);
	}

	getSupportedExtensions(): string[] {
		return Array.from(this.parsers.keys());
	}
}
