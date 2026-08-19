export interface Branch {
	name: string;
	isDefault: boolean;
	/** Current head commit sha, when the source can cheaply provide it. */
	sha?: string;
}
