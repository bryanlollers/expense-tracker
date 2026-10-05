import { describe, it, expect } from 'vitest'
import {
  totals,
  budgetProgress,
  monthRange,
  transactionSchema,
  budgetSchema,
  categorySchema,
  validateReceipt,
  csvCell,
  safeRedirect,
} from '../utils/finance'
import { fillMonths } from '../utils/charts'
describe('financial calculations', () => {
  it('separates income from expenses without floating point drift', () => {
    expect(
      totals([
        { type: 'income', amount: 0.1 },
        { type: 'income', amount: 0.2 },
        { type: 'expense', amount: 10 },
      ]),
    ).toEqual({ income: 0.3, expense: 10 })
  })
  it('handles empty transaction histories', () =>
    expect(totals([])).toEqual({ income: 0, expense: 0 }))
  it('reports overspending without hiding the excess', () =>
    expect(budgetProgress(100, 125)).toEqual({
      remaining: -25,
      percentage: 125,
      exceeded: true,
    }))
  it('handles a zero limit and exact-limit spending', () => {
    expect(budgetProgress(0, 0).percentage).toBe(0)
    expect(budgetProgress(10, 10).exceeded).toBe(false)
  })
  it('calculates leap-year and year-end month ranges', () => {
    expect(monthRange('2024-02')).toEqual({
      start: '2024-02-01',
      end: '2024-02-29',
    })
    expect(monthRange('2026-12').end).toBe('2026-12-31')
  })
  it('fills missing months across year boundaries', () =>
    expect(
      fillMonths('2025-12-01', '2026-02-10', [
        { month: '2026-01', income: 10, expenses: 5 },
      ]),
    ).toEqual([
      { month: '2025-12', income: 0, expenses: 0 },
      { month: '2026-01', income: 10, expenses: 5 },
      { month: '2026-02', income: 0, expenses: 0 },
    ]))
})
describe('form validation', () => {
  const valid = {
    type: 'expense',
    amount: 12.25,
    category_id: '11111111-1111-4111-8111-111111111111',
    description: ' Lunch ',
    transaction_date: '2026-10-05',
  }
  it('normalizes valid input', () =>
    expect(transactionSchema.parse(valid).description).toBe('Lunch'))
  it.each([0, -1, Infinity, 1.001, 10000000000])(
    'rejects invalid amount %s',
    (amount) =>
      expect(transactionSchema.safeParse({ ...valid, amount }).success).toBe(
        false,
      ),
  )
  it.each(['2026-02-30', '2026-13-01', 'yesterday'])(
    'rejects impossible date %s',
    (transaction_date) =>
      expect(
        transactionSchema.safeParse({ ...valid, transaction_date }).success,
      ).toBe(false),
  )
  it('requires a category', () =>
    expect(
      transactionSchema.safeParse({ ...valid, category_id: '' }).success,
    ).toBe(false))
  it('requires first-of-month budgets', () => {
    expect(
      budgetSchema.safeParse({
        month: '2026-10-02',
        amount: 100,
        category_id: null,
      }).success,
    ).toBe(false)
    expect(
      budgetSchema.safeParse({
        month: '2026-10-01',
        amount: 100,
        category_id: null,
      }).success,
    ).toBe(true)
  })
  it('rejects blank category names and invalid colors', () => {
    expect(
      categorySchema.safeParse({
        name: ' ',
        type: 'expense',
        icon: 'bag',
        color: '#059669',
      }).success,
    ).toBe(false)
    expect(
      categorySchema.safeParse({
        name: 'Food',
        type: 'expense',
        icon: 'bag',
        color: 'red',
      }).success,
    ).toBe(false)
  })
  it('restricts receipt type and size', () => {
    expect(() =>
      validateReceipt({ size: 100, type: 'image/jpeg' }),
    ).not.toThrow()
    expect(() =>
      validateReceipt({ size: 6 * 1024 * 1024, type: 'application/pdf' }),
    ).toThrow('5 MB')
    expect(() => validateReceipt({ size: 1, type: 'image/svg+xml' })).toThrow(
      'JPEG',
    )
    expect(() => validateReceipt({ size: 0, type: 'image/png' })).toThrow(
      'empty',
    )
  })
})
describe('safe boundaries', () => {
  it('escapes CSV quotes and neutralizes spreadsheet formulas', () => {
    expect(csvCell('say "hello"')).toBe('"say ""hello"""')
    expect(csvCell('=HYPERLINK("evil")')).toBe('"\'=HYPERLINK(""evil"")"')
  })
  it.each([
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    '/login',
    undefined,
  ])('rejects unsafe login redirect %s', (value) =>
    expect(safeRedirect(value)).toBe('/'),
  )
  it('preserves protected deep links', () =>
    expect(safeRedirect('/transactions/abc?view=detail')).toBe(
      '/transactions/abc?view=detail',
    ))
})
