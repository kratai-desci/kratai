import { exec } from 'child_process';

export function openFile(filePath: string): Promise<void> {
	const command = process.platform === 'darwin'
		? `open "${filePath}"`
		: process.platform === 'win32'
			? `start "" "${filePath}"`
			: `xdg-open "${filePath}"`;

	return new Promise((resolve) => {
		exec(command, (error) => {
			if (error) {
				console.warn(`Could not open the file automatically: ${error.message}`);
			}
			resolve();
		});
	});
}
