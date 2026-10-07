# Lumina ERP

A Next.js foundation for Lumina's operational management platform. Business modules are added incrementally and remain isolated by domain.

## Technology

Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, Zustand, PostgreSQL with Prisma. Use **pnpm only**; npm and Yarn are not supported.

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

Run these commands before opening a pull request:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Husky runs lint-staged before every commit. For staged application source files, it runs lint and type checking. GitHub Actions repeats lint, type checking, and the production build in a clean environment.

## Branching and delivery

```text
feat/* | fix/* | chore/*  →  hml  →  main
```

- `main` is the protected production branch. Changes reach it only through a pull request from `hml`.
- `hml` is the protected staging and QA branch. Create working branches from it and open pull requests back to it.
- Use `feat/`, `fix/`, `chore/`, or `hotfix/` prefixes. Keep branches and pull requests focused on one deliverable.
- Require a green CI run and resolved review comments before merging. Prefer squash merges.
- Use Conventional Commits in English. Examples: `feat: add inventory dashboard`, `fix: prevent duplicate transaction`, and `chore: update project tooling`.

## Code conventions

- Follow [ARCHITECTURE.md](ARCHITECTURE.md) before changing structure or conventions.
- Use the semantic palette defined in [docs/DESIGN.md](docs/DESIGN.md); do not introduce arbitrary interface colors.
- Keep domain-specific code inside `src/features/<feature-name>/`; promote code only when it is reused by two or more features.
- Shared UI belongs in `src/components`, reusable hooks in `src/hooks`, infrastructure helpers in `src/lib`, and cross-feature Zustand stores in `src/store`.
- Keep types colocated with their usage and import concrete files directly. Barrel files are not allowed.
- Keep business rules out of pages, layouts, and visual UI components. Database access belongs in the responsible feature service.

## Documentation

[ARCHITECTURE.md](ARCHITECTURE.md) is the technical reference. See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow and [docs/OPERACAO_E_GOVERNANCA.md](docs/OPERACAO_E_GOVERNANCA.md) for branch protection and deployment guidance.
