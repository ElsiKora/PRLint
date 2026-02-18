# Naming And Parity Contract

## Purpose

This document defines enforceable architecture, naming, DI, config, and quality parity rules for PRLint.

## Reference Parity Targets

PRLint aligns with conventions observed in:

- `Commitizen-Plugin-Commitlint-AI`
- `Git-Branch-Lint`

## File And Directory Naming

### Required

- All filenames are lowercase only.
- Preferred style is `kebab-case`.
- All directories are lowercase.
- Suffix conventions:
  - `*.interface.ts`
  - `*.use-case.ts`
  - `*.policy.ts`
  - `*.service.ts`
  - `*.adapter.ts`

### Forbidden

- Uppercase filename segments.
- Mixed-case directory names.
- Layer directories with alternative naming conventions.

## Clean Architecture Layer Contract

Layer boundaries are strict:

- `domain`: pure business rules and value objects.
- `application`: use-case orchestration and interfaces.
- `infrastructure`: external integrations and adapters.
- `presentation`: CLI input/output and command routing.

Dependency rule:

- Outer layers may depend on inner layers.
- Inner layers must not depend on outer layers.

## DI-Only Construction Contract

- All infrastructure dependencies are created in one composition root.
- CLI handlers and use cases receive dependencies via interfaces.
- No direct concrete instantiation in presentation/application layers.
- Container registration is explicit and testable.

## Cosmiconfig-Only Config Loading Contract

- Configuration discovery/loading is handled by a DI-resolved config service.
- Service uses `cosmiconfig` search conventions.
- Config precedence order:
  1. CLI flags
  2. environment variables
  3. config file
  4. built-in defaults

## Tooling And Quality Parity Contract

Required checks:

- `npm run lint`
- `npm run lint:types`
- `npm run test:unit`

Required tooling categories:

- TypeScript strict mode
- ESLint + Prettier
- Vitest (unit and command-level integration where applicable)
- Hook/check support (`husky`, `lint-staged`) for local quality parity

## Enforcement Checklist

- [ ] all new files are lowercase
- [ ] dependency direction follows clean architecture
- [ ] all services resolved through DI container
- [ ] config reads happen only via config service
- [ ] all changes pass lint/types/unit gates
- [ ] command output supports human and JSON formats
