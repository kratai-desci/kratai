import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { openFile } from '../openFile.js';

export interface ViewOptions {
	path: string;
	port: number;
	open: boolean;
}

export async function runView(options: ViewOptions): Promise<void> {
	const workspacePath = path.resolve(options.path);

	if (!fs.existsSync(workspacePath)) {
		throw new Error(`Path not found: ${workspacePath}`);
	}

	const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>kratai view</title></head>
<body style="font-family: system-ui, sans-serif; padding: 2rem;">
	<p>Target folder to parse: <code>${workspacePath}</code></p>
</body>
</html>`;

	const server = http.createServer((_req, res) => {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.end(html);
	});

	await new Promise<void>((resolve) => server.listen(options.port, resolve));

	const url = `http://localhost:${options.port}`;
	console.log(`kratai view running at ${url} (Ctrl+C to stop)`);

	if (options.open) {
		await openFile(url);
	}
}
