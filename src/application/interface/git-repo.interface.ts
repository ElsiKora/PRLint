/** Abstraction for local git repository operations. */
export interface IGitRepoService {
	/** @returns The current branch name. */
	getBranchName(): Promise<string>;

	/** @param base - Base ref to diff against. @returns The unified diff output. */
	getDiff(base: string): Promise<string>;

	/** @param base - Base ref to compare against. @returns List of changed file paths. */
	getFiles(base: string): Promise<Array<string>>;

	/** @returns The remote origin URL. */
	getRemoteUrl(): Promise<string>;
}
