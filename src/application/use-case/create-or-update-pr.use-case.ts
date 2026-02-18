import type { IGitHubRepoService } from "../interface/github-repo.interface";

/** Creates a new PR or updates an existing one (idempotent). */
export class CreateOrUpdatePrUseCase {
	private readonly GITHUB_REPO: IGitHubRepoService;

	constructor(githubRepo: IGitHubRepoService) {
		this.GITHUB_REPO = githubRepo;
	}

	/**
	 * @param {string} title - PR title.
	 * @param {string} body - PR body content.
	 * @param {string} head - Head branch name.
	 * @param {string} base - Base branch name.
	 * @param {boolean} isDraft - Whether the PR should be a draft.
	 * @returns {Promise<number>} The PR number (created or updated).
	 */
	async execute(title: string, body: string, head: string, base: string, isDraft: boolean): Promise<number> {
		const existing: number | undefined = await this.GITHUB_REPO.findOpenPr(head, base);

		if (existing !== undefined) {
			await this.GITHUB_REPO.updatePr(existing, title, body);

			return existing;
		}

		return this.GITHUB_REPO.createPr(title, body, head, base, isDraft);
	}
}
