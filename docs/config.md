# Configuration Reference

PRLint is configured through a JavaScript (or JSON/YAML) file discovered by [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig). The recommended location is `.elsikora/prlint.config.js` at the repository root.

The configuration object has four top-level sections: `github`, `ticket`, `lint`, and `generation`.

---

## `github`

Settings for GitHub API interaction, used by the `create` command.

| Field                | Type       | Default              | Description                                   |
| -------------------- | ---------- | -------------------- | --------------------------------------------- |
| `base`               | `string`   | `"dev"`              | Base branch that PRs target                   |
| `draft`              | `boolean`  | `false`              | Whether to create the PR as a draft           |
| `prohibitedBranches` | `string[]` | `["main", "master"]` | Branches that are blocked for `prlint create` |

### Example

```javascript
export default {
	github: {
		base: "develop",
		draft: true,
		prohibitedBranches: ["main", "master"],
	},
};
```

---

## `ticket`

Controls how PRLint extracts a ticket identifier from the current branch name and normalizes it for lint correlation.

| Field                       | Type     | Default              | Description                                                                                                                         |
| --------------------------- | -------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `source`                    | `string` | `"auto"`             | Ticket extraction strategy. One of `"auto"`, `"branch-lint"`, `"pattern"`, `"none"`                                                 |
| `pattern`                   | `string` | `"[a-z]{2,}-[0-9]+"` | Regular expression applied to the branch name when `source` is `"pattern"` or `"auto"` (fallback)                                   |
| `patternFlags`              | `string` | `"i"`                | Flags passed to the `RegExp` constructor for `pattern`                                                                              |
| `normalization`             | `string` | `"preserve"`         | How the extracted ticket ID is cased. One of `"preserve"`, `"upper"`, `"lower"`                                                     |
| `missingBranchLintBehavior` | `string` | `"fallback"`         | Behavior when `source` is `"branch-lint"` but no compatible `git-branch-lint` ticket pattern exists. One of `"fallback"`, `"error"` |

### Source Strategies

**`auto`** (default) -- Uses `branch-lint` only when `rules["branch-name-pattern"]` exists and contains `:ticket`; otherwise falls back to `pattern`. If `branch-lint` is configured and branch matched without ticket (optional ticket placeholder), fallback is skipped.

**`branch-lint`** -- Reads `@elsikora/git-branch-lint` rules and extracts ticket from placeholders. If compatible rules are missing, behavior depends on `missingBranchLintBehavior`.

**`pattern`** -- Applies the `pattern` regex directly to the branch name. The first match is used as the ticket ID.

**`none`** -- Disables ticket extraction. No ticket correlation lint check is performed.

### Normalization

| Value        | Effect                                                                 |
| ------------ | ---------------------------------------------------------------------- |
| `"preserve"` | The ticket ID keeps whatever case the branch name uses                 |
| `"upper"`    | Converted to uppercase before comparison (`auth-42` becomes `AUTH-42`) |
| `"lower"`    | Converted to lowercase before comparison (`AUTH-42` becomes `auth-42`) |

### Example

```javascript
export default {
	ticket: {
		source: "pattern",
		pattern: "[A-Z]{2,}-\\d+",
		patternFlags: "",
		normalization: "preserve",
		missingBranchLintBehavior: "fallback",
	},
};
```

---

## `lint`

Defines the rules enforced by the `lint` (and `fix`) commands.

| Field                   | Type       | Default   | Description                                                          |
| ----------------------- | ---------- | --------- | -------------------------------------------------------------------- |
| `titlePattern`          | `string`   | See below | Regular expression the PR title must match                           |
| `requiredSections`      | `string[]` | See below | `## ` headings that must appear in the PR body                       |
| `forbiddenPlaceholders` | `string[]` | See below | Strings that must not appear in the title or body (case-insensitive) |

### `titlePattern`

Default:

```regex
^(?<type>[a-z]+)\((?<scope>[a-z0-9-]+)\): (?<subject>.+) \| (?<ticket>[A-Za-z]{2,}-\d+)$
```

This enforces the format `type(scope): subject | TICKET-123`. Set to an empty string to disable title validation.

Named capture groups in the default pattern:

| Group     | Matches                                       |
| --------- | --------------------------------------------- |
| `type`    | Lowercase type such as `feat`, `fix`, `chore` |
| `scope`   | Lowercase alphanumeric scope with hyphens     |
| `subject` | Free-text description                         |
| `ticket`  | Ticket identifier like `AUTH-42`              |

### `requiredSections`

Default:

```javascript
["Summary", "Scope", "Changes", "Acceptance Criteria", "Test Plan", "Risks", "Linear"];
```

Each entry corresponds to a `## Heading` that must be present in the PR body. Set to an empty array to disable section validation.

### `forbiddenPlaceholders`

Default:

```javascript
["WIP", "TODO", "<!--", "TEMPLATE", "lorem ipsum", "[ ]", "<replace-me>"];
```

If any of these strings appear in the PR title or body (compared case-insensitively), the lint check fails. Set to an empty array to disable placeholder validation.

### Example

```javascript
export default {
	lint: {
		titlePattern: "^\\[(?<ticket>[A-Z]+-\\d+)\\] (?<subject>.+)$",
		requiredSections: ["Summary", "Changes", "Test Plan"],
		forbiddenPlaceholders: ["WIP", "TODO"],
	},
};
```

---

## `generation`

Configures the LLM provider used by the `generate`, `create`, and `fix` commands.

| Field               | Type     | Default | Description                                                            |
| ------------------- | -------- | ------- | ---------------------------------------------------------------------- |
| `provider`          | `string` | _unset_ | LLM provider. One of `"openai"`, `"anthropic"`, `"google"`, `"ollama"` |
| `model`             | `string` | _unset_ | Model identifier passed to the provider                                |
| `retries`           | `number` | `3`     | Maximum number of generation attempts                                  |
| `validationRetries` | `number` | `3`     | Maximum number of lint-fix cycles (used by the `fix` command)          |

### Providers

**`openai`** -- Requires `OPENAI_API_KEY` in the environment.

**`anthropic`** -- Requires `ANTHROPIC_API_KEY` in the environment.

**`google`** -- Requires `GOOGLE_API_KEY` in the environment.

**`ollama`** -- Connects to a local Ollama instance. Set `OLLAMA_BASE_URL` if it is not running on the default address.

### Example

```javascript
export default {
	generation: {
		provider: "anthropic",
		model: "claude-sonnet-4-20250514",
		retries: 5,
		validationRetries: 2,
	},
};
```

---

## Full Configuration Example

```javascript
export default {
	github: {
		base: "dev",
		draft: false,
		prohibitedBranches: ["main", "master"],
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
		missingBranchLintBehavior: "fallback",
		normalization: "preserve",
		pattern: "[a-z]{2,}-[0-9]+",
		patternFlags: "i",
		source: "auto",
	},
};
```

---

## Common Setups

### Minimal -- Lint Only

Disable generation entirely and enforce just the title format:

```javascript
export default {
	lint: {
		titlePattern: "^(?<type>[a-z]+): (?<subject>.+)$",
		requiredSections: [],
		forbiddenPlaceholders: ["WIP"],
	},
	ticket: {
		source: "none",
	},
};
```

### Jira Tickets with Uppercase Normalization

```javascript
export default {
	ticket: {
		source: "pattern",
		pattern: "[A-Z]{2,}-\\d+",
		patternFlags: "i",
		normalization: "upper",
	},
	lint: {
		titlePattern: "^\\[(?<ticket>[A-Z]+-\\d+)\\] (?<subject>.+)$",
		requiredSections: ["Summary", "Changes"],
		forbiddenPlaceholders: ["WIP", "TODO"],
	},
};
```

### Local Ollama for Generation

```javascript
export default {
	generation: {
		provider: "ollama",
		model: "llama3",
		retries: 5,
		validationRetries: 5,
	},
};
```

Set `OLLAMA_BASE_URL` in your environment if the server is not at `http://localhost:11434`.

### Draft PRs on a Develop Branch

```javascript
export default {
	github: {
		base: "develop",
		draft: true,
		prohibitedBranches: ["main", "master"],
	},
};
```
