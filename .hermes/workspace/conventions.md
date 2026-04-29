### Naming
- **Variables/functions:** camelCase
- **Files:** kebab-case (e.g., `index.ts`, `index.test.ts`)

### Module Format
- ESM throughout (`"type": "module"`, `verbatimModuleSyntax: true`)
- Imports use `.ts` extensions (`allowImportingTsExtensions: true`)

### Testing
- Tests live in `tests/` directory, named `*.test.ts`
- Import test utilities from `vite-plus/test`

### Formatting & Linting
- Managed by Vite+ (`vp check` runs lint + type-check, `vp check --fix` auto-fixes)
- oxfmt for formatting, oxlint for linting
- Pre-commit hook: `vp check --fix` on staged files

### Build & Publish
- `vp pack` to build, `vp test` to test
- Published as public npm package with `dist/` in files
