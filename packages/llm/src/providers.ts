export type LlmProvider = 'anthropic' | 'gemini';

/** What apiKeyStore.ts persists (encrypted) - a provider tag alongside the
 * key, since different providers' keys aren't interchangeable strings. */
export interface StoredApiKey {
	provider: LlmProvider;
	key: string;
}
