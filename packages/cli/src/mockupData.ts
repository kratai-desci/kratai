import * as fs from 'fs';
import * as path from 'path';
import { MockupData, MockupItem, MockupTheme, parseMockupData, defaultMockupTheme, buildMockupPage, UseCaseDiagramData } from '@kratai-desci/llm';

export type { MockupData, MockupItem, MockupTheme } from '@kratai-desci/llm';

const DATA_FILE = 'kratai.mockups.json';
export const MOCKUP_DIR = 'kratai.mockups';

/**
 * Mockups live in the workspace next to the other spec files, as plain files that are committed with the
 * code: kratai.mockups.json (the list, the shared theme and the shared sample data) and one self-contained
 * page per mockup in kratai.mockups/ (plus a picture of it for the PDF documents). See mockupSchema.ts in
 * @kratai-desci/llm for the shape.
 */
export function loadMockupData(workspacePath: string, workspaceName: string): MockupData | undefined {
	const filePath = path.join(workspacePath, DATA_FILE);
	if (!fs.existsSync(filePath)) return undefined;
	try {
		return parseMockupData(JSON.parse(fs.readFileSync(filePath, 'utf-8')), workspaceName);
	} catch (error) {
		console.error('Error loading mockups:', error);
		return undefined;
	}
}

export function saveMockupData(workspacePath: string, data: MockupData): void {
	fs.writeFileSync(path.join(workspacePath, DATA_FILE), JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export function emptyMockupData(workspaceName: string, appName: string): MockupData {
	return { workspaceName, theme: defaultMockupTheme(appName), mockups: [] };
}

/** "m1", "m2", ...: the next id that is not taken (ids are stable, so deleting m2 never renames m3). */
export function nextMockupId(existing: MockupItem[]): string {
	const taken = new Set(existing.map(m => m.id));
	let n = existing.length + 1;
	while (taken.has(`m${n}`)) n++;
	return `m${n}`;
}

const pagePath = (workspacePath: string, id: string) => path.join(workspacePath, MOCKUP_DIR, `${id}.html`);
export const mockupImagePath = (workspacePath: string, id: string) => path.join(workspacePath, MOCKUP_DIR, `${id}.png`);
const MOCKUP_ID = /^[a-z0-9][a-z0-9-]{0,40}$/;
export const isMockupId = (id: unknown): id is string => typeof id === 'string' && MOCKUP_ID.test(id);

/** The content a mockup page holds between its frame's <main> tags - what the model wrote, already cleaned. */
export function extractMockupBody(page: string): string {
	const open = page.indexOf('<main class="mk-main">');
	const close = page.lastIndexOf('</main>');
	if (open === -1 || close === -1 || close < open) return '';
	return page.slice(open + '<main class="mk-main">'.length, close).trim();
}

/** The menu on a mockup: the use cases of the actor whose screen it is, each linking to a mockup that serves it. */
function buildNav(spec: UseCaseDiagramData, data: MockupData, mockup: MockupItem) {
	const actor = mockup.actorId ? spec.actors.find(a => a.id === mockup.actorId) : undefined;
	if (!actor) return { actor, nav: [] as { label: string; href?: string; active?: boolean }[] };
	const own = spec.associations.filter(a => a.actorId === actor.id).map(a => spec.useCases.find(u => u.id === a.useCaseId)).filter((u): u is NonNullable<typeof u> => !!u);
	const nav = own.map(u => {
		const target = data.mockups.find(m => m.useCaseIds.includes(u.id));
		return { label: u.name.replace(/\n/g, ' '), href: target ? `${target.id}.html` : undefined, active: mockup.useCaseIds.includes(u.id) };
	});
	return { actor, nav };
}

/** Writes (or rewrites) one mockup's page. `body` is the content; the frame, theme and menu are rebuilt from the data. */
export function writeMockupPage(workspacePath: string, spec: UseCaseDiagramData, data: MockupData, mockup: MockupItem, body: string): void {
	const known = new Set(data.mockups.map(m => m.id));
	// "#m:ID" links (the form the model writes) and links to mockups that no longer exist
	const links = body
		.replace(/href="#m:([a-z0-9-]+)"/gi, (_x, id: string) => known.has(id) ? `href="${id}.html"` : 'href="#"')
		.replace(/href="([a-z0-9-]+)\.html"/gi, (_x, id: string) => known.has(id) ? `href="${id}.html"` : 'href="#"');
	const { actor, nav } = buildNav(spec, data, mockup);
	const bare = mockup.useCaseIds.length > 0 && mockup.useCaseIds.every(id => /log\s?-?in|sign\s?-?in/i.test(spec.useCases.find(u => u.id === id)?.name ?? ''));
	const html = buildMockupPage({
		title: mockup.title, theme: data.theme, actorLabel: actor ? actor.name.replace(/\n/g, ' ') : undefined,
		navTitle: actor ? `${actor.name.replace(/\n/g, ' ')} menu` : 'Menu', nav, bodyHtml: links, bare
	});
	fs.mkdirSync(path.join(workspacePath, MOCKUP_DIR), { recursive: true });
	fs.writeFileSync(pagePath(workspacePath, mockup.id), html, 'utf-8');
}

/** Rebuilds every page from its stored content: after a theme change, a delete, a use case rename, a new mockup to link to. */
export function rebuildMockupPages(workspacePath: string, spec: UseCaseDiagramData, data: MockupData): void {
	for (const mockup of data.mockups) {
		const file = pagePath(workspacePath, mockup.id);
		if (!fs.existsSync(file)) continue;
		writeMockupPage(workspacePath, spec, data, mockup, extractMockupBody(fs.readFileSync(file, 'utf-8')));
	}
}

export function readMockupFile(workspacePath: string, id: string, kind: 'html' | 'png'): Buffer | undefined {
	if (!isMockupId(id)) return undefined;
	const file = path.join(workspacePath, MOCKUP_DIR, `${id}.${kind}`);
	return fs.existsSync(file) ? fs.readFileSync(file) : undefined;
}

export function deleteMockupFiles(workspacePath: string, id: string): void {
	if (!isMockupId(id)) return;
	for (const ext of ['html', 'png']) {
		const file = path.join(workspacePath, MOCKUP_DIR, `${id}.${ext}`);
		if (fs.existsSync(file)) fs.unlinkSync(file);
	}
}

export function updateMockupTheme(data: MockupData, patch: Partial<MockupTheme>): MockupData {
	const next = { ...data.theme, ...(patch.primary ? { primary: patch.primary } : {}), ...(patch.mode ? { mode: patch.mode } : {}), ...(patch.appName ? { appName: patch.appName } : {}) };
	return { ...data, theme: next };
}
