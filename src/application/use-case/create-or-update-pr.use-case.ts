import type { IGitHubRepoService } from "../interface/github-repo.interface";

/** Creates a new PR or updates an existing one (idempotent). */
export class CreateOrUpdatePrUseCase {
	constructor(private readonly GITHUB_REPO: IGitHubRepoService) {}

	/** @param title - PR title. @param body - PR body. @param head - Head branch. @param base - Base branch. @param draft - Whether the PR should be a draft. @returns The PR number (created or updated). */
	async execute(title: string, body: string, head: string, base: string, draft: boolean): Promise<number> {
		const existing = await this.GITHUB_REPO.findOpenPr(head, base);

		if (existing !== undefined) {
			await this.GITHUB_REPO.updatePr(existing, title, body);

			return existing;
		}

		return this.GITHUB_REPO.createPr(title, body, head, base, draft);
	}
}
