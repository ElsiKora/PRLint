import type { ICommandService } from "../../application/interface/command-service.interface";
import type { IGitRepoService } from "../../application/interface/git-repo.interface";

/** Git repository operations backed by shell git commands. */
export class GitRepoService implements IGitRepoService {
	private readonly COMMAND_SERVICE: ICommandService;

	constructor(commandService: ICommandService) {
		this.COMMAND_SERVICE = commandService;
	}

	/** @returns {Promise<string>} The current branch name. */
	async getBranchName(): Promise<string> {
		try {
			return await this.COMMAND_SERVICE.execute("git rev-parse --abbrev-ref HEAD");
		} catch {
			throw new Error("Cannot determine branch name. Are you inside a git repository with at least one commit?");
		}
	}

	/**
	 * @param {string} base - Base ref to diff against.
	 * @returns {Promise<string>} Unified diff output.
	 */
	async getDiff(base: string): Promise<string> {
		try {
			return await this.COMMAND_SERVICE.execute(`git diff ${base}...HEAD`);
		} catch {
			throw new Error(`Cannot compute diff against "${base}". Make sure the branch "${base}" exists and you have at least one commit on the current branch.`);
		}
	}

	/**
	 * @param {string} base - Base ref to compare against.
	 * @returns {Promise<Array<string>>} List of changed file paths.
	 */
	async getFiles(base: string): Promise<Array<string>> {
		try {
			const output: string = await this.COMMAND_SERVICE.execute(`git diff --name-only ${base}...HEAD`);

			return output
				.split("\n")
				.map((file: string) => file.trim())
				.filter(Boolean);
		} catch {
			throw new Error(`Cannot list changed files against "${base}". Make sure the branch "${base}" exists and you have at least one commit on the current branch.`);
		}
	}

	/** @returns {Promise<string>} The remote origin URL. */
	async getRemoteUrl(): Promise<string> {
		try {
			return await this.COMMAND_SERVICE.execute("git remote get-url origin");
		} catch {
			throw new Error('Cannot read remote URL. Make sure a remote named "origin" is configured.');
		}
	}
}
