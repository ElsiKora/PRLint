import type { ICommandService } from "../../application/interface/command-service.interface";
import type { IGitHubRepoService } from "../../application/interface/github-repo.interface";

/** GitHub pull request operations backed by the local gh CLI. */
export class GhCliGitHubRepoService implements IGitHubRepoService {
	private readonly COMMAND_SERVICE: ICommandService;

	constructor(commandService: ICommandService) {
		this.COMMAND_SERVICE = commandService;
	}

	/**
	 * @param {string} title - PR title.
	 * @param {string} body - PR body markdown.
	 * @param {string} head - Head branch name.
	 * @param {string} base - Base branch name.
	 * @param {boolean} isDraft - Whether to create as draft.
	 * @returns {Promise<number>} Created PR number.
	 */
	async createPr(title: string, body: string, head: string, base: string, isDraft: boolean): Promise<number> {
		const draftFlag: string = isDraft ? " --draft" : "";
		const escapedTitle: string = title.replaceAll('"', String.raw`\"`);
		const result: string = await this.COMMAND_SERVICE.execute(`gh pr create --title "${escapedTitle}" --body-file - --base "${base}" --head "${head}"${draftFlag} <<'PRLINT_EOF'\n${body}\nPRLINT_EOF`);

		const match: null | RegExpMatchArray = /\/pull\/(\d+)/.exec(result);

		if (!match?.[1]) {
			throw new Error(`Failed to parse PR number from gh output: ${result}`);
		}

		return Number.parseInt(match[1], 10);
	}

	/**
	 * @param {string} head - Head branch to search for.
	 * @param {string} base - Base branch to search for.
	 * @returns {Promise<number | undefined>} The open PR number, or undefined.
	 */
	async findOpenPr(head: string, base: string): Promise<number | undefined> {
		try {
			const result: string = await this.COMMAND_SERVICE.execute(`gh pr list --head "${head}" --base "${base}" --state open --json number --limit 1`);
			const parsed: Array<{ number: number }> = JSON.parse(result) as Array<{ number: number }>;

			return parsed[0]?.number;
		} catch {
			return undefined;
		}
	}

	/**
	 * @param {number} prNumber - PR number to update.
	 * @param {string} title - New title.
	 * @param {string} body - New body.
	 */
	async updatePr(prNumber: number, title: string, body: string): Promise<void> {
		const escapedTitle: string = title.replaceAll('"', String.raw`\"`);
		await this.COMMAND_SERVICE.execute(`gh pr edit ${String(prNumber)} --title "${escapedTitle}" --body-file - <<'PRLINT_EOF'\n${body}\nPRLINT_EOF`);
	}
}
