/** Abstraction for GitHub pull request operations. */
export interface IGitHubRepoService {
	/** @param title - PR title. @param body - PR body. @param head - Head branch. @param base - Base branch. @param draft - Whether to create as draft. @returns The created PR number. */
	createPr(title: string, body: string, head: string, base: string, draft: boolean): Promise<number>;

	/** @param head - Head branch. @param base - Base branch. @returns The PR number if an open PR exists, otherwise undefined. */
	findOpenPr(head: string, base: string): Promise<number | undefined>;

	/** @param prNumber - PR number to update. @param title - New title. @param body - New body. */
	updatePr(prNumber: number, title: string, body: string): Promise<void>;
}
