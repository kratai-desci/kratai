import { UseCaseDiagramData, DataModelData } from '@kratai/llm';
import { getDeviceToken, KRATAI_WEB_URL } from './auth.js';

/**
 * Once BYOK is gone, this app can never hold a shared provider key capable
 * of running up kratai's own bill - only the user's own device token,
 * which kratai-web's backend (not this process) exchanges for a real LLM
 * call, metered against their account. `summary` is view.ts's lean,
 * entry-points-only extraction input (see buildUseCaseExtractionSummary in
 * useCaseDiagramData.ts) - not the full markdown export.
 */
export async function generateUseCaseDiagram(summary: string, workspaceName: string): Promise<UseCaseDiagramData> {
	const token = getDeviceToken();
	if (!token) throw new Error('Sign in to generate a use case diagram.');

	const res = await fetch(new URL('/api/generate/use-case-diagram', KRATAI_WEB_URL), {
		method: 'POST',
		headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
		body: JSON.stringify({ summary, workspaceName })
	});
	const data = await res.json().catch(() => ({} as Record<string, unknown>));
	if (!res.ok) throw new Error((data as { error?: string }).error || `Generation failed (${res.status}).`);
	return data as UseCaseDiagramData;
}

/**
 * Same relay shape as generateUseCaseDiagram, pointed at kratai-web's
 * data-model route instead. `summary` is buildDataModelExtractionSummary's
 * ORM-entity/repository/plain-data-class summary (dataModelData.ts).
 */
export async function generateDataModel(summary: string, workspaceName: string): Promise<DataModelData> {
	const token = getDeviceToken();
	if (!token) throw new Error('Sign in to generate a data model.');

	const res = await fetch(new URL('/api/generate/data-model', KRATAI_WEB_URL), {
		method: 'POST',
		headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
		body: JSON.stringify({ summary, workspaceName })
	});
	const data = await res.json().catch(() => ({} as Record<string, unknown>));
	if (!res.ok) throw new Error((data as { error?: string }).error || `Generation failed (${res.status}).`);
	return data as DataModelData;
}
