export interface Repo {
	id: string;
	owner: string;
	name: string;
	fullName: string;
	description: string;
	defaultBranch: string;
	private: boolean;
	updatedAt: string;
}
