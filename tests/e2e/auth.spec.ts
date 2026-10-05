import { test, expect } from '@playwright/test'
test.skip(
  process.env.NUXT_PUBLIC_DEMO_MODE !== 'false',
  'Authentication tests run in Supabase mode',
)
test('protected pages redirect to login and preserve the requested path', async ({
  page,
}) => {
  await page.goto('/transactions')
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible()
  await expect(page.getByLabel('Email address')).toBeVisible()
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute(
    'type',
    'password',
  )
})
test('registration is accessible on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/register')
  await expect(
    page.getByRole('heading', { name: 'Start your next chapter' }),
  ).toBeVisible()
  await expect(page.getByLabel('Full name')).toBeVisible()
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute(
    'minlength',
    '8',
  )
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
