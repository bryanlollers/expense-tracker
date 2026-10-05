import { z } from 'zod'
import type { TransactionFilters } from '~/stores/transactions'
import type { Budget, FinanceSummary, Transaction } from '~/types/database'
import {
  budgetSchema,
  categorySchema,
  transactionSchema,
  validateReceipt,
} from '~/utils/finance'
import { currencySchema } from '~/utils/currencies'
import { createDemoState, demoUserId, type DemoState } from '~/utils/demoSeed'
import {
  BrowserReceiptStorage,
  type ReceiptStorage,
} from '~/utils/demoReceipts'

export const demoStorageKey = 'ledger-demo-v1'
const audit = {
  id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
}
const owned = { ...audit, user_id: z.literal(demoUserId) }
const profileSchema = z.object({
  full_name: z.string().trim().min(1).max(100),
  currency: currencySchema,
})
const stateSchema = z.object({
  version: z.literal(1),
  profile: profileSchema.extend({ ...audit, id: z.literal(demoUserId) }),
  categories: z.array(categorySchema.extend(owned)),
  transactions: z.array(
    transactionSchema.extend({ ...owned, receipt_path: z.string().nullable() }),
  ),
  budgets: z.array(
    budgetSchema.extend({ ...owned, category_type: z.literal('expense') }),
  ),
})

export class DemoRepository {
  constructor(
    private storage: Storage,
    private receipts: ReceiptStorage = new BrowserReceiptStorage(),
  ) {}
  private read(): DemoState {
    let raw: string | null
    try {
      raw = this.storage.getItem(demoStorageKey)
    } catch {
      throw new Error(
        'Browser storage is unavailable. Enable site storage to use the demo.',
      )
    }
    if (!raw) {
      const state = createDemoState()
      this.write(state)
      return state
    }
    try {
      return stateSchema.parse(JSON.parse(raw))
    } catch {
      throw new Error(
        'Saved demo data could not be read. Use Reset demo to restore the sample workspace.',
      )
    }
  }
  private write(state: DemoState) {
    try {
      this.storage.setItem(demoStorageKey, JSON.stringify(state))
    } catch {
      throw new Error(
        'Could not save demo changes. Your browser storage may be full or disabled.',
      )
    }
  }
  profile() {
    return this.read().profile
  }
  saveProfile(input: unknown) {
    const values = profileSchema.parse(input)
    const state = this.read()
    state.profile = {
      ...state.profile,
      ...values,
      updated_at: new Date().toISOString(),
    }
    this.write(state)
    return state.profile
  }
  categories() {
    return this.read().categories.sort((a, b) => a.name.localeCompare(b.name))
  }
  saveCategory(input: unknown, id?: string) {
    const values = categorySchema.parse(input)
    const state = this.read()
    if (
      state.categories.some(
        (c) =>
          c.id !== id &&
          c.type === values.type &&
          c.name.trim().toLowerCase() === values.name.toLowerCase(),
      )
    )
      throw new Error('A category with this name and type already exists.')
    const old = id ? state.categories.find((c) => c.id === id) : undefined
    if (id && !old) throw new Error('Category not found.')
    if (
      old &&
      old.type !== values.type &&
      (state.transactions.some((t) => t.category_id === id) ||
        state.budgets.some((b) => b.category_id === id))
    )
      throw new Error(
        'This category is in use. Reassign its transactions and budgets before changing its type.',
      )
    const timestamp = new Date().toISOString()
    const category = {
      ...values,
      id: id || crypto.randomUUID(),
      user_id: demoUserId,
      created_at: old?.created_at || timestamp,
      updated_at: timestamp,
    }
    state.categories = [
      ...state.categories.filter((c) => c.id !== id),
      category,
    ]
    this.write(state)
  }
  removeCategory(id: string) {
    const state = this.read()
    if (
      state.transactions.some((t) => t.category_id === id) ||
      state.budgets.some((b) => b.category_id === id)
    )
      throw new Error(
        'This category is used by transactions or budgets. Reassign them before deleting it.',
      )
    state.categories = state.categories.filter((c) => c.id !== id)
    this.write(state)
  }
  budgets(start: string, end = start) {
    return this.read()
      .budgets.filter(
        (b) =>
          b.month >= `${start.slice(0, 7)}-01` &&
          b.month <= `${end.slice(0, 7)}-01`,
      )
      .sort((a, b) => b.month.localeCompare(a.month))
  }
  saveBudget(input: unknown, id?: string) {
    const values = budgetSchema.parse(input)
    const state = this.read()
    if (
      values.category_id &&
      !state.categories.some(
        (c) => c.id === values.category_id && c.type === 'expense',
      )
    )
      throw new Error('Choose an expense category.')
    if (
      state.budgets.some(
        (b) =>
          b.id !== id &&
          b.month === values.month &&
          b.category_id === values.category_id,
      )
    )
      throw new Error(
        'A budget already exists for this month and category. Edit the existing budget.',
      )
    const old = state.budgets.find((b) => b.id === id)
    if (id && !old) throw new Error('Budget not found.')
    const timestamp = new Date().toISOString()
    const budget: Budget = {
      ...values,
      id: id || crypto.randomUUID(),
      user_id: demoUserId,
      category_type: 'expense',
      created_at: old?.created_at || timestamp,
      updated_at: timestamp,
    }
    state.budgets = [...state.budgets.filter((b) => b.id !== id), budget]
    this.write(state)
  }
  removeBudget(id: string) {
    const state = this.read()
    state.budgets = state.budgets.filter((b) => b.id !== id)
    this.write(state)
  }
  transactions(filters: TransactionFilters, pageSize = 10) {
    const search = filters.search.trim().toLowerCase()
    const rows = this.read().transactions.filter(
      (t) =>
        (!filters.type || t.type === filters.type) &&
        (!filters.category || t.category_id === filters.category) &&
        (!filters.start || t.transaction_date >= filters.start) &&
        (!filters.end || t.transaction_date <= filters.end) &&
        (!search || t.description.toLowerCase().includes(search)),
    )
    rows.sort((a, b) => {
      const left = a[filters.sort],
        right = b[filters.sort]
      const result =
        typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left).localeCompare(String(right))
      return (filters.ascending ? result : -result) || a.id.localeCompare(b.id)
    })
    return {
      count: rows.length,
      items: rows.slice((filters.page - 1) * pageSize, filters.page * pageSize),
    }
  }
  recent(limit = 5) {
    return this.read()
      .transactions.sort(
        (a, b) =>
          b.transaction_date.localeCompare(a.transaction_date) ||
          b.created_at.localeCompare(a.created_at) ||
          a.id.localeCompare(b.id),
      )
      .slice(0, limit)
  }
  getTransaction(id: string) {
    const row = this.read().transactions.find((t) => t.id === id)
    if (!row) throw new Error('Transaction not found.')
    return row
  }
  exportRows(start: string, end: string) {
    return this.read()
      .transactions.filter(
        (t) => t.transaction_date >= start && t.transaction_date <= end,
      )
      .sort(
        (a, b) =>
          a.transaction_date.localeCompare(b.transaction_date) ||
          a.id.localeCompare(b.id),
      )
  }
  summary(start: string, end: string): FinanceSummary {
    const rows = this.exportRows(start, end)
    const categoryTotals = new Map<string, number>()
    const monthlyTotals = new Map<
      string,
      { month: string; income: number; expenses: number }
    >()
    let income = 0,
      expenses = 0
    for (const t of rows) {
      const cents = Math.round(t.amount * 100)
      const month = t.transaction_date.slice(0, 7)
      const monthly = monthlyTotals.get(month) || {
        month,
        income: 0,
        expenses: 0,
      }
      if (t.type === 'income') {
        income += cents
        monthly.income += cents
      } else {
        expenses += cents
        monthly.expenses += cents
        categoryTotals.set(
          t.category_id,
          (categoryTotals.get(t.category_id) || 0) + cents,
        )
      }
      monthlyTotals.set(month, monthly)
    }
    return {
      income: income / 100,
      expenses: expenses / 100,
      category_totals: [...categoryTotals]
        .map(([category_id, cents]) => ({ category_id, amount: cents / 100 }))
        .sort((a, b) => b.amount - a.amount),
      monthly_totals: [...monthlyTotals.values()].map((m) => ({
        ...m,
        income: m.income / 100,
        expenses: m.expenses / 100,
      })),
    }
  }
  async saveTransaction(
    input: unknown,
    id?: string,
    file?: File,
    removeReceipt = false,
  ) {
    const values = transactionSchema.parse(input)
    const state = this.read()
    if (
      !state.categories.some(
        (c) => c.id === values.category_id && c.type === values.type,
      )
    )
      throw new Error('Choose a matching category.')
    const old = id ? this.getTransaction(id) : undefined
    let path = old?.receipt_path || null
    let uploaded: string | undefined
    if (file) {
      if (values.type !== 'expense')
        throw new Error('Receipts are only available for expenses')
      validateReceipt(file)
      uploaded = `${demoUserId}/${crypto.randomUUID()}`
      await this.receipts.put(uploaded, file)
      path = uploaded
    }
    if ((!file && removeReceipt) || values.type === 'income') path = null
    const timestamp = new Date().toISOString()
    const transaction: Transaction = {
      ...values,
      id: id || crypto.randomUUID(),
      user_id: demoUserId,
      receipt_path: path,
      created_at: old?.created_at || timestamp,
      updated_at: timestamp,
    }
    try {
      const current = this.read()
      current.transactions = [
        ...current.transactions.filter((t) => t.id !== id),
        transaction,
      ]
      this.write(current)
    } catch (e) {
      if (uploaded) await this.receipts.remove(uploaded)
      throw e
    }
    if (old?.receipt_path && old.receipt_path !== path)
      await this.receipts.remove(old.receipt_path)
    return transaction
  }
  async removeTransaction(id: string) {
    const state = this.read()
    const old = this.getTransaction(id)
    state.transactions = state.transactions.filter((t) => t.id !== id)
    this.write(state)
    if (old.receipt_path) await this.receipts.remove(old.receipt_path)
  }
  async receiptUrl(path: string) {
    const file = await this.receipts.get(path)
    if (!file) throw new Error('Receipt not found in this browser.')
    const url = URL.createObjectURL(file)
    setTimeout(() => URL.revokeObjectURL(url), 60000)
    return url
  }
  async reset() {
    await this.receipts.clear()
    this.write(createDemoState())
  }
}

let repository: DemoRepository | undefined
export function getDemoRepository() {
  return (repository ||= new DemoRepository(window.localStorage))
}
