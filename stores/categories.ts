import type { Category } from '~/types/database'
import { categorySchema } from '~/utils/finance'
export const useCategoriesStore = defineStore('categories', () => {
  const items = ref<Category[]>([])
  let request = 0
  async function fetch() {
    const current = ++request
    const { data, error } = await useDatabase()
      .from('categories')
      .select('*')
      .order('name')
    if (current !== request) return
    if (error) throw new Error(error.message)
    items.value = data
  }
  async function save(input: unknown, id?: string) {
    const values = categorySchema.parse(input)
    const client = useDatabase()
    const user = useAuthStore().user
    if (!user) throw new Error('Please sign in')
    const query = id
      ? client.from('categories').update(values).eq('id', id)
      : client.from('categories').insert({ ...values, user_id: user.id })
    const { error } = await query
    if (error)
      throw new Error(
        error.code === '23505'
          ? 'A category with this name and type already exists.'
          : error.message,
      )
    await fetch()
  }
  async function remove(id: string) {
    const { error } = await useDatabase()
      .from('categories')
      .delete()
      .eq('id', id)
    if (error)
      throw new Error(
        error.code === '23503'
          ? 'This category is used by transactions or budgets. Reassign them before deleting it.'
          : error.message,
      )
    await fetch()
  }
  function $reset() {
    ++request
    items.value = []
  }
  return { items, fetch, save, remove, $reset }
})
