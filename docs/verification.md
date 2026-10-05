# Verification record

Verified locally on October 5, 2026 (Asia/Shanghai), using Windows, Node 22.13.1, npm 10.9.2, Chromium, and a disposable Docker Supabase stack with PostgreSQL 15.19. Node 24 LTS is recommended for development and used by CI; some transitive CLI tools require a newer Node version than the local host.

| Check                     | Result                                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| Clean lockfile install    | `npm ci` supported; lockfile synchronized                                                                 |
| ESLint                    | Pass                                                                                                      |
| Prettier                  | Pass                                                                                                      |
| Strict TypeScript         | Pass                                                                                                      |
| Unit/component tests      | 36 pass                                                                                                   |
| PostgreSQL migration      | Applied successfully on local Supabase                                                                    |
| pgTAP security tests      | 26 pass                                                                                                   |
| Playwright smoke tests    | 2 pass                                                                                                    |
| Real Supabase integration | Auth, persistence, transactions, receipts, category ownership, budgets, export, mobile navigation, logout |
| Nuxt production build     | Pass (standalone and Vercel presets)                                                                      |
| Hosted Vercel deployment  | Prepared; not deployed                                                                                    |
| Hosted Supabase project   | Connected; both migrations applied; RLS and private receipt bucket verified                               |

Screenshots use a temporary test account and synthetic financial records. Integration fixtures are removed after each run. No hosted-account credentials or service-role keys are stored in the repository. The ignored `.env` contains the hosted Supabase URL and public publishable key. Local-stack configuration is retained in a Git-ignored backup.

At final verification, `npm audit` reports 16 advisories: 14 high and 2 low; none are critical.

The dependency audit is not clean. The Nuxt 3/Tailwind 3 dependency graph includes upstream advisories with no compatible patched registry releases available at this date. Audit suggestions involving major framework downgrades were not applied. Vitest was updated to 4.1.11 to address its reported mock-server advisory. Review `npm audit` again before deployment; passing application tests does not resolve upstream security advisories.

Receipt writes and database writes are not one atomic transaction. Compensating cleanup handles common failures; network failures can leave unused private objects. The README documents this limitation and scheduled reconciliation as future work.
