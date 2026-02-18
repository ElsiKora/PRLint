# Commitizen-Plugin-Commitlint-AI Architecture Study

## Scope

This report documents the architecture and quality conventions in `Commitizen-Plugin-Commitlint-AI` as a baseline for PRLint.

## Repository Baseline

- Canonical package: `@elsikora/commitizen-plugin-commitlint-ai`
- Canonical repository: `ElsiKora/Commitizen-Plugin-Commitlint-AI`
- Primary intent: AI-assisted commit message generation with deterministic commitlint validation.

## Architecture Map

The reference project follows a clean, layered structure aligned to `Domain -> Application -> Infrastructure -> Presentation`.

### Domain

- Entities and value objects define core concepts and constraints:
  - commit message primitives
  - ticket identifiers
  - provider/model enums
  - constants/policies
- Domain helpers contain pure transformation logic (for example, ticket injection behavior).

### Application

- Use cases orchestrate operations:
  - generate message
  - validate message
  - configure provider
  - manual/edit workflows
- Interfaces define inversion boundaries:
  - config service
  - LLM service
  - validator
  - ticket parser
  - repository abstraction

### Infrastructure

- Implements application interfaces:
  - provider clients (OpenAI, Anthropic, Google, Azure, AWS Bedrock, Ollama, mock)
  - git integration
  - commitlint validation integration
  - cosmiconfig-based configuration services
- Dependency injection container composes concrete services.

### Presentation

- Commitizen adapter provides command-facing UX and delegates to use cases.
- Presentation layer remains thin and does not hold domain logic.

## Config Model Map

The reference uses `cosmiconfig` with namespaced discovery and a layered defaults strategy.

### Discovery

- Multi-file lookup support (package JSON namespace + dedicated config files).
- Config module naming is explicit and scoped.

### Loading

- Config loader is a service in infrastructure.
- Loading result is cached for reuse within process lifetime.

### Merging

- Partial overrides are merged with defaults and explicit runtime input.
- Precedence model is deterministic.

### Defaults

- Ticket behavior defaults are explicit (source, pattern, normalization, fallback behavior).
- Retry defaults are explicit and bounded.

### Validation

- Type contracts are strict in TypeScript.
- Runtime normalization/guarding is performed at parser/service boundaries.

## Ticket Extraction Flow Map

Reference extraction is branch-centric and strategy-driven.

1. Resolve extraction strategy from config (`auto`, `branch-lint`, `pattern`, `none`).
2. If `auto`, attempt `git-branch-lint` pattern-aware extraction first.
3. If unavailable or non-matching (with fallback behavior), use local regex pattern extraction.
4. Normalize ticket based on configured normalization strategy.
5. Materialize as a strongly constrained ticket value object.
6. Inject/validate ticket in final generated artifact.

### Important Compatibility Behaviors

- Optional branch placeholders are considered during branch-lint extraction.
- Delimiter-aware matching improves compatibility with real branch naming.
- Normalization mode is explicit (`preserve`, `lower`, `upper`).

## Quality, Lint, and Testing Conventions Map

Reference quality stack is strict and layered:

- TypeScript strict mode
- ESLint + shared ruleset
- Prettier formatting
- Vitest unit/e2e suites
- Husky and lint-staged hooks
- Semantic release automation

### Quality Gate Pattern

- Lint gate
- Type gate
- Test gate
- Optional packaging/release checks

PRLint should mirror this gate pattern and make lint/type/unit checks first-class scripts.

## PRLint Parity Requirements Derived

1. Keep clean architecture layers physically separated in `src`.
2. Use DI as the only composition mechanism for service wiring.
3. Implement a `cosmiconfig`-based config service with strict precedence and defaults.
4. Keep ticket extraction strategy-based, with branch-lint compatible fallback behavior.
5. Preserve deterministic validation gate after generation.
6. Mirror strict lint/type/test conventions and scripts.
7. Keep presentation layer thin and orchestration-only.

## Notes On Intentional Differences For PRLint

- Product surface is PR-centric (title/body/create workflow) instead of commit-centric.
- Internal provider set remains built-in and service-abstracted.
- Naming remains AI-free for repository, package UX, and CLI surface.
