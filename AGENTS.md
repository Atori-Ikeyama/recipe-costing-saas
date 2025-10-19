# Repository Guidelines

## Project Structure & Module Organization
Primary application code lives under `app/` with App Router route groups such as `(dashboard)` and API handlers in `app/api`. Reusable primitives sit in `components/ui`. Shared domain logic lives in `lib/` (Drizzle schema in `lib/db`, auth helpers in `lib/auth`). Root configs (`next.config.ts`, `drizzle.config.ts`, `tsconfig.json`) stay in the project root alongside assets like `app/globals.css`.

## Build, Test, and Development Commands
- `pnpm install` — sync dependencies defined in `package.json` and `pnpm-lock.yaml`.
- `pnpm dev` — launch the Next.js dev server with Turbopack; visit `http://localhost:3000`.
- `pnpm build` / `pnpm start` — compile for production then serve the optimized build.
- `pnpm db:setup` — provision the database schema via `lib/db/setup.ts`.
- `pnpm db:seed` — load sample data; rerun after schema changes that need fixtures.
- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:studio` — manage Drizzle migrations and inspect data.

## Coding Style & Naming Conventions
Write application code in TypeScript using modern React (function components and hooks). Use 2-space indentation, trailing commas, and single quotes to match existing files. Name components in PascalCase (`RecipeTable.tsx`), colocate feature helpers with their route segment, and export shared utilities from `lib`. Tailwind classes stay inline; order them layout → typography → state for readable diffs. Environment variables follow upper snake case and live in `.env.local`.

## Testing Guidelines
Automated tests are not configured yet. When adding behaviors, include lightweight unit or integration coverage and wire it into a future `pnpm test` script so the team can run everything with one command. At minimum, manually verify key flows (auth, recipe costing, payment) against a seeded database before opening a PR and document new fixtures under `lib/db`.

## Commit & Pull Request Guidelines
Recent history mixes conventional prefixes (`fix:`, `feat:`) with descriptive sentences; prefer the `type: summary` style so logs stay scannable. Scope each commit to one logical change and reference issue IDs when available. PRs should describe the user impact, list testing evidence (commands run, screenshots for UI updates), and flag any schema or env changes. Request review from domain owners before merging.

## Security & Configuration Tips
Never commit secrets; store credentials in `.env.local` and reference them through Next.js runtime config. When altering Drizzle schemas, regenerate migrations and review them for destructive SQL before applying. Audit Stripe integrations in `lib/payments` whenever payment flows change to keep webhooks and API keys aligned.
