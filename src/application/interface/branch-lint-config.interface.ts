export interface IBranchLintConfig {
	branches?: Array<string> | Record<string, string>;
	rules?: Record<string, unknown>;
}
