# Verification

[Live demo](https://expense-tracker-iota-flax-96.vercel.app)

Verified October 5, 2026 with Chromium and a disposable local Supabase stack. CI uses Node 24 LTS.

- Lint, formatting, TypeScript, and production builds pass.
- 43 unit/component tests, 2 demo browser tests, 3 authenticated browser tests, and 26 database security tests pass.
- Tests cover authentication, calculations, validation, demo persistence, visitor isolation, receipts, and RLS. Temporary integration accounts are removed afterward.

Known limitations: the last dependency audit reported 16 upstream advisories (14 high, 2 low). Receipt and database writes are separate operations, so failed cleanup can leave unused private objects. Display currencies do not convert amounts.
