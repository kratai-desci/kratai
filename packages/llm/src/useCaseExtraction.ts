import { LlmClient, LlmError, LlmUsage } from './llmClient.js';
import { UseCaseDiagramData, validateUseCaseModelOutput } from './useCaseSchema.js';

export interface UseCaseExtractionResult {
	data: UseCaseDiagramData;
	usage: LlmUsage;
	model: string;
}

function buildPrompt(summary: string): string {
	return `You are reading a summary of a codebase's externally-reachable surface: its HTTP routes, pages/controllers/server actions/middleware, and folder structure - deliberately not the full class/method detail, which is internal implementation that rarely maps to a distinct use case. Produce a UML use case model from it: an overview, who (actors) does what (use cases), and what non-functional requirements (NFRs) the system implies.

Guidelines:
- Actors are roles that interact with the system from outside it - end users, admins, other systems, cron/schedulers - not classes or files. Infer roles from route paths (e.g. /admin/*) and middleware names where present. If nothing suggests distinct roles, use a single generic "User" actor. Give each actor a short "role" label (2-4 words, e.g. "Registered user") and a one-sentence "description" of what they actually do in this system.
- Use cases are user- or system-facing capabilities ("Register", "Ban User", "Send Daily Digest"), not route paths or class/method names. Give each a one-sentence "description" grounded in what the summary actually shows - don't invent behavior it doesn't support.
- Add an <<include>> relation between two use cases only when one always invokes the other as a required step (e.g. Login includes Authenticate Credentials). Add <<extend>> only when one is an optional variant/addition to a base use case.
- Keep it to the most meaningful 5-15 use cases and 2-6 actors - this is meant to be read at a glance, not exhaustive.
- "overview" is a 1-2 sentence project-goal blurb - what the system does and for whom, based on what's actually in the summary.
- "narrative": a role-by-role explanation, for a reader with zero domain knowledge of this project, of who uses this system and what they're there to do. Start from the set of actors/roles, then for each one give its main goal or responsibility and what it can actually do in the app (its key capabilities, drawn from the use cases it's associated with) - not a use-case-by-use-case or field-by-field walkthrough. One short paragraph is enough for a single actor; with several actors, use one short sentence or two per actor rather than an exhaustive list of every use case each one touches. Example style (for two actors): "This system's users are composed of Developers and LLM Providers. Developers are responsible for analyzing a codebase and reviewing the resulting architecture - they can run an analysis, browse the interactive diagram, and export it for sharing. LLM Providers exist purely to enrich that analysis: their role is limited to producing AI-generated summaries when a developer opts in, not driving the workflow themselves." Only mention an <<include>>/<<extend>> relation if it changes what a role can actually do (a prerequisite step, a gated variant) - don't force one in otherwise.
- "nfrs" are non-functional requirements the summary actually gives you signal for (e.g. an /admin/* route implies an access-control NFR, a cron/scheduled entry point implies a timing/reliability NFR, an auth/session route implies a security NFR). Do NOT invent generic boilerplate NFRs ("must be fast", "must be secure") with no grounding in the summary - an empty nfrs array is correct when nothing supports one. Each NFR needs a short "name" (2-4 words, shown at a glance) and a one-sentence "text" (shown on click). Set "useCaseId" to a matching use case id for a requirement scoped to one capability, or null for a project-wide one.

Respond with ONLY a JSON object, no prose, no markdown code fences, matching exactly this shape:
{
  "overview": "1-2 sentences",
  "narrative": "role-by-role: who the actors are, each one's main goal/responsibility, and what it can do in the app",
  "actors": [{ "id": "string, unique, kebab-case", "name": "Display Name", "side": "left" | "right", "role": "short label", "description": "one sentence" }],
  "useCases": [{ "id": "string, unique, kebab-case", "name": "Display Name", "description": "one sentence" }],
  "associations": [{ "actorId": "must match an actor id above", "useCaseId": "must match a use case id above" }],
  "relations": [{ "kind": "include" | "extend", "fromId": "use case id", "toId": "use case id" }],
  "nfrs": [{ "id": "string, unique, kebab-case", "useCaseId": "a use case id above, or null for project-wide", "name": "2-4 words", "text": "one sentence" }]
}

Codebase summary:

${summary}`;
}

function parseJson(raw: string): unknown {
	// Models sometimes wrap JSON in a markdown code fence despite being told
	// not to - stripping it here is cheaper than a second round-trip asking
	// for a fix.
	const stripped = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
	try {
		return JSON.parse(stripped);
	} catch (error) {
		throw new LlmError('Could not parse the model\'s response as JSON.', error);
	}
}

export async function extractUseCaseDiagram(
	client: LlmClient,
	summary: string,
	workspaceName: string
): Promise<UseCaseExtractionResult> {
	const completion = await client.complete(buildPrompt(summary));
	const parsed = parseJson(completion.text);
	const output = validateUseCaseModelOutput(parsed);
	return {
		data: { workspaceName, systemName: workspaceName, ...output },
		usage: completion.usage,
		model: completion.model
	};
}
