import type {
  FinanceSummary,
  Transaction,
  TransactionType,
} from '~/types/database'
import { transactionSchema, validateReceipt } from '~/utils/finance'
import { getDemoRepository } from '~/utils/demoRepository'
export interface TransactionFilters {
  search: string
  type: TransactionType | ''
  category: string
  start: string
  end: string
  sort: 'transaction_date' | 'amount' | 'created_at'
  ascending: boolean
  page: number
}
export const useTransactionsStore = defineStore('transactions', () => {
  const items = ref<Transaction[]>([])
  const count = ref(0)
  const pageSize = 10
  let request = 0
  async function fetch(filters: TransactionFilters) {
    const current = ++request
    if (useDemoMode()) {
      const result = getDemoRepository().transactions(filters, pageSize)
      items.value = result.items
      count.value = result.count
      return
    }
    let query = useDatabase()
      .from('transactions')
      .select('*', { count: 'exact' })
    if (filters.type) query = query.eq('type', filters.type)
    if (filters.category) query = query.eq('category_id', filters.category)
    if (filters.start) query = query.gte('transaction_date', filters.start)
    if (filters.end) query = query.lte('transaction_date', filters.end)
    if (filters.search.trim())
      query = query.ilike(
        'description',
        `%${filters.search.trim().replace(/[%_\\]/g, '\\$&')}%`,
      )
    const {
      data,
      error,
      count: total,
    } = await query
      .order(filters.sort, { ascending: filters.ascending })
      .order('id')
      .range((filters.page - 1) * pageSize, filters.page * pageSize - 1)
    if (current !== request) return
    if (error) throw new Error(error.message)
    items.value = data
    count.value = total ?? 0
  }
  async function get(id: string) {
    if (useDemoMode()) return getDemoRepository().getTransaction(id)
    const { data, error } = await useDatabase()
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single()
    if (error)
      throw new Error(
        error.code === 'PGRST116'
          ? 'Transaction not found or you do not have access.'
          : error.message,
      )
    return data
  }
  async function summary(start: string, end: string): Promise<FinanceSummary> {
    if (useDemoMode()) return getDemoRepository().summary(start, end)
    const { data, error } = await useDatabase().rpc('finance_summary', {
      start_date: start,
      end_date: end,
    })
    if (error) throw new Error(error.message)
    return data
  }
  async function save(
    input: unknown,
    id?: string,
    file?: File,
    removeReceipt = false,
  ) {
    const values = transactionSchema.parse(input)
    if (useDemoMode())
      return getDemoRepository().saveTransaction(
        values,
        id,
        file,
        removeReceipt,
      )
    const client = useDatabase()
    const user = useAuthStore().user
    if (!user) throw new Error('Please sign in')
    const previous = id ? await get(id) : null
    let path = previous?.receipt_path ?? null
    let uploaded: string | null = null
    if (file) {
      if (values.type !== 'expense')
        throw new Error('Receipts are only available for expenses')
      validateReceipt(file)
      const extension = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'application/pdf': 'pdf',
      }[file.type]
      uploaded = `${user.id}/${crypto.randomUUID()}.${extension}`
      const { error } = await client.storage
        .from('receipts')
        .upload(uploaded, file, { contentType: file.type, upsert: false })
      if (error) throw new Error(error.message)
      path = uploaded
    }
    if ((!file && removeReceipt) || values.type === 'income') path = null
    const query = id
      ? client
          .from('transactions')
          .update({ ...values, receipt_path: path })
          .eq('id', id)
          .select()
          .single()
      : client
          .from('transactions')
          .insert({ ...values, receipt_path: path, user_id: user.id })
          .select()
          .single()
    const { data, error } = await query
    if (error) {
      if (uploaded) await client.storage.from('receipts').remove([uploaded])
      throw new Error(error.message)
    }
    if (previous?.receipt_path && previous.receipt_path !== path) {
      const { error: cleanupError } = await client.storage
        .from('receipts')
        .remove([previous.receipt_path])
      if (cleanupError)
        console.warn('Unused receipt cleanup failed:', cleanupError.message)
    }
    return data
  }
  async function remove(id: string) {
    if (useDemoMode()) {
      await getDemoRepository().removeTransaction(id)
      return
    }
    const transaction = await get(id)
    const client = useDatabase()
    const { error } = await client.from('transactions').delete().eq('id', id)
    if (error) throw new Error(error.message)
    if (transaction.receipt_path) {
      const { error: cleanupError } = await client.storage
        .from('receipts')
        .remove([transaction.receipt_path])
      if (cleanupError)
        console.warn('Unused receipt cleanup failed:', cleanupError.message)
    }
  }
  async function receiptUrl(path: string) {
    if (useDemoMode()) return getDemoRepository().receiptUrl(path)
    const { data, error } = await useDatabase()
      .storage.from('receipts')
      .createSignedUrl(path, 60)
    if (error) throw new Error(error.message)
    return data.signedUrl
  }
  async function exportRows(start: string, end: string) {
    if (useDemoMode()) return getDemoRepository().exportRows(start, end)
    const result: Transaction[] = []
    let offset = 0
    while (true) {
      const { data, error } = await useDatabase()
        .from('transactions')
        .select('*')
        .gte('transaction_date', start)
        .lte('transaction_date', end)
        .order('transaction_date')
        .order('id')
        .range(offset, offset + 999)
      if (error) throw new Error(error.message)
      result.push(...data)
      if (data.length < 1000) break
      offset += 1000
    }
    return result
  }
  function $reset() {
    ++request
    items.value = []
    count.value = 0
  }
  async function recent(limit = 5) {
    if (useDemoMode()) return getDemoRepository().recent(limit)
    const { data, error } = await useDatabase()
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(error.message)
    return data
  }
  return {
    items,
    count,
    pageSize,
    fetch,
    get,
    summary,
    save,
    remove,
    receiptUrl,
    exportRows,
    recent,
    $reset,
  }
})
