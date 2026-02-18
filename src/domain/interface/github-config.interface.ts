export interface IGitHubConfig {
	base: string;
	isDraft: boolean;
	prohibitedBranches: ReadonlyArray<string>;
}
