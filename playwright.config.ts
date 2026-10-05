import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 1440, height: 1000 },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer:
      !process.env.CI && !process.env.SUPABASE_TEST_SERVICE_ROLE_KEY,
    timeout: 120000,
  },
})
