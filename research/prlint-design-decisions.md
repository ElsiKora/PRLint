# PRLint Design Decisions (From Mandatory Research)

## Decision Policy

This file defines what PRLint copies identically from reference repositories and what is intentionally adapted for PR-centric behavior.

## Copy-Identically Decisions

The following decisions are intentionally aligned with the reference architecture and quality model.

1. Clean layered architecture:
   - `domain`
   - `application`
   - `infrastructure`
   - `presentation`
2. DI-first composition with a single composition root in infrastructure.
3. `cosmiconfig` for configuration discovery/loading.
4. Strategy-based ticket resolution with branch-lint-aware behavior.
5. Deterministic validation gate after generated content.
6. Strict quality gates: lint, types, unit tests.
7. Strict TypeScript and strongly typed domain value objects.

## Intentional Differences

These are necessary because PRLint targets pull requests, not commit messages.

1. Primary artifact is PR title/body instead of commit message body/footer.
2. CLI commands are PR-focused (`lint`, `generate`, `create`, `context`, `fix`).
3. GitHub create-or-update behavior is mandatory and idempotent.
4. PR body section ordering is validated as a first-class policy.

## Naming Architecture Rules

All file naming in project code and configs must be lowercase.

### Required Naming Rules

- Lowercase only for all source/config/test filenames.
- Preferred format: `kebab-case`.
- Layer directories are lowercase (`src/domain`, `src/application`, `src/infrastructure`, `src/presentation`).
- Interface files use lowercase with role suffix:
  - `git-repo.interface.ts`
  - `llm-service.interface.ts`
- Use-case files use lowercase with `.use-case.ts` suffix:
  - `lint-pr.use-case.ts`

### Forbidden Naming Rules

- No pascal-case or camel-case filenames.
- No mixed casing in directory names.
- No command handlers with uppercase filename segments.

## DI/Container Architecture Rules

PRLint uses containerized construction only.

### Composition Root

- Single composition root file in infrastructure (container module).
- All concrete service instantiation is centralized in that root.

### Registration Map

- Register interfaces/tokens for:
  - `IConfigService`
  - `IGitRepo`
  - `IGitHubRepo`
  - `ILlmService`
  - all use cases

### Lifecycle

- Stateless services are singleton by default.
- Request-like command context objects are transient/factory-created when needed.

### Construction Prohibitions

- No direct `new` usage in CLI handlers or use-case classes for infrastructure dependencies.
- No hidden singleton side effects outside container setup.

## Rule Consistency Matrix

| Rule Area | Source Of Truth | Enforcement |
| --- | --- | --- |
| PR title format | PRLint lint config/default policy | Lint gate |
| Branch-ticket correlation | git branch + ticket strategy | Lint gate |
| Body section order | PRLint policy | Lint gate |
| Placeholder artifacts | PR text content | Lint gate |
| Output schema | presenter contracts | Human/JSON presenters |

## Idempotent `create` Decision Model

1. Resolve git branch head.
2. Resolve repo target (`owner/repo/base`) from config/flags.
3. Query open PRs matching `head + base`.
4. If matching PR exists: update title/body/draft as requested.
5. If no match: create PR.
6. Return deterministic output payload for both paths.

## Parity Checklist (Must Be Green)

- [x] R1 architecture map documented
- [x] R2 rule semantics documented
- [x] Lowercase naming contract documented
- [x] DI-only container contract documented
- [x] `cosmiconfig`-through-service contract documented
- [x] Quality gate parity documented (lint/types/unit)
- [x] PR-specific differences explicitly documented

## Implementation Guardrails

1. Any new module must declare its layer ownership and dependency direction.
2. Any new rule must be represented in both human and JSON outputs.
3. Generation must never bypass lint; it always runs deterministic lint after generation.
4. `fix` must be bounded by configured retry limits.
