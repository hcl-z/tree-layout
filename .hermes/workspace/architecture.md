### Tech Stack
- **Language:** TypeScript (strict mode, ESNext target)
- **Runtime:** Node.js
- **Toolchain:** Vite+ (`vp` CLI) — wraps tsdown (bundling), vitest (testing), oxlint (linting), oxfmt (formatting)
- **Package manager:** pnpm 10.x
- **Module format:** ESM (`"type": "module"`)
- **Type generation:** tsgo (native TypeScript compiler preview)

### Directory Structure
```
src/           — Library source code (entry: index.ts)
tests/         — Unit tests (vitest via vp test)
dist/          — Build output (gitignored)
vite.config.ts — Vite+ config (pack, lint, fmt, staged hooks)
```

### Key Design Decisions
- Single entry point (`src/index.ts` → `dist/index.mjs`)
- Type-aware linting enabled via oxlint
- Pre-commit staged hook runs `vp check --fix`
- DTS generation uses the experimental `tsgo` compiler
