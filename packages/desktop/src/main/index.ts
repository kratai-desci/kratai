import type { Server } from 'http';
import * as path from 'path';
import { app, BrowserWindow, Menu, dialog, nativeImage } from 'electron';
import { runView } from '@kratai/cli';
import { addRecentWorkspace, listRecentWorkspaces } from './workspaceStore.js';

// Unpackaged (`electron .`) has no bundle name to read, so app.getName()
// defaults to "Electron" - which is what macOS shows as the bold app-menu
// label unless this is set explicitly before the menu builds.
app.setName('kratai');

// __dirname here is out/main/ (see esbuild.js banner) - copy-vendor.js puts
// the icon at out/main/assets/icon.png right next to this bundle.
const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'icon.png'));

// The whole point of "wire the desktop app to the new UI": this app has no
// renderer of its own. It runs the exact same local view server `kratai
// view` runs (@kratai/cli's runView - Stack Layer + Class Diagram, folder
// panel, git-diff highlighting, refresh, download-md, all of it) and points
// a native BrowserWindow at it instead of the system browser. One source of
// truth for the UI; this app is a window around it, not a second copy.

let mainWindow: BrowserWindow | undefined;
let currentServer: Server | undefined;

function resolvedPort(server: Server): number {
	const address = server.address();
	if (!address || typeof address === 'string') {
		throw new Error('View server did not bind to a TCP port as expected.');
	}
	return address.port;
}

async function openWorkspace(workspacePath: string): Promise<void> {
	if (currentServer) {
		currentServer.close();
		currentServer = undefined;
	}

	try {
		// port: 0 - let the OS pick a free port. A desktop app shouldn't
		// assume 4300 is free, e.g. if the user also has `kratai view`
		// running from a terminal at the same time.
		currentServer = await runView({ path: workspacePath, port: 0, open: false });
	} catch (error) {
		dialog.showErrorBox('Could not open workspace', error instanceof Error ? error.message : String(error));
		return;
	}

	addRecentWorkspace(workspacePath);
	const url = `http://localhost:${resolvedPort(currentServer)}`;

	if (!mainWindow || mainWindow.isDestroyed()) {
		mainWindow = new BrowserWindow({
			// >=1440 so the shell's WIDE_QUERY media query (viewShell.ts)
			// kicks in by default and shows Stack Layer + Class Diagram
			// side-by-side instead of behind a toggle.
			width: 1500,
			height: 900,
			icon,
			title: 'kratai',
			// Explicit even though these match Electron's current defaults -
			// this window loads content over the network (localhost, but
			// still HTTP), worth stating the isolation intentionally rather
			// than relying on defaults silently doing the right thing.
			webPreferences: {
				contextIsolation: true,
				nodeIntegration: false,
				sandbox: true
			}
		});
	}
	mainWindow.setTitle(`kratai - ${workspacePath}`);
	await mainWindow.loadURL(url);
}

async function promptForWorkspace(): Promise<void> {
	const result = await dialog.showOpenDialog({
		properties: ['openDirectory'],
		title: 'Open a project for kratai to analyze'
	});
	if (result.canceled || result.filePaths.length === 0) return;
	await openWorkspace(result.filePaths[0]);
}

function buildMenu(): void {
	Menu.setApplicationMenu(Menu.buildFromTemplate([
		{
			label: 'File',
			submenu: [
				{ label: 'Open Folder...', accelerator: 'CmdOrCtrl+O', click: () => void promptForWorkspace() },
				{ type: 'separator' },
				{ role: 'quit' }
			]
		},
		{
			label: 'View',
			submenu: [
				{ role: 'reload' },
				{ role: 'toggleDevTools' }
			]
		}
	]));
}

app.whenReady().then(async () => {
	// BrowserWindow's `icon` option only affects Windows/Linux taskbars -
	// macOS reads the Dock icon separately, and only app.dock exists there.
	if (process.platform === 'darwin') {
		app.dock?.setIcon(icon);
	}

	buildMenu();

	const [mostRecent] = listRecentWorkspaces();
	if (mostRecent) {
		await openWorkspace(mostRecent);
	} else {
		await promptForWorkspace();
	}

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			void promptForWorkspace();
		}
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('before-quit', () => {
	currentServer?.close();
});
