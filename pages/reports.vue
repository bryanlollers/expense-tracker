<script setup lang="ts">
import type { Budget, FinanceSummary } from '~/types/database'
import { csvCell, localDate, monthRange, money } from '~/utils/finance'
import { fillMonths } from '~/utils/charts'
const transactions = useTransactionsStore()
const categories = useCategoriesStore()
const auth = useAuthStore()
const budgets = useBudgetsStore()
const initial = monthRange(localDate().slice(0, 7))
const start = ref(initial.start)
const end = ref(initial.end)
const summary = ref<FinanceSummary>({
  income: 0,
  expenses: 0,
  category_totals: [],
  monthly_totals: [],
})
const performance = ref<{ budget: Budget; spent: number }[]>([])
const { error, pending, run } = useFeedback()
const exporting = useFeedback()
const currency = computed(() => auth.profile?.currency || 'USD')
const applied = ref({ start: initial.start, end: initial.end })
const breakdown = computed(() =>
  summary.value.category_totals.map((v) => {
    const category = categories.items.find((c) => c.id === v.category_id)
    return {
      name: category?.name || 'Category',
      color: category?.color || '#64748b',
      amount: v.amount,
    }
  }),
)
const chart = computed(() =>
  fillMonths(
    applied.value.start,
    applied.value.end,
    summary.value.monthly_totals,
  ),
)
async function load() {
  await run(async () => {
    if (!start.value || !end.value || start.value > end.value)
      throw new Error('Choose a valid date range')
    const months = fillMonths(start.value, end.value, [])
    if (months.length > 24)
      throw new Error('Choose a range of 24 months or less')
    const range = { start: start.value, end: end.value }
    await categories.fetch()
    const report = await transactions.summary(range.start, range.end)
    const data = await budgets.range(range.start, range.end)
    const fullMonths = await Promise.all(
      months.map(async (m) => {
        const dates = monthRange(m.month)
        return {
          month: m.month,
          summary: await transactions.summary(dates.start, dates.end),
        }
      }),
    )
    performance.value = data.map((budget) => {
      const monthly = fullMonths.find(
        (m) => m.month === budget.month.slice(0, 7),
      )!.summary
      return {
        budget,
        spent: budget.category_id
          ? (monthly.category_totals.find(
              (c) => c.category_id === budget.category_id,
            )?.amount ?? 0)
          : monthly.expenses,
      }
    })
    applied.value = range
    summary.value = report
  })
}
onMounted(load)
async function exportCsv() {
  await exporting.run(async () => {
    const rows = await transactions.exportRows(
      applied.value.start,
      applied.value.end,
    )
    const headings = [
      'Date',
      'Type',
      'Category',
      'Description',
      'Amount',
      'Currency',
    ]
    const csv = [
      headings.map(csvCell).join(','),
      ...rows.map((t) =>
        [
          t.transaction_date,
          t.type,
          categories.items.find((c) => c.id === t.category_id)?.name || '',
          t.description,
          Number(t.amount).toFixed(2),
          currency.value,
        ]
          .map(csvCell)
          .join(','),
      ),
    ].join('\r\n')
    const url = URL.createObjectURL(
      new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `expense-tracker-${applied.value.start}-${applied.value.end}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, 'CSV exported.')
}
</script>
<template>
  <div>
    <UiPageHeader
      title="Reports & insights"
      description="Step back. See the bigger picture."
      ><button
        class="btn-secondary"
        :disabled="pending || exporting.pending.value"
        @click="exportCsv"
      >
        <UiAppIcon name="download" :size="17" />{{
          exporting.pending.value ? 'Exporting…' : 'Export CSV'
        }}
      </button></UiPageHeader
    >
    <form
      class="card mb-6 flex flex-wrap items-end gap-4"
      @submit.prevent="load"
    >
      <div class="field">
        <label for="report-start">From</label
        ><input
          id="report-start"
          v-model="start"
          type="date"
          required
          :max="end"
        />
      </div>
      <div class="field">
        <label for="report-end">To</label
        ><input
          id="report-end"
          v-model="end"
          type="date"
          required
          :min="start"
        />
      </div>
      <button class="btn" :disabled="pending">Apply range</button>
      <p class="muted pb-2">Up to 24 months at a time.</p>
    </form>
    <UiFeedback
      :error="error || exporting.error.value"
      :success="exporting.success.value"
      :pending="pending"
    />
    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardStatCard
        title="Income"
        :value="money(summary.income, currency)"
        icon="up"
        detail="In selected date range"
      /><DashboardStatCard
        title="Expenses"
        :value="money(summary.expenses, currency)"
        icon="down"
        detail="In selected date range"
      /><DashboardStatCard
        title="Net savings"
        :value="money(summary.income - summary.expenses, currency)"
        icon="budgets"
        detail="Income minus expenses"
        accent
      /><DashboardStatCard
        title="Savings rate"
        :value="
          summary.income
            ? Math.round(
                ((summary.income - summary.expenses) / summary.income) * 100,
              ) + '%'
            : '—'
        "
        icon="trend"
        detail="Net savings as a share of income"
      />
    </div>
    <div class="mb-6 grid gap-6 xl:grid-cols-2">
      <section class="card">
        <h2 class="mb-5 text-sm font-bold">Monthly income & spending trends</h2>
        <ChartsMonthlyChart :items="chart" :currency="currency" />
      </section>
      <section class="card">
        <h2 class="mb-6 text-sm font-bold">Spending by category</h2>
        <ChartsCategoryChart :items="breakdown" :currency="currency" />
      </section>
    </div>
    <section class="card">
      <h2 class="text-sm font-bold">Budget performance</h2>
      <p class="muted mt-1">
        Full-month spending for budgets in the selected months, even when the
        date range covers only part of a month.
      </p>
      <div class="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <BudgetsBudgetProgress
          v-for="item in performance"
          :key="item.budget.id"
          :name="`${item.budget.month.slice(0, 7)} · ${categories.items.find((c) => c.id === item.budget.category_id)?.name || 'Overall budget'}`"
          :amount="item.budget.amount"
          :spent="item.spent"
          :color="
            categories.items.find((c) => c.id === item.budget.category_id)
              ?.color
          "
        />
      </div>
      <UiEmptyState
        v-if="!performance.length"
        title="No budgets in this period"
        description="Create monthly budgets to compare your plan with your spending."
        icon="budgets"
      />
    </section>
  </div>
</template>
