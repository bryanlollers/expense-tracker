import { z } from 'zod'
import type { Transaction } from '~/types/database'
export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce
    .number()
    .finite()
    .positive('Amount must be greater than zero')
    .max(9999999999.99)
    .refine(
      (v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.0001,
      'Use at most two decimal places',
    ),
  category_id: z.string().uuid('Choose a category'),
  description: z.string().trim().max(500),
  transaction_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date')
    .refine(
      (v) =>
        !Number.isNaN(Date.parse(v)) &&
        new Date(v).toISOString().slice(0, 10) === v,
      'Choose a valid date',
    ),
})
export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
  type: z.enum(['income', 'expense']),
  icon: z.string().max(12),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})
export const budgetSchema = z.object({
  amount: transactionSchema.shape.amount,
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-01$/),
  category_id: z.string().uuid().nullable(),
})
export function totals(transactions: Pick<Transaction, 'type' | 'amount'>[]) {
  return transactions.reduce(
    (acc, t) => {
      acc[t.type] = Math.round((acc[t.type] + Number(t.amount)) * 100) / 100
      return acc
    },
    { income: 0, expense: 0 },
  )
}
export function budgetProgress(amount: number, spent: number) {
  return {
    remaining: Math.round((amount - spent) * 100) / 100,
    percentage: amount > 0 ? Math.round((spent / amount) * 100) : 0,
    exceeded: spent > amount,
  }
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function monthRange(month: string) {
  const [y, m] = month.split('-').map(Number)
  return {
    start: `${month.slice(0, 7)}-01`,
    end: localDate(new Date(y!, m!, 0)),
  }
}
export function money(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
    value,
  )
}
export function displayDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value.slice(0, 10)}T12:00:00`))
}
export const receiptTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]
export function validateReceipt(file: Pick<File, 'size' | 'type'>) {
  if (!receiptTypes.includes(file.type))
    throw new Error('Choose a JPEG, PNG, WebP, or PDF receipt')
  if (file.size > 5 * 1024 * 1024)
    throw new Error('Receipt must be 5 MB or smaller')
  if (file.size === 0) throw new Error('Receipt is empty')
}
export function csvCell(value: string | number) {
  const text = String(value)
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return `"${safe.replaceAll('"', '""')}"`
}
export function safeRedirect(value: unknown) {
  return typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    !value.startsWith('/login') &&
    !value.startsWith('/register')
    ? value
    : '/'
}
