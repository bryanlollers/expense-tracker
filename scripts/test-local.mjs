import { execFileSync, spawnSync } from 'node:child_process'
// Only the disposable local Supabase stack is accepted. No key is written to disk.
const command = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const status = JSON.parse(
  execFileSync(command, ['supabase@2.119.0', 'status', '-o', 'json'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
)
if (!/^http:\/\/(127\.0\.0\.1|localhost):54321$/.test(status.API_URL))
  throw new Error(
    'Integration tests require the local Supabase stack on port 54321',
  )
const result = spawnSync(command, ['playwright', 'test'], {
  shell: process.platform === 'win32',
  stdio: 'inherit',
  env: {
    ...process.env,
    NUXT_PUBLIC_SUPABASE_URL: status.API_URL,
    NUXT_PUBLIC_SUPABASE_KEY: status.ANON_KEY,
    SUPABASE_TEST_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  },
})
process.exit(result.status ?? 1)
