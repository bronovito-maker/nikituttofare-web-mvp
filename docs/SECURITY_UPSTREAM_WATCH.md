# Security Upstream Watch (Next/PostCSS)

## Current Status (2026-05-03)
- `npm audit` reports 2 moderate vulnerabilities.
- Root cause is transitive `postcss` bundled under `next`.
- Project is already on latest available `next` (`16.2.4`) at the time of check.

## Policy
1. Run `npm run audit:watch` on every dependency update and before each deploy.
2. If `next` patch/minor is released:
   - update `next` and related `@next/*` packages
   - run full pre-deploy suite
   - re-check `npm audit`
3. Close this watch only when `npm audit` no longer reports `next -> postcss`.

## Fast Command Set
```bash
npm run audit:watch
npm install next@latest @next/bundle-analyzer@latest
npm run lint
npx tsc --noEmit
npm test -- --run
npm run build
```
