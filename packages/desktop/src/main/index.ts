import type { Server } from 'http';
import * as path from 'path';
import { app, BrowserWindow, Menu, dialog, nativeImage, shell } from 'electron';
import { runView } from '@kratai/cli';
import { addRecentWorkspace, listRecentWorkspaces } from './workspaceStore.js';
import { getLayout, saveLayout } from './layoutStore.js';
import { startSignIn, handleAuthCallback, getAuthStatus, signOut, KRATAI_WEB_URL } from './auth.js';
import { generateUseCaseDiagram, generateDataModel } from './generateProxy.js';
import { chatStep } from './chatProxy.js';
import { getBalanceCents } from './balanceProxy.js';
import { getWelcomeHTML, getSignInHTML, getLoadingHTML, getGeneratePromptHTML } from './welcomeScreen.js';
import { exportRequirementsPdf } from './pdfExport.js';

const PROTOCOL = 'kratai';

// Deep links (kratai://callback?...) need a single running instance to
// hand off to - without this, a second launch attempt on Windows/Linux
// just spawns a second full process instead of routing back to the one
// the user is already looking at, and the sign-in callback would never
// reach the instance that started it.
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
	app.quit();
}

// Unpackaged (`electron .`) has no bundle name to read, so app.getName()
// defaults to "Electron" - which is what macOS shows as the bold app-menu
// label unless this is set explicitly before the menu builds.
app.setName('kratai');

// __dirname here is out/main/ (see esbuild.js banner) - copy-vendor.js puts
// the icon at out/main/assets/icon.png right next to this bundle.
const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'icon.png'));
// Reuses the already-loaded icon rather than a second fs.readFileSync - the
// welcome screen (welcomeScreen.ts) has no server behind it yet, so it
// needs this inlined as a data URI rather than an asset path.
const logoDataUrl = icon.toDataURL();

// The whole point of "wire the desktop app to the new UI": this app has no
// renderer of its own. It runs the exact same local view server `kratai
// view` runs (@kratai/cli's runView - Knowledge Graph + Class Diagram, folder
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

function focusMainWindow(): void {
	if (!mainWindow || mainWindow.isDestroyed()) return;
	if (mainWindow.isMinimized()) mainWindow.restore();
	mainWindow.focus();
}

function handleDeepLink(url: string): void {
	if (!url.startsWith(`${PROTOCOL}://`)) return;
	handleAuthCallback(url).then(result => {
		// !currentServer means we're still short of a workspace being open -
		// either on the sign-in gate itself, or the folder-picker welcome
		// screen (reachable if sign-in from a *previous* launch is still
		// valid but this particular window hasn't proceeded past it yet).
		// A sign-in while a workspace is already open (re-auth) intentionally
		// does nothing extra here - the account menu just reflects it.
		if (currentServer) return;
		if (result.status === 'success') return proceedPastSignIn();
		if (result.status === 'failure') return showSignInGate(result.message);
	}).finally(focusMainWindow);
}

function findDeepLinkArg(argv: string[]): string | undefined {
	return argv.find(arg => arg.startsWith(`${PROTOCOL}://`));
}

// macOS delivers deep links via this event, potentially before whenReady()
// resolves if the app was launched cold by clicking the link - registered
// unconditionally up front so an early delivery isn't missed.
app.on('open-url', (event, url) => {
	event.preventDefault();
	handleDeepLink(url);
});

// Windows/Linux have no open-url event - the link arrives as an argv entry,
// either on this process's own launch (handled below, after whenReady) or,
// with the single-instance lock above, via this event on the process that
// was already running when a second launch attempt was made.
app.on('second-instance', (_event, argv) => {
	const url = findDeepLinkArg(argv);
	if (url) handleDeepLink(url);
	else focusMainWindow();
});

// data: URLs, not loadFile - the welcome/loading screens are generated
// strings (welcomeScreen.ts), not files on disk, and this app never keeps
// a renderer bundle of its own (see the file-level comment above).
function loadDataHTML(html: string): Promise<void> {
	if (!mainWindow || mainWindow.isDestroyed()) return Promise.resolve();
	return mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

// Creates the one BrowserWindow this app ever shows, wiring the
// kratai-action:// link interceptor once at creation time - the welcome
// screen's "select a folder" / "open recent" links have no preload/
// contextBridge to call back through (same constraint as everywhere else
// in this app), so they navigate to a sentinel URL that never actually
// loads; this handler catches it first and turns it into a real action.
function ensureMainWindow(): BrowserWindow {
	if (mainWindow && !mainWindow.isDestroyed()) return mainWindow;
	mainWindow = new BrowserWindow({
		// >=1440 so the shell's WIDE_QUERY media query (viewShell.ts)
		// kicks in by default and shows the split view instead of behind a
		// toggle.
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
	mainWindow.webContents.on('will-navigate', (event, url) => {
		if (!url.startsWith('kratai-action://')) return;
		event.preventDefault();
		const parsed = new URL(url);
		if (parsed.hostname === 'pick-folder') {
			void promptForWorkspace();
		} else if (parsed.hostname === 'open') {
			const target = parsed.searchParams.get('path');
			if (target) void openWorkspace(target);
		} else if (parsed.hostname === 'open-dashboard') {
			void shell.openExternal(new URL('/dashboard', KRATAI_WEB_URL).toString());
		} else if (parsed.hostname === 'sign-in') {
			startSignIn();
		} else if (parsed.hostname === 'generate-now') {
			resolveGenerateChoice?.(true);
		} else if (parsed.hostname === 'skip-generate') {
			resolveGenerateChoice?.(false);
		}
	});
	return mainWindow;
}

// Resolved by the will-navigate handler above when the user clicks either
// button on getGeneratePromptHTML - see promptGenerateChoice below for why
// this indirection exists (there's no preload/contextBridge to just await
// a click handler's return value across, same constraint as every other
// sentinel-URL action in this file).
let resolveGenerateChoice: ((generate: boolean) => void) | undefined;

/**
 * Asks the user, with real project size and cost context, before spending
 * their credit on first-open auto-generation - see welcomeScreen.ts's
 * getGeneratePromptHTML doc comment for why this exists as a separate step
 * rather than just generating the moment something's missing. Wired
 * directly as runView's confirmGenerate hook (index.ts's openWorkspace),
 * so classCount/folderCount here are the real numbers from the parse that
 * just happened, not a guess made before it.
 */
function promptGenerateChoice(info: { workspaceName: string; missing: string[]; classCount: number; folderCount: number }): Promise<boolean> {
	return new Promise(resolve => {
		resolveGenerateChoice = (generate: boolean) => {
			resolveGenerateChoice = undefined;
			resolve(generate);
		};
		void getBalanceCents().then(balance => {
			void loadDataHTML(getGeneratePromptHTML(info, balance?.balanceCents ?? null));
		});
	});
}

async function showWelcomeScreen(): Promise<void> {
	ensureMainWindow();
	await loadDataHTML(getWelcomeHTML(listRecentWorkspaces(), logoDataUrl));
}

// Only ever reachable already signed in - app.whenReady() and
// handleDeepLink's post-sign-in branch are the only callers, and both only
// call this once getAuthStatus().signedIn is true.
async function proceedPastSignIn(): Promise<void> {
	const [mostRecent] = listRecentWorkspaces();
	if (mostRecent) {
		await openWorkspace(mostRecent);
	} else {
		await showWelcomeScreen();
	}
}

function showSignInGate(errorMessage?: string): void {
	ensureMainWindow();
	void loadDataHTML(getSignInHTML(logoDataUrl, errorMessage));
}

async function openWorkspace(workspacePath: string): Promise<void> {
	if (currentServer) {
		currentServer.close();
		currentServer = undefined;
	}

	ensureMainWindow();

	// Shown immediately, before the (potentially multi-second) parse below
	// - otherwise a first-run user watches the welcome screen freeze with
	// no feedback until the shell suddenly appears fully parsed. Framed
	// generically ("Building your Spec & Design...") rather than naming
	// parsing/AI steps - see welcomeScreen.ts. If confirmGenerate ends up
	// firing (signed in, something's missing), it replaces this with the
	// "generate now?" prompt; if the user agrees, onProgress then replaces
	// that with the real checklist.
	await loadDataHTML(getLoadingHTML());

	// Set only if the user actually agreed to generate (promptGenerateChoice
	// resolving true) - lets the final "done" checklist frame get a beat on
	// screen below before loadURL cuts over to the real app, without
	// delaying the common case where nothing needed generating at all.
	let didAutoGenerate = false;

	try {
		// port: 0 - let the OS pick a free port. A desktop app shouldn't
		// assume 4300 is free, e.g. if the user also has `kratai view`
		// running from a terminal at the same time.
		currentServer = await runView({
			path: workspacePath,
			port: 0,
			open: false,
			getLayout,
			saveLayout,
			startSignIn,
			getAuthStatus,
			signOut,
			generateUseCaseDiagram,
			generateDataModel,
			chat: chatStep,
			getBalance: getBalanceCents,
			confirmGenerate: async info => {
				didAutoGenerate = await promptGenerateChoice(info);
				return didAutoGenerate;
			},
			onProgress: steps => { void loadDataHTML(getLoadingHTML(steps)); },
			// port isn't known until runView resolves below, hence the `!` -
			// by the time this actually gets called (a button click, well
			// after this promise settles), currentServer is set.
			exportRequirementsPdf: () => exportRequirementsPdf(resolvedPort(currentServer!), path.basename(workspacePath))
		});
	} catch (error) {
		dialog.showErrorBox('Could not open workspace', error instanceof Error ? error.message : String(error));
		await showWelcomeScreen();
		return;
	}

	addRecentWorkspace(workspacePath);
	const url = `http://localhost:${resolvedPort(currentServer)}`;

	// Otherwise the checklist's last update (Specifications flipping to
	// done) and this navigation both fire back-to-back with nothing
	// between them - the frame never actually paints before it's replaced.
	if (didAutoGenerate) await new Promise(resolve => setTimeout(resolve, 700));

	mainWindow!.setTitle(`kratai - ${workspacePath}`);
	await mainWindow!.loadURL(url);
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

	// Registers the OS-level handler for kratai:// links. electron-builder's
	// `protocols` config (package.json) also registers this at install time
	// (Info.plist / Windows registry) - more reliable than only doing it
	// here, but this call is cheap and idempotent, so it stays as a repair
	// path for whichever platform/packaging combination needs it. Dev mode
	// (unpackaged `electron .`) needs the executable + script path spelled
	// out explicitly, or it registers the bare Electron binary instead of
	// this app.
	if (app.isPackaged) {
		app.setAsDefaultProtocolClient(PROTOCOL);
	} else if (process.argv[1]) {
		app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
	}

	buildMenu();

	// Sign-in is a mandatory gate, not an optional nudge - checked before
	// the recent-workspace fast-path below, so a returning user who signed
	// out (or never finished signing in) hits the gate again instead of
	// sailing straight into a workspace. See welcomeScreen.ts's
	// getSignInHTML for why this trades away the "explore before you
	// commit" path a deferred/optional sign-in would have kept.
	if (getAuthStatus().signedIn) {
		await proceedPastSignIn();
	} else {
		showSignInGate();
	}

	// Windows/Linux, launched fresh via a kratai:// link rather than
	// normally - macOS's open-url handler (registered above) covers the
	// equivalent cold-launch case there instead.
	const startupUrl = findDeepLinkArg(process.argv);
	if (startupUrl) handleDeepLink(startupUrl);

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			if (getAuthStatus().signedIn) {
				void promptForWorkspace();
			} else {
				showSignInGate();
			}
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
