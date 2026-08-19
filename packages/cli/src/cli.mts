#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { runAnalyze } from './commands/analyze.js';
import { runInit, InitTarget } from './commands/init.js';

const VERSION = '0.1.0';

function printHelp(): void {
	console.log(`kratai - architecture diagrams from your codebase, no VS Code needed

Usage:
  kratai analyze [path] [options]
  kratai init [path] [options]

analyze - generate a diagram (HTML for a browser, or Markdown for an AI agent)
  -o, --output <file>    Output file (default: ./kratai-diagram.<format>)
  -c, --config <file>    Path to a kratai.config.json (default: <path>/kratai.config.json if present)
      --name <string>    Diagram title (default: folder name)
      --folders <a,b,c>  Only include these folders (comma-separated, overrides config)
      --format <fmt>     "html" (interactive, for a browser) or "md" (for feeding to an AI agent/file) - default: html
      --no-git-diff      Disable git diff highlighting
      --open             Open the generated file in your default app

init - wire kratai's MCP server + skill into an AI coding agent
      --target <t>       "claude", "cursor", "opencode", or "all" - default: all
                          Always also writes/merges AGENTS.md (read by Cursor/Codex,
                          used as a fallback by OpenCode/Claude Code)

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
				format: { type: 'string', default: 'html' },
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

		if (values.format !== 'html' && values.format !== 'md') {
			console.error(`Invalid --format "${values.format}" - expected "html" or "md".\n`);
			process.exitCode = 1;
			return;
		}

		await runAnalyze({
			path: positionals[0] || process.cwd(),
			output: values.output,
			configPath: values.config,
			name: values.name,
			folders: values.folders,
			format: values.format,
			gitDiff: !values['no-git-diff'],
			open: Boolean(values.open)
		});
		return;
	}

	if (command === 'init') {
		const { values, positionals } = parseArgs({
			args: rest,
			options: {
				target: { type: 'string', default: 'all' },
				help: { type: 'boolean', short: 'h' }
			},
			allowPositionals: true
		});

		if (values.help) {
			printHelp();
			return;
		}

		const validTargets: InitTarget[] = ['claude', 'cursor', 'opencode', 'all'];
		if (!validTargets.includes(values.target as InitTarget)) {
			console.error(`Invalid --target "${values.target}" - expected one of ${validTargets.join(', ')}.\n`);
			process.exitCode = 1;
			return;
		}

		runInit({
			path: positionals[0] || process.cwd(),
			target: values.target as InitTarget
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
