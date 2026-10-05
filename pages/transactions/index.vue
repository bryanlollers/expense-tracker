<script setup lang="ts">
import type { TransactionFilters } from '~/stores/transactions'
import { localDate } from '~/utils/finance'
const store = useTransactionsStore()
const categories = useCategoriesStore()
const filters = reactive<TransactionFilters>({
  search: '',
  type: '',
  category: '',
  start: '',
  end: '',
  sort: 'transaction_date',
  ascending: false,
  page: 1,
})
const showForm = ref(false)
const { error, success, pending, run } = useFeedback()
let timer: ReturnType<typeof setTimeout> | undefined
async function load() {
  await run(() => store.fetch({ ...filters }))
}
onMounted(async () => {
  await run(async () => {
    await categories.fetch()
    await store.fetch({ ...filters })
  })
})
watch(
  () => [
    filters.search,
    filters.type,
    filters.category,
    filters.start,
    filters.end,
    filters.sort,
    filters.ascending,
  ],
  () => {
    filters.page = 1
    clearTimeout(timer)
    timer = setTimeout(() => {
      void load()
    }, 250)
  },
)
watch(
  () => filters.page,
  () => {
    void load()
  },
)
onBeforeUnmount(() => clearTimeout(timer))
async function saved() {
  showForm.value = false
  await load()
  success.value = 'Transaction added.'
}
useHead({ title: 'Transactions · Ledger' })
</script>
<template>
  <div>
    <UiPageHeader
      title="Transactions"
      description="Every little detail, all in one place."
      ><button class="btn" @click="showForm = true">
        <UiAppIcon name="plus" :size="18" />Add transaction
      </button></UiPageHeader
    ><UiFeedback :error="error" :success="success" :pending="pending" />
    <div class="card mb-5">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="field">
          <label for="search" class="text-xs text-slate-500">Search</label>
          <div class="relative">
            <UiAppIcon
              name="search"
              class="absolute left-3 top-3 text-slate-400"
              :size="17"
            /><input
              id="search"
              v-model="filters.search"
              class="!pl-9"
              placeholder="Search descriptions…"
            />
          </div>
        </div>
        <div class="field">
          <label for="type">Type</label
          ><select id="type" v-model="filters.type">
            <option value="">All transactions</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </select>
        </div>
        <div class="field">
          <label for="filter-category">Category</label
          ><select id="filter-category" v-model="filters.category">
            <option value="">All categories</option>
            <option v-for="c in categories.items" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="sort">Sort by</label
          ><select id="sort" v-model="filters.sort">
            <option value="transaction_date">Transaction date</option>
            <option value="amount">Amount</option>
            <option value="created_at">Date added</option>
          </select>
        </div>
        <div class="field">
          <label for="start">From</label
          ><input
            id="start"
            v-model="filters.start"
            type="date"
            :max="filters.end || undefined"
          />
        </div>
        <div class="field">
          <label for="end">To</label
          ><input
            id="end"
            v-model="filters.end"
            type="date"
            :min="filters.start || undefined"
          />
        </div>
        <div class="field">
          <label for="direction">Order</label
          ><select id="direction" v-model="filters.ascending">
            <option :value="false">Descending</option>
            <option :value="true">Ascending</option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            class="btn-secondary w-full"
            @click="
              Object.assign(filters, {
                search: '',
                type: '',
                category: '',
                start: '',
                end: '',
                sort: 'transaction_date',
                ascending: false,
                page: 1,
              })
            "
          >
            Clear filters
          </button>
        </div>
      </div>
    </div>
    <div class="card !p-0" :aria-busy="pending">
      <TransactionsTransactionTable :items="store.items" /><UiPagination
        :page="filters.page"
        :count="store.count"
        :page-size="store.pageSize"
        @change="filters.page = $event"
      />
    </div>
    <p class="mt-4 text-xs text-slate-400">
      Your ledger is up to date as of {{ localDate() }}. Amounts use your
      profile currency.
    </p>
    <UiBaseModal
      v-if="showForm"
      title="Add transaction"
      @close="showForm = false"
      ><TransactionsTransactionForm @saved="saved" @close="showForm = false"
    /></UiBaseModal>
  </div>
</template>
