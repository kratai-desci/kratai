import { LlmClient, LlmError, LlmUsage } from './llmClient.js';
import { UseCaseDiagramData, validateUseCaseModelOutput } from './useCaseSchema.js';

export interface UseCaseExtractionResult {
	data: UseCaseDiagramData;
	usage: LlmUsage;
	model: string;
}

function buildPrompt(summary: string): string {
	return `You are reading a summary of a codebase's externally-reachable surface: its HTTP routes, pages/controllers/server actions/middleware, and folder structure - deliberately not the full class/method detail, which is internal implementation that rarely maps to a distinct use case. Produce a UML use case diagram from it: who (actors) does what (use cases) in this system.

Guidelines:
- Actors are roles that interact with the system from outside it - end users, admins, other systems, cron/schedulers - not classes or files. Infer roles from route paths (e.g. /admin/*) and middleware names where present. If nothing suggests distinct roles, use a single generic "User" actor.
- Use cases are user- or system-facing capabilities ("Register", "Ban User", "Send Daily Digest"), not route paths or class/method names.
- Add an <<include>> relation between two use cases only when one always invokes the other as a required step (e.g. Login includes Authenticate Credentials). Add <<extend>> only when one is an optional variant/addition to a base use case.
- Keep it to the most meaningful 5-15 use cases and 2-6 actors - this is meant to be read at a glance, not exhaustive.

Respond with ONLY a JSON object, no prose, no markdown code fences, matching exactly this shape:
{
  "actors": [{ "id": "string, unique, kebab-case", "name": "Display Name", "side": "left" | "right" }],
  "useCases": [{ "id": "string, unique, kebab-case", "name": "Display Name" }],
  "associations": [{ "actorId": "must match an actor id above", "useCaseId": "must match a use case id above" }],
  "relations": [{ "kind": "include" | "extend", "fromId": "use case id", "toId": "use case id" }]
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
