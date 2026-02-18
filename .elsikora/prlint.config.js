export default {
	github: {
		base: "main",
		draft: false,
	},
	generation: {
		model: "gpt-4o-mini",
		provider: "openai",
		retries: 3,
		validationRetries: 3,
	},
	lint: {
		forbiddenPlaceholders: ["WIP", "TODO", "<!--", "TEMPLATE", "lorem ipsum", "[ ]", "<replace-me>"],
		requiredSections: ["Summary", "Scope", "Changes", "Acceptance Criteria", "Test Plan", "Risks", "Linear"],
		titlePattern: "^(?<type>[a-z]+)\\((?<scope>[a-z0-9-]+)\\): (?<subject>.+) \\| (?<ticket>[A-Za-z]{2,}-\\d+)$",
	},
	ticket: {
		normalization: "preserve",
		pattern: "[a-z]{2,}-[0-9]+",
		patternFlags: "i",
		source: "auto",
	},
};
