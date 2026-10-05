<script setup lang="ts">
import type { FinanceSummary, Transaction } from '~/types/database'
import { localDate, monthRange, money } from '~/utils/finance'
import { fillMonths } from '~/utils/charts'
const auth = useAuthStore()
const transactions = useTransactionsStore()
const categories = useCategoriesStore()
const budgets = useBudgetsStore()
const month = ref(localDate().slice(0, 7))
const showForm = ref(false)
const empty: FinanceSummary = {
  income: 0,
  expenses: 0,
  category_totals: [],
  monthly_totals: [],
}
const current = ref<FinanceSummary>(empty)
const allTime = ref<FinanceSummary>(empty)
const history = ref<FinanceSummary>(empty)
const recent = ref<Transaction[]>([])
const { error, success, pending, run } = useFeedback()
const currency = computed(() => auth.profile?.currency || 'USD')
const overall = computed(() => budgets.items.find((v) => !v.category_id))
const breakdown = computed(() =>
  current.value.category_totals.map((v) => {
    const category = categories.items.find((c) => c.id === v.category_id)
    return {
      name: category?.name || 'Category',
      color: category?.color || '#64748b',
      amount: v.amount,
    }
  }),
)
const chartStart = computed(() => {
  const [y, m] = month.value.split('-').map(Number)
  return localDate(new Date(y!, m! - 6, 1))
})
const chart = computed(() =>
  fillMonths(
    chartStart.value,
    monthRange(month.value).end,
    history.value.monthly_totals,
  ),
)
let generation = 0
async function load() {
  const version = ++generation
  await run(async () => {
    const range = monthRange(month.value)
    const client = useDatabase()
    const results = await Promise.all([
      categories.fetch(),
      budgets.fetch(month.value),
      transactions.summary(range.start, range.end),
      transactions.summary('0001-01-01', '9999-12-31'),
      transactions.summary(chartStart.value, range.end),
      client
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5),
    ])
    if (version !== generation) return
    current.value = results[2]
    allTime.value = results[3]
    history.value = results[4]
    if (results[5].error) throw new Error(results[5].error.message)
    recent.value = results[5].data
  })
}
onMounted(load)
watch(month, () => {
  if (month.value) void load()
})
async function saved() {
  showForm.value = false
  await load()
  success.value = 'Transaction added.'
}
</script>
<template>
  <div>
    <UiPageHeader
      :title="`Your money, at a glance${auth.profile?.full_name ? ', ' + auth.profile.full_name.split(' ')[0] : ''}.`"
      description="A little clarity for the month ahead."
      ><label class="sr-only" for="overview-month">Overview month</label
      ><input
        id="overview-month"
        v-model="month"
        type="month"
        class="!w-auto"
        required
      /><button class="btn" @click="showForm = true">
        <UiAppIcon name="plus" :size="17" />Add transaction
      </button></UiPageHeader
    ><UiFeedback :error="error" :success="success" :pending="pending" />
    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardStatCard
        title="Current balance"
        :value="money(allTime.income - allTime.expenses, currency)"
        icon="budgets"
        detail="All-time income minus expenses"
        accent
      /><DashboardStatCard
        title="Total income"
        :value="money(current.income, currency)"
        icon="up"
        detail="Received this month"
      /><DashboardStatCard
        title="Total expenses"
        :value="money(current.expenses, currency)"
        icon="down"
        detail="Spent this month"
      /><DashboardStatCard
        title="Monthly budget"
        :value="overall ? money(overall.amount, currency) : 'Not set'"
        icon="budgets"
        :detail="
          overall
            ? money(overall.amount - current.expenses, currency) + ' remaining'
            : 'Give your spending a plan'
        "
      />
    </div>
    <div class="mb-6 grid gap-6 xl:grid-cols-5">
      <section class="card xl:col-span-3">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h2 class="text-sm font-bold">Income vs. expenses</h2>
            <p class="mt-1 text-xs text-slate-400">
              The rhythm of your financial life
            </p>
          </div>
          <span
            class="rounded-md bg-slate-50 px-3 py-1.5 text-xs text-slate-500"
            >Last 6 months</span
          >
        </div>
        <ChartsMonthlyChart :items="chart" :currency="currency" />
      </section>
      <section class="card xl:col-span-2">
        <h2 class="text-sm font-bold">Where your money goes</h2>
        <p class="mb-7 mt-1 text-xs text-slate-400">
          Expense breakdown · {{ month }}
        </p>
        <ChartsCategoryChart :items="breakdown" :currency="currency" />
      </section>
    </div>
    <div class="grid gap-6 xl:grid-cols-3">
      <section class="card !p-0 xl:col-span-2">
        <div class="flex items-center justify-between p-5">
          <div>
            <h2 class="text-sm font-bold">Recent transactions</h2>
            <p class="mt-1 text-xs text-slate-400">
              Your latest financial activity
            </p>
          </div>
          <NuxtLink
            to="/transactions"
            class="flex items-center gap-1 text-xs font-semibold text-emerald-700"
            >View all<UiAppIcon name="right" :size="14"
          /></NuxtLink>
        </div>
        <TransactionsTransactionTable :items="recent" />
      </section>
      <section class="card">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-sm font-bold">Budget check-in</h2>
          <NuxtLink to="/budgets" class="text-xs font-semibold text-emerald-700"
            >Manage</NuxtLink
          >
        </div>
        <div v-if="budgets.items.length" class="space-y-6">
          <BudgetsBudgetProgress
            v-for="budget in budgets.items.slice(0, 4)"
            :key="budget.id"
            :name="
              categories.items.find((c) => c.id === budget.category_id)?.name ||
              'Monthly budget'
            "
            :amount="budget.amount"
            :spent="
              budget.category_id
                ? current.category_totals.find(
                    (c) => c.category_id === budget.category_id,
                  )?.amount || 0
                : current.expenses
            "
            :color="
              categories.items.find((c) => c.id === budget.category_id)?.color
            "
          />
        </div>
        <UiEmptyState
          v-else
          title="Make a little room"
          description="Set a budget and start building toward your goals."
          icon="budgets"
          ><NuxtLink to="/budgets" class="btn-secondary"
            >Create a budget</NuxtLink
          ></UiEmptyState
        >
        <div
          class="mt-6 rounded-lg bg-emerald-50/70 p-3 text-xs leading-relaxed text-emerald-800"
        >
          Small steps add up. Checking in regularly is a great place to start.
        </div>
      </section>
    </div>
    <UiBaseModal
      v-if="showForm"
      title="Add transaction"
      @close="showForm = false"
      ><TransactionsTransactionForm @saved="saved" @close="showForm = false"
    /></UiBaseModal>
  </div>
</template>
