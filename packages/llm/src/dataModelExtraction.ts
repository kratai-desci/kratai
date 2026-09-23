import { LlmClient, LlmError, LlmUsage } from './llmClient.js';
import { DataModelData, validateDataModelOutput } from './dataModelSchema.js';

export interface DataModelExtractionResult {
	data: DataModelData;
	usage: LlmUsage;
	model: string;
}

function buildPrompt(summary: string): string {
	return `You are reading a summary of a codebase's data-model-relevant classes - ORM entities, repositories, and plain data-holder classes (fields, little or no real behavior) - deliberately not the full codebase, since most classes (services, controllers, utilities) aren't part of the data model. Produce a data/entity-relationship model from it: entities, their attributes, and relationships between them.

Guidelines:
- Entities are real domain concepts (User, Order, Product), not utility/service classes. Only include something as an entity if the summary actually shows it holding data fields - don't invent entities it gives no evidence for.
- Attributes: a name and a short type, reusing whatever type the summary shows (e.g. "string", "number", "Date", "uuid") - don't invent types it doesn't support. Set "isPK" true for the primary key field (usually "id", or noted directly), "isFK" true for a field that's clearly a foreign key to another entity (e.g. "userId" on Order).
- Relationships: only add one when the summary gives real evidence - a foreign key field, a repository method, an array-typed property referencing another entity. "kind" is "one-to-many" for a typical FK-style reference, "many-to-many" for a join/array-of-array relationship, "one-to-one" only when clearly unique on both sides. "label" is a short verb phrase (e.g. "places", "contains").
- If the summary has no real entities in it (no ORM/data-model classes detected), return an empty "entities" array and empty "relationships" array. Do NOT invent a plausible-sounding but fictional data model just to have something to show - an empty result is the correct, honest answer for a codebase with no real data-model layer to infer from.
- No fixed minimum or maximum count - include exactly what the summary actually supports.
- "narrative": only when there's at least one relationship, write ONE short paragraph (2-4 sentences) that gives a reader with zero domain knowledge of this project a conceptual, heuristic understanding of what this part of the domain represents and why the entities are connected the way they are - NOT a restatement of the schema. Do not enumerate attributes/fields (that's covered elsewhere) or walk through entities one by one like a table of contents. Instead, explain the real-world rule or reason behind the connection, and only mention a relationship's cardinality when it's doing work to explain that rule - e.g. "The domain represents how authors and books are related. Each book must have at least one author, which is why Book and Author have a many-to-many relationship." rather than "Books represent the publications in the system, storing details such as title, ISBN... Each book can be written by one or more authors, linking books to the creators who wrote them." If there are several relationships, prioritize the one(s) that most reveal how the domain actually works, rather than trying to mention every entity. Omit this field entirely (don't include the key) when there are no relationships to describe.

Respond with ONLY a JSON object, no prose, no markdown code fences, matching exactly this shape:
{
  "entities": [{ "id": "string, unique, kebab-case", "name": "Display Name", "attributes": [{ "name": "string", "type": "string", "isPK": true, "isFK": true }] }],
  "relationships": [{ "fromId": "entity id above", "toId": "entity id above", "kind": "one-to-one" | "one-to-many" | "many-to-many", "label": "short verb phrase" }],
  "narrative": "one short conceptual paragraph explaining the domain and why entities connect this way, or omit this key entirely if there are no relationships"
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

export async function extractDataModel(
	client: LlmClient,
	summary: string,
	workspaceName: string
): Promise<DataModelExtractionResult> {
	const completion = await client.complete(buildPrompt(summary));
	const parsed = parseJson(completion.text);
	const output = validateDataModelOutput(parsed);
	return {
		data: { workspaceName, ...output },
		usage: completion.usage,
		model: completion.model
	};
}
