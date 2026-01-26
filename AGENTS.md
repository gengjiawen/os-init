# Repository Guidelines

## Project Structure

- `bin/`: Node CLI entrypoint (`bin/bin.js`) and command definitions (e.g., `set-codex`, `set-gemini`).
- `libs/`: TypeScript source for config writers/installers and setup utilities (main exports in `libs/index.ts`).
- `build/`: Compiled JS + `.d.ts` output from `tsc` (`outDir`), consumed by the CLI and published to npm.
- `dev-setup/`: Optional Docker-based dev environment (sshd + compose) for remote/portable workflows.
- `.github/workflows/`: CI (`nodejs.yml`) and automated releases via Release Please (`release-please.yml`).

## Build, Test, and Development Commands

Use `pnpm` (CI uses it).

- `pnpm install`: install dependencies.
- `pnpm dev`: run TypeScript compiler in watch mode.
- `pnpm build`: clean and compile to `build/` (then copies non-TS assets from `libs/`).
- `pnpm test`: run Jest (TypeScript via `ts-jest`).
- `pnpm format` / `pnpm format:check`: format or verify formatting with Prettier.

## Coding Style & Naming Conventions

- Formatting: Prettier (no semicolons, single quotes). Run `pnpm format` before pushing.
- TypeScript: strict options are enabled; prefer explicit, typed helpers over `any`.
- Naming: files are kebab-case in `libs/` (e.g., `gemini-cli.ts`); exported functions are `camelCase`.

## Testing Guidelines

- Framework: Jest + `ts-jest`.
- Naming: place tests next to code as `*.test.ts` (example: `libs/index.test.ts`).
- Keep tests hermetic: avoid writing to real user paths; prefer temp dirs/mocks when testing config output.

## Commit & Pull Request Guidelines

- Commits follow Conventional Commits (observed history): `feat: ...`, `fix: ...`, `refactor: ...`, `chore: ...`.
- Releases are automated on `master` via Release Please; don’t manually bump versions in PRs.
- PRs should include: a clear description, validation steps (`pnpm build && pnpm test && pnpm format:check`), and any relevant config/output examples.

## Security & Configuration Tips

- This repo generates local agent config files and may handle API keys. Never commit secrets or generated config files.
- When adding new setup commands, document where files are written and keep defaults safe/least-privilege.
