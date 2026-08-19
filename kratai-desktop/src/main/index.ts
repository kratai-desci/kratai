import * as path from 'path';
import { app, BrowserWindow } from 'electron';
import { registerIpcHandlers } from './ipc';

function createWindow(): void {
	const win = new BrowserWindow({
		width: 1400,
		height: 900,
		title: 'kratai',
		webPreferences: {
			preload: path.join(__dirname, '../preload/index.js'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false
		}
	});

	win.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(() => {
	registerIpcHandlers();
	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
