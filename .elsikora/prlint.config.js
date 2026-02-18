export default {
	generation: {
		model: "claude-opus-4-5",
		provider: "anthropic",
		retries: 3,
		validationRetries: 3,
	},
	github: {
		base: "dev",
		draft: false,
		prohibitedBranches: ["main", "master"],
	},
	lint: {
		forbiddenPlaceholders: [],
		requiredSections: ["Summary", "Scope", "Changes", "Acceptance Criteria", "Test Plan", "Risks", "Linear"],
		titlePattern: String.raw`^(?<type>[a-z]+)\((?<scope>[a-z0-9-]+)\): (?<subject>.+) \| (?<ticket>[A-Za-z]{2,}-\d+)$`,
	},
	ticket: {
		missingBranchLintBehavior: "fallback",
		normalization: "upper",
		pattern: "[a-z]{2,}-[0-9]+",
		patternFlags: "i",
		source: "auto",
	},
};
