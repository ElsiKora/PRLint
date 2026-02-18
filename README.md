# PRLint

Standalone pull request linting, generation, and create-or-update CLI.

PRLint enforces a consistent PR format across your team by validating titles, body sections, ticket references, and forbidden placeholders. It can also generate PR content from your diff and push it directly to GitHub.

## Installation

```bash
npm install -g @elsikora/prlint
```

Or as a dev dependency:

```bash
npm install --save-dev @elsikora/prlint
```

## Quick Start

Run PRLint from any git repository with an active branch:

```bash
# Lint the current PR against configured rules
prlint lint

# Generate a PR title and body from the current diff
prlint generate

# Generate and push a PR to GitHub in one step
prlint create

# Output results as JSON for CI integration
prlint lint --json
```

PRLint looks for a configuration file at `.elsikora/prlint.config.js` (or any format supported by [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) under the `prlint` key). If none is found, sensible defaults are used.

## Commands

### `prlint lint`

Lint the current PR against configured rules. Checks title format, required body sections, forbidden placeholders, and ticket correlation.

```bash
prlint lint
prlint lint --json
```

### `prlint generate`

Generate a PR title and body from the current diff using an LLM provider. The output follows the configured lint rules so it passes validation out of the box.

```bash
prlint generate
prlint generate --json
```

### `prlint create`

Generate PR content and create or update a GitHub pull request. Combines `generate` with a GitHub API call to open (or update) the PR on the configured repository.

```bash
prlint create
prlint create --json
```

### `prlint context`

Collect and display the PR context that PRLint uses internally: branch name, diff, changed files, and resolved ticket ID.

```bash
prlint context
prlint context --json
```

### `prlint fix`

Generate PR content, lint it, and iteratively fix any issues. Retries generation until the output passes all lint rules or the retry limit is reached.

```bash
prlint fix
prlint fix --json
```

## Configuration

Create `.elsikora/prlint.config.js` in your repository root:

```javascript
export default {
	github: {
		base: "main",
		draft: false,
		owner: "your-org",
		repo: "your-repo",
	},
	generation: {
		model: "gpt-4o-mini",
		provider: "openai",
		retries: 3,
		validationRetries: 3,
	},
	lint: {
		forbiddenPlaceholders: [
			"WIP",
			"TODO",
			"<!--",
			"TEMPLATE",
			"lorem ipsum",
			"[ ]",
			"<replace-me>",
		],
		requiredSections: [
			"Summary",
			"Scope",
			"Changes",
			"Acceptance Criteria",
			"Test Plan",
			"Risks",
			"Linear",
		],
		titlePattern: "^(?<type>[a-z]+)\\((?<scope>[a-z0-9-]+)\\): (?<subject>.+) \\| (?<ticket>[A-Za-z]{2,}-\\d+)$",
	},
	ticket: {
		normalization: "preserve",
		pattern: "[a-z]{2,}-[0-9]+",
		patternFlags: "i",
		source: "auto",
	},
};
```

See [docs/config.md](docs/config.md) for the full configuration reference.

## Default Lint Policy

When no configuration is provided, PRLint applies the following defaults.

### Title Pattern

Titles must match:

```
type(scope): subject | TICKET-123
```

The regex enforced is:

```
^(?<type>[a-z]+)\((?<scope>[a-z0-9-]+)\): (?<subject>.+) \| (?<ticket>[A-Za-z]{2,}-\d+)$
```

Examples of valid titles:

- `feat(auth): add OAuth2 login flow | AUTH-42`
- `fix(api): handle null response body | BUG-1337`

### Required Body Sections

The PR body must contain these `## ` headings in order:

1. Summary
2. Scope
3. Changes
4. Acceptance Criteria
5. Test Plan
6. Risks
7. Linear

### Forbidden Placeholders

The title and body must not contain any of the following (case-insensitive):

- `WIP`
- `TODO`
- `<!--`
- `TEMPLATE`
- `lorem ipsum`
- `[ ]`
- `<replace-me>`

## Ticket Resolution

PRLint can extract a ticket identifier from your branch name and validate that it appears in the PR title or body. The `ticket.source` option controls how ticket extraction works.

| Source | Behavior |
| --- | --- |
| `auto` | Try `branch-lint` first, then fall back to `pattern` |
| `branch-lint` | Use the `@elsikora/git-branch-lint` configuration to parse the branch name |
| `pattern` | Apply `ticket.pattern` (with `ticket.patternFlags`) directly to the branch name |
| `none` | Disable ticket extraction entirely |

The `ticket.normalization` option controls how the extracted ticket ID is cased before comparison:

| Normalization | Behavior |
| --- | --- |
| `preserve` | Keep the original case from the branch |
| `upper` | Convert to uppercase (e.g., `auth-42` becomes `AUTH-42`) |
| `lower` | Convert to lowercase (e.g., `AUTH-42` becomes `auth-42`) |

## Output Modes

Every command accepts a `--json` (or `-j`) flag. When set, PRLint outputs structured JSON to stdout instead of human-readable text. This is useful for CI pipelines and tooling integration.

```bash
prlint lint --json
```

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `GITHUB_TOKEN` | GitHub personal access token for the `create` command |
| `OPENAI_API_KEY` | API key when using the `openai` provider |
| `ANTHROPIC_API_KEY` | API key when using the `anthropic` provider |
| `GOOGLE_API_KEY` | API key when using the `google` provider |
| `OLLAMA_BASE_URL` | Base URL for a local Ollama instance (provider `ollama`) |

## License

MIT
