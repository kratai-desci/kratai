import type { LlmClient, LlmUsage } from './llmClient.js';
import { LlmError } from './llmClient.js';
import type { UseCaseActor, UseCaseItem, UseCaseNFR } from './useCaseSchema.js';
import type { DataEntity } from './dataModelSchema.js';
import { parseJson } from './useCaseExtraction.js';
import { MOCKUP_KIT_REFERENCE } from './mockupKit.js';
import { validateSampleData, type MockupTheme, type SampleData } from './mockupSchema.js';

/** Everything the model needs to know about the project - the same for every mockup, so screens agree. */
export interface MockupContext {
	systemName: string;
	overview?: string;
	actors: UseCaseActor[];
	useCases: UseCaseItem[];
	/** actorId -> use case ids, so the model knows who does what. */
	associations: { actorId: string; useCaseId: string }[];
	nfrs: UseCaseNFR[];
	entities: DataEntity[];
	sampleData?: SampleData;
	/** Mockups that already exist, so a new one stays consistent with them and can link to them. */
	existingMockups: { id: string; title: string; useCaseIds: string[] }[];
}

export interface MockupRequest {
	/** The use cases this screen serves. */
	useCaseIds: string[];
	/** What the user asked for, in their own words ("the checkout page", "show the pharmacist's approval queue"). */
	instruction?: string;
	actorId?: string;
}

export interface MockupScreen {
	title: string;
	description: string;
	actorId?: string;
	/** The page content (inside <main>), sanitized. */
	bodyHtml: string;
}

const line = (s: string | undefined) => (s || '').replace(/\s+/g, ' ').trim();

function describeUseCase(uc: UseCaseItem, number: number, actorsFor: string[], full: boolean): string {
	const head = `UC-${number} ${line(uc.name)}${actorsFor.length ? ` (actors: ${actorsFor.join(', ')})` : ''}${uc.description ? ` - ${line(uc.description)}` : ''}`;
	if (!full) return head;
	const parts = [head];
	if (uc.goal) parts.push(`   Goal: ${line(uc.goal)}`);
	if (uc.preconditions?.length) parts.push(`   Before: ${uc.preconditions.map(line).join('; ')}`);
	if (uc.mainFlow?.length) parts.push(`   Main flow:\n${uc.mainFlow.map((s, i) => `     ${i + 1}. ${line(s)}`).join('\n')}`);
	if (uc.postconditions?.length) parts.push(`   After: ${uc.postconditions.map(line).join('; ')}`);
	return parts.join('\n');
}

export function buildMockupPrompt(ctx: MockupContext, req: MockupRequest, theme: MockupTheme): string {
	const number = new Map(ctx.useCases.map((u, i) => [u.id, i + 1]));
	const actorName = new Map(ctx.actors.map(a => [a.id, line(a.name)]));
	const actorsOf = (ucId: string) => ctx.associations.filter(a => a.useCaseId === ucId).map(a => actorName.get(a.actorId)).filter((n): n is string => !!n);
	const targets = req.useCaseIds.map(id => ctx.useCases.find(u => u.id === id)).filter((u): u is UseCaseItem => !!u);
	const targetIds = new Set(targets.map(t => t.id));
	const others = ctx.useCases.filter(u => !targetIds.has(u.id));
	const relevantNfrs = ctx.nfrs.filter(n => n.useCaseId === null || targetIds.has(n.useCaseId));
	const actor = req.actorId ? ctx.actors.find(a => a.id === req.actorId) : undefined;

	const entities = ctx.entities.map(e => `- ${e.name}: ${e.attributes.map(a => `${a.name} (${a.type}${a.isPK ? ', key' : ''}${a.isFK ? ', ref' : ''})`).join(', ')}`).join('\n');
	const existing = ctx.existingMockups.length
		? ctx.existingMockups.map(m => `- id "${m.id}": ${m.title}`).join('\n')
		: '(none yet)';

	const today = new Date().toISOString().slice(0, 10);
	return `You are designing ONE screen of a software product as a draft mockup, for people who will look at it to understand and agree what the product does. It must look like a real, finished product, and it must look like the same product as every other screen of this project.

TODAY'S DATE: ${today}. Any date shown must be around today (the current week or month), never in a past year.

PRODUCT
${ctx.systemName}${ctx.overview ? ` - ${line(ctx.overview)}` : ''}
Look: brand colour ${theme.primary}, ${theme.mode} mode, app name "${theme.appName}". The page frame (top bar and side menu) is added for you; you write only the content of the page.

ACTORS
${ctx.actors.map(a => `- ${line(a.name)}${a.description ? `: ${line(a.description)}` : ''}`).join('\n')}

THE SCREEN TO DESIGN
${targets.length ? `Serves these use cases:\n${targets.map(t => describeUseCase(t, number.get(t.id)!, actorsOf(t.id), true)).join('\n')}` : 'Serves no specific use case; design what the instruction below asks for.'}
${req.instruction ? `\nThe user asked for: ${line(req.instruction)}` : ''}
${actor ? `\nDraw it from the point of view of: ${line(actor.name)}.` : ''}

OTHER USE CASES OF THE PRODUCT (for context; mention or link to them only where this screen naturally leads to them)
${others.map(u => describeUseCase(u, number.get(u.id)!, actorsOf(u.id), false)).join('\n') || '(none)'}

REQUIREMENTS THAT AFFECT THIS SCREEN (follow them visibly where they apply, for example language, limits, confirmations)
${relevantNfrs.map(n => `- ${line(n.name)}: ${line(n.text)}`).join('\n') || '(none)'}

DATA MODEL (the screen shows and edits exactly this data; use these field names as labels, in plain readable words)
${entities || '(none)'}

SAMPLE DATA (use ONLY these records for any names, numbers, dates, prices and statuses shown, so every screen shows the same people and things; do not invent other records)
${ctx.sampleData ? JSON.stringify(ctx.sampleData) : '(none - invent a few realistic, believable records and keep them simple)'}

OTHER MOCKUPS THAT ALREADY EXIST (match their style and wording; you may link to one with <a class="mk-btn" href="#m:ID">)
${existing}

RULES
- Compose the screen ONLY from the building blocks below. Write no <style>, no <script>, no images, no external links, no inline styles except width/height percentages.
- Design the screen the way a real product of this kind would, for the use cases above: the page a person would actually be on to do it. Use realistic content from the sample data. Do not invent features the use cases do not call for.
- A use case with several steps may need the key moment shown (for example the form filled in, the confirmation), not an empty page. Show a believable state.
- Buttons and labels use the words of the use cases and the data model. Where a requirement says Thai text, mix Thai and English labels as a real Thai product would.
- Add nothing the use cases and the data model do not call for: no extra fields, tabs, filters, demo accounts, settings or features of your own. A login screen is a login form and nothing more.
- Never show raw ids or codes like "book_1" or "pony_3". Show what a person would read (a booking reference like "#1024", a name).
- Write amounts with thousands separators ("฿1,200") and the same way on every screen. Write dates and times the same way on every screen ("Sat 15 Jun, 09:00").
- Where a requirement asks for two languages, apply it to headings, buttons and key labels only, not to every sentence.
- Keep it to what fits one screen. Not more than about 120 lines of HTML.

BUILDING BLOCKS
${MOCKUP_KIT_REFERENCE}

ANSWER FORMAT (exactly this, nothing before or after)
TITLE: <a short screen name, like "Lesson calendar">
DESCRIPTION: <one sentence on what this screen is for>
ACTOR: <the id of the actor whose screen this is, or none>
===HTML===
<the page content only>`;
}

const MAX_HTML = 60_000;

/**
 * Defence in depth. The page is also locked down by its Content-Security-Policy and, in the viewer, by a
 * sandboxed frame, so nothing here has to be perfect - this just removes what has no business being in a mockup.
 */
export function sanitizeMockupHtml(html: string): string {
	let out = html
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<(script|style|iframe|object|embed|link|meta|base|form|svg|math)\b[\s\S]*?<\/\1\s*>/gi, '')
		.replace(/<(script|style|iframe|object|embed|link|meta|base|form|input\s+type=["']?file)\b[^>]*>/gi, '')
		.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
		.replace(/\s(src|srcset|action|formaction|data|poster|background)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
		.replace(/\shref\s*=\s*("([^"]*)"|'([^']*)')/gi, (_m, _q, d, s) => {
			const v = (d ?? s ?? '').trim();
			return /^#m:[a-z0-9-]+$/i.test(v) ? ` href="${v}"` : ' href="#"';
		})
		.replace(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/gi, (_m, _q, d, s) => {
			const keep = (d ?? s ?? '').split(';').map((x: string) => x.trim())
				.filter((x: string) => /^(width|height|min-height)\s*:\s*[0-9.]+(%|px)$/i.test(x));
			return keep.length ? ` style="${keep.join('; ')}"` : '';
		});
	out = out.replace(/\n{3,}/g, '\n\n').trim();
	return out.length > MAX_HTML ? out.slice(0, MAX_HTML) : out;
}

/** Parses the model's TITLE / DESCRIPTION / ACTOR / ===HTML=== answer. */
export function parseMockupScreen(text: string, knownActorIds: Set<string> = new Set()): MockupScreen {
	const cleaned = text.trim().replace(/^```(?:html|text)?\s*/i, '').replace(/```\s*$/, '');
	const marker = cleaned.indexOf('===HTML===');
	if (marker === -1) throw new LlmError('The model did not return a mockup in the expected format.');
	const head = cleaned.slice(0, marker);
	const body = cleaned.slice(marker + '===HTML==='.length).replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/, '');
	const field = (name: string) => new RegExp(`^${name}:\\s*(.+)$`, 'im').exec(head)?.[1]?.trim();
	const bodyHtml = sanitizeMockupHtml(body);
	if (bodyHtml.length < 40) throw new LlmError('The model returned an empty mockup.');
	const actor = field('ACTOR');
	return {
		title: (field('TITLE') || 'Untitled screen').slice(0, 120),
		description: (field('DESCRIPTION') || '').slice(0, 400),
		...(actor && knownActorIds.has(actor) ? { actorId: actor } : {}),
		bodyHtml
	};
}

export async function generateMockup(
	client: LlmClient, ctx: MockupContext, req: MockupRequest, theme: MockupTheme
): Promise<{ screen: MockupScreen; usage: LlmUsage; model: string }> {
	const completion = await client.complete(buildMockupPrompt(ctx, req, theme));
	return { screen: parseMockupScreen(completion.text, new Set(ctx.actors.map(a => a.id))), usage: completion.usage, model: completion.model };
}

// ---------------------------------------------------------------------------
// Shared sample data
// ---------------------------------------------------------------------------

export function buildSampleDataPrompt(ctx: MockupContext): string {
	const today = new Date().toISOString().slice(0, 10);
	return `You are preparing the example data that will fill every draft screen of a software product, so that all screens show the same believable people, things, dates and amounts.

TODAY'S DATE: ${today}. Every date and time must be within a few weeks of today (past and future), never in an earlier year.

PRODUCT
${ctx.systemName}${ctx.overview ? ` - ${line(ctx.overview)}` : ''}

DATA MODEL
${ctx.entities.map(e => `- ${e.name}: ${e.attributes.map(a => `${a.name} (${a.type}${a.isPK ? ', key' : ''}${a.isFK ? ', ref' : ''})`).join(', ')}`).join('\n')}

REQUIREMENTS THAT AFFECT THE DATA
${ctx.nfrs.filter(n => n.useCaseId === null).map(n => `- ${line(n.name)}: ${line(n.text)}`).join('\n') || '(none)'}

Write 4 to 8 records for each entity (fewer for entities with only a few natural records), using EXACTLY the field names above.
- Values must be realistic for this kind of product and place (names, amounts, dates in ISO format around the current month).
- Keys and references must agree: a field that refers to another entity must use an id that exists in that entity's records.
- Where the requirements say Thai text, include Thai values for those fields.
- Keep every value short.
- Give records and references human-friendly values (a booking reference like "#1024"), not codes like "book_1".

Respond with ONLY a JSON object, no prose, no code fences: { "<Entity name>": [ { "<field>": <value>, ... }, ... ], ... }`;
}

export async function generateSampleData(client: LlmClient, ctx: MockupContext): Promise<{ data: SampleData; usage: LlmUsage; model: string }> {
	const completion = await client.complete(buildSampleDataPrompt(ctx));
	return { data: validateSampleData(parseJson(completion.text)), usage: completion.usage, model: completion.model };
}
