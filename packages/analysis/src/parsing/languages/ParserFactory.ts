import * as path from 'path';
import { AbstractParserStrategy } from './AbstractParserStrategy';
import { TypeScriptParser } from './TypeScriptParser';
import { JavaScriptParser } from './JavaScriptParser';
import { PythonParser } from './PythonParser';
import { PHPParser } from './PHPParser';
import { JavaParser } from './JavaParser';
import { HTMLParser } from './HTMLParser';
import { HTTPParser } from './HTTPParser';

export class ParserFactory {
	private parsers: Map<string, AbstractParserStrategy> = new Map();
	private httpParser: HTTPParser;

	constructor() {
		this.register(new TypeScriptParser());
		this.register(new JavaScriptParser());
		this.register(new PythonParser());
		this.register(new JavaParser());
		this.register(new PHPParser());
		this.register(new HTMLParser());
		
		// HTTPParser is special - it's a second-pass cross-language parser
		this.httpParser = new HTTPParser();
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

	/**
	 * Get the HTTP parser for second-pass analysis
	 * This parser runs AFTER language parsers to detect HTTP patterns
	 */
	getHttpParser(): HTTPParser {
		return this.httpParser;
	}

	getSupportedExtensions(): string[] {
		return Array.from(this.parsers.keys());
	}
}
