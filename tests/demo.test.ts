import { beforeEach, describe, expect, it } from 'vitest'
import { DemoRepository, demoStorageKey } from '../utils/demoRepository'
import type { ReceiptStorage } from '../utils/demoReceipts'
import type { TransactionFilters } from '../stores/transactions'

class Receipts implements ReceiptStorage {
  files = new Map<string, Blob>()
  async put(path: string, file: Blob) {
    this.files.set(path, file)
  }
  async get(path: string) {
    return this.files.get(path)
  }
  async remove(path: string) {
    this.files.delete(path)
  }
  async clear() {
    this.files.clear()
  }
}
const filters: TransactionFilters = {
  search: '',
  type: '',
  category: '',
  start: '',
  end: '',
  sort: 'amount',
  ascending: true,
  page: 1,
}
describe('browser demo repository', () => {
  let repo: DemoRepository
  let receipts: Receipts
  beforeEach(() => {
    localStorage.clear()
    receipts = new Receipts()
    repo = new DemoRepository(localStorage, receipts)
  })
  const expense = (category_id: string, amount = 0.1) => ({
    type: 'expense',
    amount,
    category_id,
    description: 'Test lunch',
    transaction_date: '2099-01-02',
  })
  it('persists edits across repository instances', async () => {
    const category = repo.categories().find((c) => c.type === 'expense')!
    const row = await repo.saveTransaction(expense(category.id))
    repo.saveProfile({ full_name: 'Visitor', currency: 'PHP' })
    const restored = new DemoRepository(localStorage, receipts)
    expect(restored.getTransaction(row.id).amount).toBe(0.1)
    expect(restored.profile().currency).toBe('PHP')
  })
  it('aggregates cents exactly and applies filters and pagination', async () => {
    const category = repo.categories().find((c) => c.type === 'expense')!
    await repo.saveTransaction(expense(category.id, 0.1))
    await repo.saveTransaction(expense(category.id, 0.2))
    expect(repo.summary('2099-01-01', '2099-01-31').expenses).toBe(0.3)
    const query = {
      ...filters,
      search: 'TEST LUNCH',
      category: category.id,
      start: '2099-01-01',
    }
    expect(repo.transactions(query, 1)).toMatchObject({
      count: 2,
      items: [{ amount: 0.1 }],
    })
    expect(repo.transactions({ ...query, page: 2 }, 1).items[0]?.amount).toBe(
      0.2,
    )
  })
  it('enforces category references and unique monthly budgets', () => {
    const used = repo.categories().find((c) => c.name === 'Shopping')!
    expect(() => repo.removeCategory(used.id)).toThrow('used')
    expect(() => repo.saveCategory({ ...used, name: 'shopping' })).toThrow(
      'already exists',
    )
    const budget = repo.budgets('2000-01-01', '2100-01-01')[0]!
    expect(() => repo.saveBudget(budget)).toThrow('already exists')
    const income = repo.categories().find((c) => c.type === 'income')!
    expect(() =>
      repo.saveBudget({
        amount: 100,
        month: '2099-01-01',
        category_id: income.id,
      }),
    ).toThrow('expense category')
  })
  it('stores receipts locally and removes them with their transactions', async () => {
    const category = repo.categories().find((c) => c.type === 'expense')!
    const row = await repo.saveTransaction(
      expense(category.id),
      undefined,
      new File(['receipt'], 'receipt.pdf', { type: 'application/pdf' }),
    )
    expect(receipts.files.size).toBe(1)
    await repo.removeTransaction(row.id)
    expect(receipts.files.size).toBe(0)
    expect(() => repo.getTransaction(row.id)).toThrow('not found')
  })
  it('cleans an uploaded receipt if financial persistence fails', async () => {
    const category = repo.categories().find((c) => c.type === 'expense')!
    const failing = new DemoRepository(
      {
        ...localStorage,
        getItem: (key) => localStorage.getItem(key),
        setItem: () => {
          throw new Error('quota')
        },
      },
      receipts,
    )
    await expect(
      failing.saveTransaction(
        expense(category.id),
        undefined,
        new File(['receipt'], 'receipt.pdf', { type: 'application/pdf' }),
      ),
    ).rejects.toThrow('Could not save')
    expect(receipts.files.size).toBe(0)
  })
  it('recovers corrupted data with reset without deleting unrelated storage', async () => {
    localStorage.setItem(demoStorageKey, 'invalid')
    localStorage.setItem('unrelated', 'keep')
    expect(() => repo.profile()).toThrow('Reset demo')
    await receipts.put('test', new Blob(['test']))
    await repo.reset()
    expect(repo.profile().currency).toBe('USD')
    expect(receipts.files.size).toBe(0)
    expect(localStorage.getItem('unrelated')).toBe('keep')
  })
})
