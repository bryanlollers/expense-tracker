import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { mkdir } from 'node:fs/promises'
import { localDate } from '../../utils/finance'
const url = process.env.NUXT_PUBLIC_SUPABASE_URL || ''
const adminKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || ''
const anonKey = process.env.NUXT_PUBLIC_SUPABASE_KEY || ''
test('real Supabase workspace: CRUD, budgets, export, receipts, and account isolation', async ({
  page,
}) => {
  test.skip(
    !adminKey,
    'Run npm run test:integration with a local Supabase stack',
  )
  expect(url).toMatch(/^http:\/\/(127\.0\.0\.1|localhost):54321$/)
  test.setTimeout(120000)
  const admin = createClient(url, adminKey, { auth: { persistSession: false } })
  const password = `Ledger-${crypto.randomUUID()}`
  const email = `portfolio-${Date.now()}@example.test`
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Alex Morgan' },
  })
  if (created.error) throw created.error
  const userId = created.data.user.id
  let bobId: string | undefined
  try {
    const categories = await admin
      .from('categories')
      .select('*')
      .eq('user_id', userId)
    const food = categories.data!.find((c) => c.name === 'Food & dining')!
    const salary = categories.data!.find((c) => c.name === 'Salary')!
    const shopping = categories.data!.find((c) => c.name === 'Shopping')!
    const today = localDate()
    const month = today.slice(0, 7)
    const seed = await admin.from('transactions').insert([
      {
        user_id: userId,
        type: 'income',
        category_id: salary.id,
        amount: 6200,
        transaction_date: today,
        description: 'Monthly salary',
      },
      {
        user_id: userId,
        type: 'expense',
        category_id: shopping.id,
        amount: 248,
        transaction_date: today,
        description: 'Weekend essentials',
      },
      {
        user_id: userId,
        type: 'expense',
        category_id: food.id,
        amount: 86.5,
        transaction_date: today,
        description: 'Dinner with friends',
      },
    ])
    if (seed.error) throw seed.error
    await admin.from('budgets').insert([
      { user_id: userId, month: `${month}-01`, amount: 2400 },
      {
        user_id: userId,
        month: `${month}-01`,
        category_id: food.id,
        amount: 400,
      },
      {
        user_id: userId,
        month: `${month}-01`,
        category_id: shopping.id,
        amount: 500,
      },
    ])
    for (let offset = 1; offset <= 5; offset++) {
      const date = new Date()
      date.setDate(1)
      date.setMonth(date.getMonth() - offset)
      await admin.from('transactions').insert([
        {
          user_id: userId,
          type: 'income',
          category_id: salary.id,
          amount: 5500 + offset * 100,
          transaction_date: localDate(date),
          description: 'Monthly salary',
        },
        {
          user_id: userId,
          type: 'expense',
          category_id: food.id,
          amount: 1800 + offset * 80,
          transaction_date: localDate(date),
          description: 'Monthly living expenses',
        },
      ])
    }
    await page.goto('/login')
    await page.getByLabel('Email address').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(page).toHaveURL('/')
    await expect(
      page.getByText('Monthly salary', { exact: true }).first(),
    ).toBeVisible()
    await expect(
      page.getByRole('status').filter({ hasText: 'Loading' }),
    ).toHaveCount(0)
    await mkdir('docs/screenshots', { recursive: true })
    await page.screenshot({
      path: 'docs/screenshots/dashboard.png',
      fullPage: true,
    })
    await page.reload()
    await expect(
      page.getByRole('heading', { name: /Your money, at a glance/ }),
    ).toBeVisible()
    await page.goto('/transactions')
    await page
      .getByRole('button', { name: 'Add transaction', exact: true })
      .click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Amount', { exact: true }).fill('24.50')
    await dialog.getByLabel('Category', { exact: true }).selectOption(food.id)
    await dialog
      .getByLabel('Description', { exact: false })
      .fill('Integration lunch')
    await dialog.getByLabel('Receipt', { exact: false }).setInputFiles({
      name: 'receipt.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\nreceipt test\n%%EOF'),
    })
    await dialog
      .getByRole('button', { name: 'Add transaction', exact: true })
      .click()
    await expect(dialog).toHaveCount(0)
    await page.getByLabel('Search', { exact: true }).fill('Integration lunch')
    await page
      .getByRole('link', { name: /Integration lunch/ })
      .first()
      .click()
    await expect(
      page.getByRole('heading', { name: 'Transaction details' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'View receipt' }),
    ).toBeVisible()
    const id = page.url().split('/').pop()!
    const alice = createClient(url, anonKey, {
      auth: { persistSession: false },
    })
    await alice.auth.signInWithPassword({ email, password })
    const own = await alice
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single()
    expect(own.error).toBeNull()
    const ownReceipt = await alice.storage
      .from('receipts')
      .createSignedUrl(own.data!.receipt_path, 60)
    expect(ownReceipt.error).toBeNull()
    const bob = await admin.auth.admin.createUser({
      email: `bob-${Date.now()}@example.test`,
      password,
      email_confirm: true,
    })
    if (bob.error) throw bob.error
    bobId = bob.data.user.id
    const other = createClient(url, anonKey, {
      auth: { persistSession: false },
    })
    await other.auth.signInWithPassword({
      email: bob.data.user.email!,
      password,
    })
    expect(
      (await other.from('transactions').select('*').eq('id', id)).data,
    ).toEqual([])
    expect(
      (
        await other.storage
          .from('receipts')
          .createSignedUrl(own.data!.receipt_path, 60)
      ).error,
    ).not.toBeNull()
    expect(
      (
        await other.from('transactions').insert({
          user_id: bobId,
          type: 'expense',
          amount: 1,
          category_id: food.id,
          transaction_date: today,
        })
      ).error?.code,
    ).toBe('23503')
    await page.getByRole('button', { name: 'Edit transaction' }).click()
    await page
      .getByRole('dialog')
      .getByLabel('Amount', { exact: true })
      .fill('30')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByRole('heading', { name: '−$30.00' })).toBeVisible()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete', exact: true })
      .click()
    await expect(page).toHaveURL('/transactions')
    expect(
      (
        await alice.storage
          .from('receipts')
          .createSignedUrl(own.data!.receipt_path, 60)
      ).error,
    ).not.toBeNull()
    await page.goto('/budgets')
    await expect(page.getByText('Total monthly budget')).toBeVisible()
    await page.getByRole('button', { name: 'Edit overall budget' }).click()
    await page.getByRole('dialog').getByLabel('Monthly limit').fill('2800')
    await page.getByRole('button', { name: 'Save budget' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByText('$2,800.00')).toBeVisible()
    await page.goto('/categories')
    await page.getByRole('button', { name: 'Add category' }).click()
    await page
      .getByRole('dialog')
      .getByLabel('Name', { exact: true })
      .fill('Travel fund')
    await page.getByRole('button', { name: 'Save category' }).click()
    await expect(
      page.getByRole('heading', { name: 'Travel fund' }),
    ).toBeVisible()
    await page.goto('/reports')
    await expect(
      page.getByRole('status').filter({ hasText: 'Loading' }),
    ).toHaveCount(0)
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export CSV' }).click()
    expect((await download).suggestedFilename()).toContain('ledger-')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await expect(
      page.getByRole('heading', { name: /Your money, at a glance/ }),
    ).toBeVisible()
    await page.screenshot({
      path: 'docs/screenshots/mobile.png',
      fullPage: true,
    })
    const overflow = await page.evaluate(() => ({
      width: window.innerWidth,
      scroll: document.documentElement.scrollWidth,
      elements: [...document.querySelectorAll('body *')]
        .filter(
          (el) =>
            el.getBoundingClientRect().right > window.innerWidth + 1 &&
            getComputedStyle(el).position !== 'absolute',
        )
        .slice(0, 10)
        .map((el) => ({
          tag: el.tagName,
          class: el.className,
          width: el.getBoundingClientRect().width,
        })),
    }))
    expect(overflow.scroll, JSON.stringify(overflow)).toBeLessThanOrEqual(
      overflow.width,
    )
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await expect(
      page.getByRole('dialog').getByRole('link', { name: 'Transactions' }),
    ).toBeVisible()
    await page
      .getByRole('dialog')
      .getByRole('link', { name: 'Transactions' })
      .click()
    await expect(page).toHaveURL('/transactions')
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL('/login')
    await page.goto('/budgets')
    await expect(page).toHaveURL(/\/login\?redirect=/)
  } finally {
    if (bobId) await admin.auth.admin.deleteUser(bobId)
    await admin.auth.admin.deleteUser(userId)
  }
})
