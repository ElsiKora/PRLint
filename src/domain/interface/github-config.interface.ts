export interface IGitHubConfig {
	base: string;
	draft: boolean;
	prohibitedBranches: ReadonlyArray<string>;
}
