/**
 * Mockups: draft screens of the product, kept as their own artifact beside the use cases and the data
 * model. A mockup is NOT a child of a use case: one use case spans several screens, and one screen
 * serves several use cases, so a mockup simply lists the use cases it serves (useCaseIds).
 *
 * Files in the workspace (plain, committed like the other spec files):
 *  - kratai.mockups.json   this shape: the shared look, the shared sample data, and the list of mockups
 *  - kratai.mockups/<id>.html   one self-contained page per mockup
 *  - kratai.mockups/<id>.png    a picture of it, taken when it was created, for the PDF documents
 */

export interface MockupTheme {
	/** Shown in the top bar of every mockup. */
	appName: string;
	/** Main brand colour, '#rrggbb'. Everything else (soft tints, borders) is derived from it. */
	primary: string;
	mode: 'light' | 'dark';
}

/** Example records per data-model entity name, used by every mockup so the same products, people and
 * dates appear on every screen. Values are plain scalars. */
export type SampleData = Record<string, Record<string, string | number | boolean | null>[]>;

export interface MockupItem {
	id: string;
	title: string;
	description?: string;
	/** The use cases this screen serves (ids from the Use Case Model). */
	useCaseIds: string[];
	/** Whose point of view the screen is drawn from (an actor id), when it is one actor's screen. */
	actorId?: string;
	/** Relative to the workspace, e.g. 'kratai.mockups/m1.html'. */
	file: string;
	/** Relative to the workspace; absent until the picture has been taken. */
	image?: string;
	createdAt: string;
}

export interface MockupData {
	workspaceName: string;
	theme: MockupTheme;
	sampleData?: SampleData;
	mockups: MockupItem[];
}

export const DEFAULT_MOCKUP_PRIMARY = '#2563EB';

export function defaultMockupTheme(appName: string): MockupTheme {
	return { appName, primary: DEFAULT_MOCKUP_PRIMARY, mode: 'light' };
}

export function normalizeHexColor(value: unknown, fallback = DEFAULT_MOCKUP_PRIMARY): string {
	return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value.trim().toUpperCase() : fallback;
}

const MAX_SAMPLE_ROWS = 12;
const MAX_SAMPLE_VALUE = 200;

/** Model output is untrusted: keep only entities whose value is a list of flat records of plain scalars. */
export function validateSampleData(raw: unknown): SampleData {
	if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new Error('Sample data was not a JSON object.');
	const out: SampleData = {};
	for (const [entity, rows] of Object.entries(raw as Record<string, unknown>)) {
		if (!Array.isArray(rows)) continue;
		const clean = rows.slice(0, MAX_SAMPLE_ROWS).flatMap(row => {
			if (typeof row !== 'object' || row === null || Array.isArray(row)) return [];
			const record: Record<string, string | number | boolean | null> = {};
			for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
				if (typeof value === 'string') record[key] = value.slice(0, MAX_SAMPLE_VALUE);
				else if (typeof value === 'number' || typeof value === 'boolean' || value === null) record[key] = value;
			}
			return Object.keys(record).length > 0 ? [record] : [];
		});
		if (clean.length > 0) out[entity.slice(0, 80)] = clean;
	}
	if (Object.keys(out).length === 0) throw new Error('Sample data had no usable records.');
	return out;
}

/** Validates a mockups file read from disk: drops malformed items instead of failing the whole file. */
export function parseMockupData(raw: unknown, workspaceName: string): MockupData {
	const obj = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {};
	const themeRaw = typeof obj.theme === 'object' && obj.theme !== null ? obj.theme as Record<string, unknown> : {};
	const theme: MockupTheme = {
		appName: typeof themeRaw.appName === 'string' && themeRaw.appName.trim() ? themeRaw.appName.trim().slice(0, 60) : workspaceName,
		primary: normalizeHexColor(themeRaw.primary),
		mode: themeRaw.mode === 'dark' ? 'dark' : 'light'
	};
	let sampleData: SampleData | undefined;
	try { sampleData = obj.sampleData ? validateSampleData(obj.sampleData) : undefined; } catch { sampleData = undefined; }
	const seen = new Set<string>();
	const mockups: MockupItem[] = (Array.isArray(obj.mockups) ? obj.mockups : []).flatMap((entry): MockupItem[] => {
		if (typeof entry !== 'object' || entry === null) return [];
		const e = entry as Record<string, unknown>;
		if (typeof e.id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,40}$/.test(e.id) || seen.has(e.id)) return [];
		if (typeof e.title !== 'string' || !e.title.trim() || typeof e.file !== 'string') return [];
		seen.add(e.id);
		return [{
			id: e.id,
			title: e.title.trim().slice(0, 120),
			...(typeof e.description === 'string' && e.description.trim() ? { description: e.description.trim().slice(0, 400) } : {}),
			useCaseIds: Array.isArray(e.useCaseIds) ? e.useCaseIds.filter((x): x is string => typeof x === 'string') : [],
			...(typeof e.actorId === 'string' && e.actorId ? { actorId: e.actorId } : {}),
			file: e.file,
			...(typeof e.image === 'string' && e.image ? { image: e.image } : {}),
			createdAt: typeof e.createdAt === 'string' ? e.createdAt : new Date(0).toISOString()
		}];
	});
	return { workspaceName, theme, ...(sampleData ? { sampleData } : {}), mockups };
}
