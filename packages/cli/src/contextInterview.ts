import { UseCaseDiagramData, ContextSection, unansweredSections } from '@kratai-desci/llm';

const QUESTIONS: Record<ContextSection, string> = {
	background: 'Why does this project exist, and what problem does it solve?',
	goal: 'What does success look like for this project?',
	outOfScope: 'Is there anything this project deliberately will not do?'
};

/**
 * The fixed opening message chat shows right after a spec is generated -
 * deliberately not an LLM call (nothing to ground yet, and it shouldn't cost
 * credit just to ask a question). The model takes over once the user answers
 * (see chatAboutArchitecture.ts's context interview rules). Undefined when
 * nothing is outstanding, so a spec that's already been through this never
 * gets asked again.
 */
export function buildContextInterviewOpener(data: UseCaseDiagramData): string | undefined {
	const [next] = unansweredSections(data);
	if (!next) return undefined;
	return `Your spec is ready. The Overview card only has a summary so far - a few quick questions would make it useful to a client or teammate. First: **${QUESTIONS[next]}**\n\nIf it doesn't apply to this project (say, a hobby project), just say "not relevant", or "later" to skip it.`;
}
