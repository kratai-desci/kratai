import { LlmClient, LlmCompletion } from './llmClient.js';

/**
 * Writes the brief a developer pastes into their AI coding agent to start one task from the web
 * app's board. `context` is everything the spec says that bears on the task (the caller gathers it:
 * the task, the use case or requirement it delivers, the related requirements and data, the other
 * tasks for the same item), so this stays a single call with no tools.
 */
export async function writeTaskPrompt(client: LlmClient, context: string): Promise<LlmCompletion> {
	const prompt = `You write the brief a developer gives an AI coding agent (such as Claude Code or Cursor) to start one task. The agent works in the project's code but knows nothing about the spec, so the brief carries what it needs from it.

Write in Markdown, with these sections in this order, leaving out any with nothing to say:
## Task - what to build, in two to four sentences.
## Project - one or two sentences on the system.
## Use case (or ## Requirement) - the item this task delivers: its goal and its steps as a numbered list, in the spec's words.
## Requirements - only the non-functional requirements in the context that bear on THIS task, one bullet each (leave out the rest).
## Data - the entities and fields involved.
## Done when - three to six checkable acceptance criteria for THIS task (not the whole use case).
## Not in this task - other tasks for the same item, so the agent leaves them alone.
## Before you start - read the existing code for the area first; ask before changing anything outside the task.

Rules: use only facts from the context below; never invent a technology, framework, file name or API that is not in it. Be concise. Output only the brief.

Context:
${context}`;
	return client.complete(prompt);
}
