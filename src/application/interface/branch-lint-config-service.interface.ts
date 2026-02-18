/** Abstraction for loading git-branch-lint configuration. */
export interface IBranchLintConfigService {
	/** @returns The loaded branch-lint config object, or undefined if none found. */
	getConfig(): Promise<Record<string, unknown> | undefined>;
}
