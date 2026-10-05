import type { Budget, Category, Profile, Transaction } from '~/types/database'
import { localDate } from '~/utils/finance'

export const demoUserId = '00000000-0000-4000-8000-000000000001'
export interface DemoState {
  version: 1
  profile: Profile
  categories: Category[]
  transactions: Transaction[]
  budgets: Budget[]
}

export function createDemoState(now = new Date()): DemoState {
  const timestamp = now.toISOString()
  const base = {
    user_id: demoUserId,
    created_at: timestamp,
    updated_at: timestamp,
  }
  const definitions = [
    ['Salary', 'income', 'briefcase', '#059669'],
    ['Freelance', 'income', 'laptop', '#0d9488'],
    ['Other income', 'income', 'plus', '#0284c7'],
    ['Food & dining', 'expense', 'utensils', '#f59e0b'],
    ['Shopping', 'expense', 'bag', '#8b5cf6'],
    ['Transport', 'expense', 'car', '#3b82f6'],
    ['Housing', 'expense', 'home', '#ec4899'],
    ['Entertainment', 'expense', 'film', '#f97316'],
    ['Health', 'expense', 'heart', '#14b8a6'],
    ['Other expenses', 'expense', 'circle', '#64748b'],
  ] as const
  const categories: Category[] = definitions.map(
    ([name, type, icon, color]) => ({
      ...base,
      id: crypto.randomUUID(),
      name,
      type,
      icon,
      color,
    }),
  )
  const transactions: Transaction[] = []
  const budgets: Budget[] = []
  const add = (
    name: string,
    amount: number,
    description: string,
    date: Date,
  ) => {
    const category = categories.find((c) => c.name === name)!
    transactions.push({
      ...base,
      id: crypto.randomUUID(),
      type: category.type,
      category_id: category.id,
      amount,
      description,
      transaction_date: localDate(date),
      receipt_path: null,
    })
  }
  for (let offset = 5; offset >= 0; offset--) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const day = (number: number) =>
      new Date(
        date.getFullYear(),
        date.getMonth(),
        Math.min(number, offset ? number : now.getDate()),
      )
    add('Salary', 6200 - offset * 100, 'Monthly salary', day(1))
    add('Housing', 1250, 'Apartment rent', day(1))
    add('Food & dining', 86.5 + offset * 12, 'Dinner with friends', day(4))
    add('Shopping', 248 + offset * 18, 'Weekend essentials', day(7))
    add('Transport', 42.8 + offset * 5, 'Train pass', day(10))
    add('Entertainment', 29.99, 'Streaming subscriptions', day(12))
    add('Food & dining', 64.2 + offset * 7, 'Weekly groceries', day(16))
    add('Health', 35, 'Fitness membership', day(20))
    if (offset % 2 === 0)
      add('Freelance', 650, 'Website design project', day(22))
    const month = localDate(date)
    for (const [name, amount] of [
      ['', 2400],
      ['Food & dining', 400],
      ['Shopping', 500],
      ['Transport', 150],
    ] as const) {
      budgets.push({
        ...base,
        id: crypto.randomUUID(),
        month,
        category_id: name ? categories.find((c) => c.name === name)!.id : null,
        category_type: 'expense',
        amount,
      })
    }
  }
  return {
    version: 1,
    profile: {
      id: demoUserId,
      full_name: 'Alex Morgan',
      currency: 'USD',
      created_at: timestamp,
      updated_at: timestamp,
    },
    categories,
    transactions,
    budgets,
  }
}
