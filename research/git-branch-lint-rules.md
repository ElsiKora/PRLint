# Git-Branch-Lint Rule Semantics Study

## Scope

This report captures branch rule semantics from `Git-Branch-Lint` and translates them into parity requirements for PRLint ticket correlation and naming checks.

## Repository Baseline

- Canonical package: `@elsikora/git-branch-lint`
- Canonical repository: `ElsiKora/Git-Branch-Lint`
- Primary intent: deterministic branch naming validation and guided branch creation.

## Branch Pattern Semantics

`Git-Branch-Lint` uses tokenized placeholders in route-like patterns.

### Placeholder Format

- Placeholder syntax: `:placeholder`
- Typical placeholders: `:type`, `:ticket`, `:name`, `:scope`, `:description`
- Example pattern: `:type/:ticket-:name`

### Semantics Of `:type/:ticket-:name`

- `:type` usually maps to configured branch type values.
- `:ticket-` means `ticket` is optional with a `-` suffix coupling.
- `:name` represents the subject portion and must match configured/default subject pattern.

This yields two acceptable variants:

1. `:type/:ticket-:name` (ticket present)
2. `:type/:name` (ticket omitted)

## Optional Placeholder Behavior

- Optional placeholders are modeled by suffixed token forms (for example `:ticket-`).
- Validation evaluates generated variants that include/exclude optional token segments.
- Normalization collapses redundant delimiters after optional removal.

### Practical Impact

- Pattern matching stays strict but flexible.
- Optional ticket support is deterministic, not fuzzy.

## Subject Pattern Behavior

Pattern resolution follows a precedence model:

1. `:type` uses configured branch types.
2. Per-placeholder subject pattern (object form) takes precedence for specific placeholders.
3. `:ticket` uses ticket-specific default unless overridden.
4. Shared subject pattern (string form) applies to remaining placeholders.
5. Built-in fallback subject pattern applies last.

This ordering is important for compatibility and must be preserved when deriving rules in PRLint.

## Ticket Constraints And Extraction Rules

- Default ticket semantics: `<letters>-<digits>` (project key style).
- Ticket values are normalization-sensitive and typically lowercased in branch workflows.
- Validation behavior is deterministic:
  - invalid ticket format fails pattern validation
  - optional ticket omission passes only when optional semantics permit it

## Normalization And Compatibility Decisions

`Git-Branch-Lint` behavior implies the following normalization expectations:

- Collapse repeated delimiters in generated/normalized names.
- Trim edge delimiters.
- Keep pattern parsing deterministic and token-order aware.
- Preserve variant generation for optional placeholders to avoid false negatives.

## PRLint Integration Rules Derived

1. Parse `git-branch-lint` configuration for canonical ticket derivation whenever available.
2. Support optional ticket placeholder behavior equivalent to `:ticket-`.
3. Apply branch-derived ticket correlation against PR title/body using strict matching rules.
4. Make normalization strategy configurable (`preserve`, `lower`, `upper`), with deterministic comparison.
5. Ensure failure messages show which rule failed (pattern mismatch, ticket mismatch, missing section, placeholder artifact).

## Test Matrix Required In PRLint

At minimum, PRLint should include unit tests for:

- `:type/:ticket-:name` with ticket present
- `:type/:ticket-:name` with ticket omitted
- invalid ticket format in branch and title mismatch
- normalization behavior differences (`preserve` vs `lower` vs `upper`)
- fallback behavior when `git-branch-lint` config is missing
