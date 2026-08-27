#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { runAnalyze } from './commands/analyze.js';
import { runView } from './commands/view.js';

const VERSION = '0.1.0';

function printHelp(): void {
	console.log(`kratai - architecture diagrams from your codebase, no VS Code needed

Usage:
  kratai analyze [path] [options]
  kratai view [path] [options]

analyze - generate a Markdown architecture summary
  -o, --output <file>    Output file (default: ./kratai-diagram.md)
  -c, --config <file>    Path to a kratai.config.json (default: <path>/kratai.config.json if present)
      --name <string>    Diagram title (default: folder name)
      --folders <a,b,c>  Only include these folders (comma-separated, overrides config)
      --no-git-diff      Disable git diff highlighting
      --open             Open the generated file in your default app

view - run a local web app to explore the architecture (also the engine
       behind the kratai desktop app)
  -p, --port <number>    Port to listen on (default: 4300)
      --open              Open the page in your default browser

  -h, --help              Show this help
  -v, --version           Show version
`);
}

async function main(): Promise<void> {
	const [command, ...rest] = process.argv.slice(2);

	if (!command || command === '-h' || command === '--help') {
		printHelp();
		return;
	}

	if (command === '-v' || command === '--version') {
		console.log(VERSION);
		return;
	}

	if (command === 'analyze') {
		const { values, positionals } = parseArgs({
			args: rest,
			options: {
				output: { type: 'string', short: 'o' },
				config: { type: 'string', short: 'c' },
				name: { type: 'string' },
				folders: { type: 'string' },
				'no-git-diff': { type: 'boolean', default: false },
				open: { type: 'boolean', default: false },
				help: { type: 'boolean', short: 'h' }
			},
			allowPositionals: true
		});

		if (values.help) {
			printHelp();
			return;
		}

		await runAnalyze({
			path: positionals[0] || process.cwd(),
			output: values.output,
			configPath: values.config,
			name: values.name,
			folders: values.folders,
			gitDiff: !values['no-git-diff'],
			open: Boolean(values.open)
		});
		return;
	}

	if (command === 'view') {
		const { values, positionals } = parseArgs({
			args: rest,
			options: {
				port: { type: 'string', short: 'p', default: '4300' },
				open: { type: 'boolean', default: false },
				help: { type: 'boolean', short: 'h' }
			},
			allowPositionals: true
		});

		if (values.help) {
			printHelp();
			return;
		}

		await runView({
			path: positionals[0] || process.cwd(),
			port: Number(values.port),
			open: Boolean(values.open)
		});
		return;
	}

	console.error(`Unknown command: ${command}\n`);
	printHelp();
	process.exitCode = 1;
}

main().catch((error) => {
	console.error(`Error: ${error instanceof Error ? error.message : error}`);
	process.exitCode = 1;
});
