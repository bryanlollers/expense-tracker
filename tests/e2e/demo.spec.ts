import { test, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

test.skip(
  process.env.NUXT_PUBLIC_DEMO_MODE === 'false',
  'Public demo tests require demo mode',
)

test('public demo persists edits, isolates visitors, exports and resets without Supabase requests', async ({
  page,
  browser,
}) => {
  const remote: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('.supabase.co')) remote.push(request.url())
  })
  await page.goto('/')
  await expect(
    page.locator('main').getByText('Demo workspace', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('table', { name: 'Transactions', exact: true }),
  ).toBeVisible()
  await mkdir('docs/screenshots', { recursive: true })
  await page.screenshot({
    path: 'docs/screenshots/demo-dashboard.png',
    fullPage: true,
  })
  await page.goto('/register')
  await expect(page).toHaveURL('/')
  await page.goto('/transactions')
  await page
    .getByRole('button', { name: 'Add transaction', exact: true })
    .click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Amount', { exact: true }).fill('24.50')
  await dialog
    .getByLabel('Category', { exact: true })
    .selectOption({ label: 'Food & dining' })
  await dialog
    .getByLabel('Description', { exact: false })
    .fill('Demo test lunch')
  await dialog.getByLabel('Receipt', { exact: false }).setInputFiles({
    name: 'receipt.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\nreceipt\n%%EOF'),
  })
  await dialog
    .getByRole('button', { name: 'Add transaction', exact: true })
    .click()
  await expect(dialog).toHaveCount(0)
  await page.reload()
  await page.getByLabel('Search', { exact: true }).fill('Demo test lunch')
  await page
    .getByRole('link', { name: /Demo test lunch/ })
    .first()
    .click()
  await expect(page.getByRole('button', { name: 'View receipt' })).toBeVisible()
  await page.getByRole('button', { name: 'Edit transaction' }).click()
  await page
    .getByRole('dialog')
    .getByLabel('Amount', { exact: true })
    .fill('30')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByRole('heading', { name: '−$30.00' })).toBeVisible()
  const visitor = await browser.newContext()
  try {
    const other = await visitor.newPage()
    await other.goto('http://localhost:3000/transactions')
    await other.getByLabel('Search', { exact: true }).fill('Demo test lunch')
    await expect(
      other.getByRole('link', { name: /Demo test lunch/ }),
    ).toHaveCount(0)
  } finally {
    await visitor.close()
  }
  await page.goto('/categories')
  await page.getByRole('button', { name: 'Add category' }).click()
  await page
    .getByRole('dialog')
    .getByLabel('Name', { exact: true })
    .fill('Travel fund')
  await page.getByRole('button', { name: 'Save category' }).click()
  await expect(page.getByRole('heading', { name: 'Travel fund' })).toBeVisible()
  await page.goto('/profile')
  await page.getByLabel('Full name').fill('Demo Visitor')
  await page.getByLabel('Display currency').selectOption('PHP')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await page.reload()
  await expect(page.getByLabel('Full name')).toHaveValue('Demo Visitor')
  await expect(page.getByLabel('Display currency')).toHaveValue('PHP')
  await page.getByLabel('Display currency').selectOption('USD')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await page.goto('/budgets')
  await page.getByRole('button', { name: 'Edit overall budget' }).click()
  await page.getByRole('dialog').getByLabel('Monthly limit').fill('2800')
  await page.getByRole('button', { name: 'Save budget' }).click()
  await expect(page.getByText('$2,800.00')).toBeVisible()
  await page.goto('/reports')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export CSV' }).click()
  expect((await download).suggestedFilename()).toContain('expense-tracker-')
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Reset demo' })
    .click()
  await expect(page).toHaveURL('/')
  await page.goto('/transactions')
  await page.getByLabel('Search', { exact: true }).fill('Demo test lunch')
  await expect(page.getByRole('link', { name: /Demo test lunch/ })).toHaveCount(
    0,
  )
  expect(remote).toEqual([])
})

test('mobile demo fits the viewport and exposes navigation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(
    page.getByRole('table', { name: 'Transactions', exact: true }),
  ).toBeVisible()
  await page.screenshot({
    path: 'docs/screenshots/demo-mobile.png',
    fullPage: true,
  })
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390)
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page
    .getByRole('dialog')
    .getByRole('link', { name: 'Transactions' })
    .click()
  await expect(page).toHaveURL('/transactions')
})
