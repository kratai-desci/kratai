import { LlmClient, LlmError, LlmUsage } from './llmClient.js';
import { parseJson } from './useCaseExtraction.js';
import { UseCaseDiagramData, UseCaseActor, UseCaseItem, UseCaseNFR, validateUseCaseModelOutput, NFR_TESTABLE_RULE } from './useCaseSchema.js';
import { DataModelData, DataModelOutput, validateDataModelOutput } from './dataModelSchema.js';

/**
 * The new-project wizard's AI side: for a project with no code there is nothing
 * to extract from, so the user's own answers are the source. Each step turns
 * the answers so far into suggestions the user then picks from, and the last
 * step writes only prose and a data model around exactly what they chose -
 * buildProjectSpec assembles the actors, use cases and requirements itself, so
 * the model can never add, drop or rename a choice. Runs on kratai-web (like
 * the extraction functions), billed to the caller.
 */

export type ActorKind = 'person' | 'system';

export const NFR_CATEGORIES = ['Functionality', 'Usability', 'Reliability', 'Performance', 'Supportability', 'Constraints'] as const;

export interface WizardProject {
	name: string;
	what: string;
	who?: string;
	/** Who is preparing the spec (shown as "Prepared by" on the documents); not sent to the AI. */
	company?: string;
	/** Who it is for (shown as "Client" on the documents); not sent to the AI. */
	client?: string;
}

export interface WizardActor {
	name: string;
	description: string;
	kind: ActorKind;
}

/** Use case names per actor, keyed by the actor's exact name. */
export type WizardUseCases = Record<string, string[]>;

export interface WizardRequirement {
	name: string;
	description: string;
	category: string;
	recommended?: boolean;
}

export interface WizardChoices {
	project: WizardProject;
	actors: WizardActor[];
	useCases: WizardUseCases;
	requirements: WizardRequirement[];
}

export interface WizardResult<T> {
	data: T;
	usage: LlmUsage;
	model: string;
}

export interface SpecDetails {
	overview?: string;
	narrative?: string;
	/** Keyed by lower-cased use case name (the same use case can sit under several actors). */
	useCaseDescriptions: Record<string, string>;
	/** Full detail for the few key use cases only, keyed like useCaseDescriptions; the rest stay brief. */
	useCaseDetails: Record<string, UseCaseDetail>;
	dataModel: DataModelOutput;
}

export interface UseCaseDetail {
	goal?: string;
	preconditions?: string[];
	mainFlow?: string[];
	postconditions?: string[];
}

const MAX_TEXT = 600;

function projectBlock(project: WizardProject): string {
	return `Project name: ${project.name}\nWhat it is: ${project.what.trim()}${project.who?.trim() ? `\nWho will use it and the problem it solves: ${project.who.trim()}` : ''}`;
}

function asText(value: unknown, max = MAX_TEXT): string | undefined {
	return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;
}

function asObject(raw: unknown, what: string): Record<string, unknown> {
	if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new LlmError(`The model's ${what} response was not a JSON object.`);
	return raw as Record<string, unknown>;
}

function dedupeByName<T extends { name: string }>(items: T[]): T[] {
	const seen = new Set<string>();
	return items.filter(item => {
		const key = item.name.trim().toLowerCase();
		if (!key || seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

// ---------------------------------------------------------------------------
// Step 1 -> 2: actors
// ---------------------------------------------------------------------------

function actorsPrompt(project: WizardProject): string {
	return `You are helping someone write the requirements for a new software project that has no code yet. From their description, suggest the ACTORS: the kinds of people and outside systems that will interact with it.

${projectBlock(project)}

Rules:
- 3 to 6 actors, most important first.
- Each actor is a role, not a named person ("Housemate", not "Alex"). Short singular names.
- Include an outside system (payments, email, a third-party API) ONLY if the description clearly implies one.
- "description" is one short sentence on the GOAL of that actor: what they want to achieve with the system (e.g. "Wants to book and pay for lessons without calling the club").
- "kind" is "person" for a human role and "system" for an outside system.
- Base everything on the description. Do not invent features it doesn't suggest.

Respond with ONLY a JSON object, no prose, no markdown code fences:
{ "actors": [{ "name": "string", "description": "string", "kind": "person" | "system" }] }`;
}

export function validateActorSuggestions(raw: unknown): WizardActor[] {
	const obj = asObject(raw, 'actors');
	const list = Array.isArray(obj.actors) ? obj.actors : [];
	const actors = dedupeByName(list.flatMap((entry): WizardActor[] => {
		if (typeof entry !== 'object' || entry === null) return [];
		const e = entry as Record<string, unknown>;
		const name = asText(e.name, 60);
		if (!name) return [];
		return [{ name, description: asText(e.description, 200) ?? '', kind: e.kind === 'system' ? 'system' : 'person' }];
	})).slice(0, 8);
	if (actors.length === 0) throw new LlmError('The model suggested no actors.');
	return actors;
}

export async function suggestActors(client: LlmClient, project: WizardProject): Promise<WizardResult<WizardActor[]>> {
	const completion = await client.complete(actorsPrompt(project));
	return { data: validateActorSuggestions(parseJson(completion.text)), usage: completion.usage, model: completion.model };
}

// ---------------------------------------------------------------------------
// Step 2 -> 3: use cases, for every chosen actor in one call
// ---------------------------------------------------------------------------

function useCasesPrompt(project: WizardProject, actors: WizardActor[]): string {
	return `You are helping someone write the requirements for a new software project that has no code yet. For each actor below, suggest the USE CASES: the things that actor does with the system.

${projectBlock(project)}

Actors:
${actors.map(a => `- ${a.name}: ${a.description || '(no description)'}`).join('\n')}

Rules:
- 4 to 8 use cases per actor, most important first.
- A use case is ONE thing an actor does, with one trigger and one outcome ("Log in", "Assign a chore"), not a whole feature area ("Manage chores").
- Name each with a verb phrase, at the behavior level: what the actor is trying to do, never screens, buttons or other interface details.
- Don't list the same capability under several actors unless each truly does it.
- Base everything on the description and the actors. Do not invent a different product.

Respond with ONLY a JSON object, no prose, no markdown code fences, keyed by each actor's name exactly as written above:
{ "useCases": { "<actor name>": ["Use case name", "Another use case name"] } }`;
}

export function validateUseCaseSuggestions(raw: unknown, actors: WizardActor[]): WizardUseCases {
	const obj = asObject(raw, 'use cases');
	const byActor = typeof obj.useCases === 'object' && obj.useCases !== null && !Array.isArray(obj.useCases) ? obj.useCases as Record<string, unknown> : {};
	const lookup = new Map(Object.entries(byActor).map(([key, value]) => [key.trim().toLowerCase(), value]));
	const result: WizardUseCases = {};
	let total = 0;
	for (const actor of actors) {
		const value = lookup.get(actor.name.trim().toLowerCase());
		const names = Array.isArray(value)
			? dedupeByName(value.flatMap((v): { name: string }[] => { const name = asText(v, 100); return name ? [{ name }] : []; })).map(v => v.name).slice(0, 10)
			: [];
		result[actor.name] = names;
		total += names.length;
	}
	if (total === 0) throw new LlmError('The model suggested no use cases.');
	return result;
}

export async function suggestUseCases(client: LlmClient, project: WizardProject, actors: WizardActor[]): Promise<WizardResult<WizardUseCases>> {
	const completion = await client.complete(useCasesPrompt(project, actors));
	return { data: validateUseCaseSuggestions(parseJson(completion.text), actors), usage: completion.usage, model: completion.model };
}

// ---------------------------------------------------------------------------
// Step 3 -> 4: non-functional requirements (FURPS+)
// ---------------------------------------------------------------------------

function requirementsPrompt(project: WizardProject, actors: WizardActor[], useCases: WizardUseCases): string {
	return `You are helping someone write the requirements for a new software project that has no code yet. Suggest the NON-FUNCTIONAL REQUIREMENTS: the qualities the system must have, not the features it offers.

${projectBlock(project)}

Actors and the use cases chosen for them:
${actors.map(a => `- ${a.name}: ${(useCases[a.name] ?? []).join('; ') || '(none)'}`).join('\n')}

Rules:
- 5 to 8 requirements, organised by the FURPS+ categories: ${NFR_CATEGORIES.join(', ')}. Cover at least four different categories.
- "name" is a short label (2-3 words). "description" is one sentence. ${NFR_TESTABLE_RULE}
- Only suggest what fits THIS project. Skip a category rather than pad it with something generic.
- Set "recommended" to true for the 3 or 4 that matter most for this project, false for the rest.

Respond with ONLY a JSON object, no prose, no markdown code fences:
{ "requirements": [{ "name": "string", "description": "string", "category": "${NFR_CATEGORIES.join('" | "')}", "recommended": true }] }`;
}

export function validateRequirementSuggestions(raw: unknown): WizardRequirement[] {
	const obj = asObject(raw, 'requirements');
	const list = Array.isArray(obj.requirements) ? obj.requirements : [];
	const categoryOf = (value: unknown): string => {
		const wanted = typeof value === 'string' ? value.trim().toLowerCase() : '';
		return NFR_CATEGORIES.find(c => c.toLowerCase() === wanted) ?? 'Constraints';
	};
	const requirements = dedupeByName(list.flatMap((entry): WizardRequirement[] => {
		if (typeof entry !== 'object' || entry === null) return [];
		const e = entry as Record<string, unknown>;
		const name = asText(e.name, 60);
		const description = asText(e.description, 320);
		if (!name || !description) return [];
		return [{ name, description, category: categoryOf(e.category), recommended: e.recommended === true }];
	})).slice(0, 10);
	if (requirements.length === 0) throw new LlmError('The model suggested no requirements.');
	return requirements;
}

export async function suggestRequirements(client: LlmClient, project: WizardProject, actors: WizardActor[], useCases: WizardUseCases): Promise<WizardResult<WizardRequirement[]>> {
	const completion = await client.complete(requirementsPrompt(project, actors, useCases));
	return { data: validateRequirementSuggestions(parseJson(completion.text)), usage: completion.usage, model: completion.model };
}

// ---------------------------------------------------------------------------
// Final step: prose + data model around exactly what the user chose
// ---------------------------------------------------------------------------

function detailsPrompt(choices: WizardChoices): string {
	const { project, actors, useCases, requirements } = choices;
	return `You are finishing the first draft of a Software Requirements Specification for a new project that has no code yet. The user has ALREADY chosen the actors, use cases and requirements below - you must not add, remove, rename or reorder any of them. Your job is only the writing and the data model.

${projectBlock(project)}

Actors and their chosen use cases:
${actors.map(a => `- ${a.name} (${a.kind}): ${a.description || ''}\n${(useCases[a.name] ?? []).map(u => `    * ${u}`).join('\n') || '    * (none)'}`).join('\n')}

Chosen requirements:
${requirements.map(r => `- [${r.category}] ${r.name}: ${r.description}`).join('\n') || '- (none)'}

Write:
- "overview": 1-2 sentences saying what the system is and who it is for. Say nothing about why it was built or what it aims to achieve.
- "narrative": a short plain-language paragraph for a reader who knows nothing about this project, explaining who the actors are and what each is there to do. One or two sentences per actor, not a list of every use case.
- "useCaseDescriptions": one sentence for each use case saying what the actor achieves, using the exact actor and use case names above.
- "useCaseDetails": full detail for ONLY the key use cases - the ones with the highest business value, the highest risk, or the most complexity - at most 5 (fewer when there are few use cases). Leave every other use case out of this list; they stay brief. For each key one give: "goal" (one sentence: what the actor wants to achieve), "preconditions" (what must be true before it starts, 1-3 short items), "mainFlow" (the normal path as 3-8 short steps alternating actor and system, in plain behavior-level language with NO step numbers and no buttons, screens or layout) and "postconditions" (what is true afterwards, 1-3 short items). Use the exact use case name above. This is a first draft from the description alone, so keep to what the use case clearly implies and do not invent extra features.
- "dataModel": the data the system must remember to support these use cases - entities, their attributes and the relationships between them. This is a design proposal derived from the use cases, so keep it modest and grounded: 3 to 8 entities, each with an "id" attribute as primary key and only attributes the use cases clearly need; relationships only where the use cases imply them ("kind" is "one-to-many" for a typical reference, "many-to-many" for a join, "one-to-one" only when clearly unique on both sides; "label" is a short verb phrase). Include "narrative" (2-4 sentences explaining why the entities connect, not restating the schema) only when there is at least one relationship.

Respond with ONLY a JSON object, no prose, no markdown code fences:
{
  "overview": "string",
  "narrative": "string",
  "useCaseDescriptions": [{ "actor": "string", "useCase": "string", "description": "string" }],
  "useCaseDetails": [{ "useCase": "string", "goal": "string", "preconditions": ["string"], "mainFlow": ["string"], "postconditions": ["string"] }],
  "dataModel": {
    "entities": [{ "id": "string, unique, kebab-case", "name": "Display Name", "attributes": [{ "name": "string", "type": "string", "isPK": true, "isFK": true }] }],
    "relationships": [{ "fromId": "entity id", "toId": "entity id", "kind": "one-to-one" | "one-to-many" | "many-to-many", "label": "short verb phrase" }],
    "narrative": "string, or omit if there are no relationships"
  }
}`;
}

export function validateSpecDetails(raw: unknown): SpecDetails {
	const obj = asObject(raw, 'spec');
	const useCaseDescriptions: Record<string, string> = {};
	for (const entry of Array.isArray(obj.useCaseDescriptions) ? obj.useCaseDescriptions : []) {
		if (typeof entry !== 'object' || entry === null) continue;
		const e = entry as Record<string, unknown>;
		const name = asText(e.useCase, 100);
		const description = asText(e.description, 280);
		if (name && description && !useCaseDescriptions[name.toLowerCase()]) useCaseDescriptions[name.toLowerCase()] = description;
	}
	const useCaseDetails: Record<string, UseCaseDetail> = {};
	for (const entry of Array.isArray(obj.useCaseDetails) ? obj.useCaseDetails : []) {
		if (typeof entry !== 'object' || entry === null) continue;
		const e = entry as Record<string, unknown>;
		const name = asText(e.useCase, 100);
		if (!name || useCaseDetails[name.toLowerCase()]) continue;
		const list = (v: unknown, max: number): string[] | undefined => {
			if (!Array.isArray(v)) return undefined;
			const items = v.flatMap(x => { const t = asText(x, 240); return t ? [t] : []; }).slice(0, max);
			return items.length ? items : undefined;
		};
		const goal = asText(e.goal, 280);
		const preconditions = list(e.preconditions, 6);
		const mainFlow = list(e.mainFlow, 12);
		const postconditions = list(e.postconditions, 6);
		// All-or-nothing on the flow: a use case with no steps is not "detailed".
		if (!mainFlow) continue;
		useCaseDetails[name.toLowerCase()] = { ...(goal ? { goal } : {}), ...(preconditions ? { preconditions } : {}), mainFlow, ...(postconditions ? { postconditions } : {}) };
	}
	// A bad data model shouldn't sink the whole draft - the use case model is the
	// part the user chose, and an empty data model is a valid, editable start.
	let dataModel: DataModelOutput = { entities: [], relationships: [] };
	try { dataModel = validateDataModelOutput(obj.dataModel); } catch { /* keep the empty one */ }
	return { overview: asText(obj.overview), narrative: asText(obj.narrative, 1200), useCaseDescriptions, useCaseDetails, dataModel };
}

export async function draftSpecDetails(client: LlmClient, choices: WizardChoices): Promise<WizardResult<SpecDetails>> {
	const completion = await client.complete(detailsPrompt(choices));
	return { data: validateSpecDetails(parseJson(completion.text)), usage: completion.usage, model: completion.model };
}

// ---------------------------------------------------------------------------
// Assembly (no model involved)
// ---------------------------------------------------------------------------

function slug(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
}

function uniqueId(base: string, taken: Set<string>): string {
	let id = base, n = 2;
	while (taken.has(id)) id = `${base}-${n++}`;
	taken.add(id);
	return id;
}

/**
 * Builds the Use Case Model and Data Model from the user's choices plus the
 * model's prose. Everything structural comes from `choices`; `details` only
 * supplies text, so a use case the user picked can't go missing and one they
 * didn't pick can't appear. The same use case chosen under two actors becomes
 * one use case associated with both.
 */
export function buildProjectSpec(choices: WizardChoices, details: SpecDetails, workspaceName: string = choices.project.name): { useCaseData: UseCaseDiagramData; dataModelData: DataModelData } {
	const { project } = choices;
	const actorIds = new Set<string>();
	const useCaseIds = new Set<string>();
	const actors: UseCaseActor[] = [];
	const useCases: UseCaseItem[] = [];
	const useCaseByName = new Map<string, UseCaseItem>();
	const associations: { actorId: string; useCaseId: string }[] = [];

	for (const actor of choices.actors) {
		const id = uniqueId(slug(actor.name), actorIds);
		actors.push({ id, name: actor.name, side: actor.kind === 'system' ? 'right' : 'left', ...(actor.description ? { description: actor.description } : {}) });
		for (const name of choices.useCases[actor.name] ?? []) {
			const key = name.trim().toLowerCase();
			let useCase = useCaseByName.get(key);
			if (!useCase) {
				const description = asText(details.useCaseDescriptions?.[key], 280);
				const detail = details.useCaseDetails?.[key];
				useCase = { id: uniqueId(slug(name), useCaseIds), name: name.trim(), ...(description ? { description } : {}), ...(detail ?? {}) };
				useCaseByName.set(key, useCase);
				useCases.push(useCase);
			}
			if (!associations.some(a => a.actorId === id && a.useCaseId === useCase!.id)) associations.push({ actorId: id, useCaseId: useCase.id });
		}
	}
	if (actors.length === 0 || useCases.length === 0) throw new LlmError('Choose at least one actor and one use case.');

	const nfrIds = new Set<string>();
	const nfrs: UseCaseNFR[] = choices.requirements.map(r => ({ id: uniqueId(`nfr-${slug(r.name)}`, nfrIds), useCaseId: null, name: r.name, text: r.description }));

	const overview = asText(details.overview) ?? project.what.trim();
	const narrative = asText(details.narrative, 1200);
	const output = validateUseCaseModelOutput({
		actors, useCases, associations, relations: [], nfrs, overview,
		...(narrative ? { narrative } : {})
	});
	let dataModel: DataModelOutput = { entities: [], relationships: [] };
	try { dataModel = validateDataModelOutput(details.dataModel); } catch { /* an empty data model is a valid start */ }
	return {
		useCaseData: { workspaceName, systemName: project.name, ...(project.company ? { preparedBy: project.company } : {}), ...(project.client ? { clientName: project.client } : {}), ...output },
		dataModelData: { workspaceName, ...dataModel }
	};
}

// ---------------------------------------------------------------------------
// Input from the wizard page (untrusted: it is JSON posted by a web page)
// ---------------------------------------------------------------------------

/** Rebuilds a WizardChoices from posted JSON, keeping only well-formed entries.
 * The project name is whatever the user typed (it becomes the spec's system
 * name), falling back to the folder name when left blank. */
export function parseWizardChoices(raw: unknown, workspaceName: string): WizardChoices {
	const obj = asObject(raw, 'wizard input');
	const what = asText(obj.what, 2000);
	if (!what) throw new LlmError('Describe your project first.');
	const project: WizardProject = {
		name: asText(obj.name, 80) ?? workspaceName, what,
		...(asText(obj.who, 2000) ? { who: asText(obj.who, 2000) } : {}),
		...(asText(obj.company, 120) ? { company: asText(obj.company, 120) } : {}),
		...(asText(obj.client, 120) ? { client: asText(obj.client, 120) } : {})
	};
	const actors = dedupeByName((Array.isArray(obj.actors) ? obj.actors : []).flatMap((entry): WizardActor[] => {
		if (typeof entry !== 'object' || entry === null) return [];
		const e = entry as Record<string, unknown>;
		const name = asText(e.name, 60);
		return name ? [{ name, description: asText(e.description, 200) ?? '', kind: e.kind === 'system' ? 'system' : 'person' }] : [];
	}));
	const rawUseCases = typeof obj.useCases === 'object' && obj.useCases !== null && !Array.isArray(obj.useCases) ? obj.useCases as Record<string, unknown> : {};
	const useCases: WizardUseCases = {};
	for (const actor of actors) {
		const list = rawUseCases[actor.name];
		useCases[actor.name] = dedupeByName(
			(Array.isArray(list) ? list : []).flatMap((v): { name: string }[] => { const name = asText(v, 100); return name ? [{ name }] : []; })
		).map(v => v.name);
	}
	const requirements = dedupeByName((Array.isArray(obj.requirements) ? obj.requirements : []).flatMap((entry): WizardRequirement[] => {
		if (typeof entry !== 'object' || entry === null) return [];
		const e = entry as Record<string, unknown>;
		const name = asText(e.name, 60);
		const description = asText(e.description, 320);
		const wanted = typeof e.category === 'string' ? e.category.trim().toLowerCase() : '';
		return name && description ? [{ name, description, category: NFR_CATEGORIES.find(c => c.toLowerCase() === wanted) ?? 'Constraints' }] : [];
	}));
	return { project, actors, useCases, requirements };
}

/** The message pair shown in chat once the spec is built: a plain-language record
 * of what the user chose (so the model has the context too) and what was made. */
export function describeWizardOutcome(choices: WizardChoices, spec: { useCaseData: UseCaseDiagramData; dataModelData: DataModelData }): { user: string; assistant: string } {
	const { project, actors, useCases, requirements } = choices;
	const user = `I set up "${project.name}" with the new-project wizard. ${project.what}${project.who ? ` ${project.who}` : ''}\n\nActors and use cases:\n${actors.map(a => `- ${a.name}: ${(useCases[a.name] ?? []).join(', ') || 'none chosen'}`).join('\n')}${requirements.length ? `\n\nRequirements: ${requirements.map(r => r.name).join(', ')}.` : ''}`;
	const entities = spec.dataModelData.entities.length;
	const assistant = `Here is the initial design: ${spec.useCaseData.actors.length} actors, ${spec.useCaseData.useCases.length} use cases, ${requirements.length} requirements${entities ? ` and a data model with ${entities} entities` : ''}. Have a look at the Spec view, then tell me what to change - for example "add a use case for resetting a password", "rename the Administrator actor", or "the Horse entity needs a breed field".`;
	return { user, assistant };
}

// ---------------------------------------------------------------------------
// One entry point for kratai-web: validates the posted input, runs one step
// ---------------------------------------------------------------------------

export type NewProjectStep = 'actors' | 'use-cases' | 'requirements' | 'draft';

export const NEW_PROJECT_STEPS: readonly NewProjectStep[] = ['actors', 'use-cases', 'requirements', 'draft'];

/** `input` is the wizard's answers so far (see parseWizardChoices); each step
 * needs the ones before it. Returns the step's result for the page - suggestions
 * for the first three, SpecDetails for 'draft'. */
export async function runNewProjectStep(client: LlmClient, step: NewProjectStep, input: unknown, workspaceName: string): Promise<WizardResult<unknown>> {
	const choices = parseWizardChoices(input, workspaceName);
	const { project, actors, useCases, requirements } = choices;
	const hasUseCases = actors.some(a => (useCases[a.name] ?? []).length > 0);
	switch (step) {
		case 'actors':
			return suggestActors(client, project);
		case 'use-cases':
			if (actors.length === 0) throw new LlmError('Choose at least one actor first.');
			return suggestUseCases(client, project, actors);
		case 'requirements':
			if (!hasUseCases) throw new LlmError('Choose at least one use case first.');
			return suggestRequirements(client, project, actors, useCases);
		case 'draft':
			if (!hasUseCases) throw new LlmError('Choose at least one use case first.');
			return draftSpecDetails(client, { project, actors, useCases, requirements });
		default:
			throw new LlmError(`Unknown step: ${String(step)}`);
	}
}
