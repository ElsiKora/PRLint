import type { IBranchLintConfig } from "./branch-lint-config.interface";

/** Abstraction for loading git-branch-lint configuration. */
export interface IBranchLintConfigService {
	/** @returns The loaded branch-lint config object, or undefined if none found. */
	load(): Promise<IBranchLintConfig | undefined>;
}
