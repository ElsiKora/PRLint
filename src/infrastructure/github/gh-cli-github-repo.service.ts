import type { ICommandService } from "../../application/interface/command-service.interface";
import type { IGitHubRepoService } from "../../application/interface/github-repo.interface";

/** GitHub pull request operations backed by the local gh CLI. */
export class GhCliGitHubRepoService implements IGitHubRepoService {
	private readonly COMMAND_SERVICE: ICommandService;

	constructor(commandService: ICommandService) {
		this.COMMAND_SERVICE = commandService;
	}

	/** @param title - PR title. @param body - PR body markdown. @param head - Head branch name. @param base - Base branch name. @param draft - Whether to create as draft. @returns Created PR number. */
	async createPr(title: string, body: string, head: string, base: string, draft: boolean): Promise<number> {
		const draftFlag: string = draft ? " --draft" : "";
		const escapedTitle: string = title.replaceAll('"', '\\"');
		const result: string = await this.COMMAND_SERVICE.execute(`gh pr create --title "${escapedTitle}" --body-file - --base "${base}" --head "${head}"${draftFlag} <<'PRLINT_EOF'\n${body}\nPRLINT_EOF`);

		const match: RegExpMatchArray | null = result.match(/\/pull\/(\d+)/);

		if (!match?.[1]) {
			throw new Error(`Failed to parse PR number from gh output: ${result}`);
		}

		return Number.parseInt(match[1], 10);
	}

	/** @param head - Head branch to search for. @param base - Base branch to search for. @returns The open PR number, or undefined. */
	async findOpenPr(head: string, base: string): Promise<number | undefined> {
		try {
			const result: string = await this.COMMAND_SERVICE.execute(`gh pr list --head "${head}" --base "${base}" --state open --json number --limit 1`);
			const parsed: Array<{ number: number }> = JSON.parse(result) as Array<{ number: number }>;

			return parsed[0]?.number;
		} catch {
			return undefined;
		}
	}

	/** @param prNumber - PR number to update. @param title - New title. @param body - New body. */
	async updatePr(prNumber: number, title: string, body: string): Promise<void> {
		const escapedTitle: string = title.replaceAll('"', '\\"');
		await this.COMMAND_SERVICE.execute(`gh pr edit ${String(prNumber)} --title "${escapedTitle}" --body-file - <<'PRLINT_EOF'\n${body}\nPRLINT_EOF`);
	}
}
