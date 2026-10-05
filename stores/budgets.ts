import type { Budget } from '~/types/database'
import { budgetSchema } from '~/utils/finance'
export const useBudgetsStore = defineStore('budgets', () => {
  const items = ref<Budget[]>([])
  let request = 0
  async function fetch(month: string) {
    const current = ++request
    const { data, error } = await useDatabase()
      .from('budgets')
      .select('*')
      .eq('month', `${month.slice(0, 7)}-01`)
      .order('created_at')
    if (current !== request) return
    if (error) throw new Error(error.message)
    items.value = data
  }
  async function save(input: unknown, id?: string) {
    const values = budgetSchema.parse(input)
    const user = useAuthStore().user
    if (!user) throw new Error('Please sign in')
    const client = useDatabase()
    const query = id
      ? client.from('budgets').update(values).eq('id', id)
      : client.from('budgets').insert({ ...values, user_id: user.id })
    const { error } = await query
    if (error)
      throw new Error(
        error.code === '23505'
          ? 'A budget already exists for this month and category. Edit the existing budget.'
          : error.message,
      )
    await fetch(values.month)
  }
  async function remove(id: string) {
    const { error } = await useDatabase().from('budgets').delete().eq('id', id)
    if (error) throw new Error(error.message)
    items.value = items.value.filter((v) => v.id !== id)
  }
  function $reset() {
    ++request
    items.value = []
  }
  return { items, fetch, save, remove, $reset }
})
