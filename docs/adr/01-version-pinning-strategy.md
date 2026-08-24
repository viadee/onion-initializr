# ADR-0001: Dependency Version Pinning Strategy

## Context

The project generator depends on tightly coupled frontend
tooling ecosystems including:

- React
- TailwindCSS
- shadcn/ui

Using floating dependency versions (`^` for ShadCN, `@latest`) might cause:

- breaking CLI changes
- peer dependency conflicts
- incompatible generated templates
- unstable CI behavior

Examples encountered:

- shadcn CLI removed `--base-color`
- React 19 peer dependency issues for older ShadCN button versions

## Decision

The generator will:

- pin all critical framework/tooling versions exactly
- avoid `@latest`
- avoid caret (`^`) range for ShadCN
- maintain centralized version definitions for vulnerable dependencies

Critical pinned dependencies include:

- ShadCN
- React
- Vite
- TailwindCSS
- Radix UI packages

A centralized version configuration module will be used `(see lib/application/configuration/generated-project-versions.ts)`.

## Consequences

### Positive

- deterministic project generation
- reproducible CI builds
- easier debugging
- controlled upgrade process
- stable template compatibility

### Negative

- manual dependency upgrades required
- maintenance overhead for version updates
- periodic compatibility verification needed

## Alternatives Considered

### Using `@latest`

Rejected because upstream breaking changes caused generator failures.

### Using semantic versioning ranges (`^`) for ShadCN

Rejected because generated because anything > shadcn@2.7.0 breaks the generation process.

## Future Work

- generation E2E validation
