/**
 * What the chat tells the page while it works. The server-side tool loop (view.ts's runChatLoop) can take
 * many model turns, so instead of one answer at the end /api/chat streams these as it goes (one JSON
 * object per line): the page draws its status line ("Reading routes.ts - 14s"), applies view changes as they
 * happen, lists the steps under the answer, and can stop it.
 */

/** A change to what is on screen (switch view, refresh a view after an edit), see viewShell.ts's applyAiUiActions. */
export type UiAction = { type: string } & Record<string, unknown>;

export type ChatEvent =
	| { type: 'thinking' }
	| { type: 'tool'; label: string; /** True for a tool that edits the spec: stopping afterwards leaves that edit in place. */ editsSpec?: boolean }
	| { type: 'ui'; actions: UiAction[] }
	| { type: 'done'; reply: string; steps: string[]; elapsedMs: number }
	| { type: 'error'; error: string };

const VIEW_NAMES: Record<string, string> = {
	graph: 'the Knowledge Graph', class: 'the Class Diagram', stack: 'the Stack Layer',
	usecase: 'the Use Case Model', data: 'the Data Model', srs: 'the Spec', progress: 'Progress'
};

function text(value: unknown, max = 60): string {
	const s = typeof value === 'string' ? value.trim() : '';
	return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** A short, plain-language line for one tool call, e.g. "Reading src/routes/auth.ts". */
export function describeToolCall(name: string, input: Record<string, unknown>): string {
	switch (name) {
		case 'search_classes': return `Searching for "${text(input.query, 40)}"`;
		case 'get_class_detail': return `Looking at ${text(input.name, 50)}`;
		case 'trace_reachability': return `Tracing how ${text(input.from, 30)} reaches ${text(input.to, 30)}`;
		case 'what_changed': return 'Checking what changed';
		case 'get_folder_structure': return 'Reading the folder structure';
		case 'show_view': return `Showing ${VIEW_NAMES[text(input.view, 20)] ?? 'a view'}`;
		case 'highlight_class': return `Highlighting ${text(input.name, 50)}`;
		case 'read_file': return `Reading ${text(input.path, 60) || 'a file'}`;
		case 'list_directory': return `Listing ${text(input.path, 60) && text(input.path, 60) !== '.' ? text(input.path, 60) : 'the project root'}`;
		case 'update_srs_metadata': return 'Updating the spec details';
		case 'update_use_case_model': return 'Updating the use case model';
		case 'update_data_model': return 'Updating the data model';
		case 'generate_use_case_model': return 'Generating the use case model';
		case 'generate_data_model': return 'Generating the data model';
		default: return `Running ${name}`;
	}
}

/** Whether a tool changes the project's spec files (as opposed to only reading or showing something). */
export function editsSpec(name: string): boolean {
	return name.startsWith('update_') || name.startsWith('generate_');
}

/** Thrown inside the chat loop when the user pressed Stop (the connection closed). */
export class ChatStoppedError extends Error {
	constructor() {
		super('Stopped.');
		this.name = 'ChatStoppedError';
	}
}
