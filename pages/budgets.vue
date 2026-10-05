<script setup lang="ts">
import type { Budget, FinanceSummary } from '~/types/database'
import { localDate, monthRange, money } from '~/utils/finance'
const store = useBudgetsStore()
const categories = useCategoriesStore()
const transactions = useTransactionsStore()
const auth = useAuthStore()
const month = ref(localDate().slice(0, 7))
const summary = ref<FinanceSummary>({
  income: 0,
  expenses: 0,
  category_totals: [],
  monthly_totals: [],
})
const { error, success, pending, run } = useFeedback()
const mutation = useFeedback()
const open = ref(false)
const editing = ref<Budget>()
const deleting = ref<Budget>()
function requestDelete(budget: Budget) {
  deleting.value = budget
  mutation.error.value = ''
}
const form = reactive({ amount: 0, category_id: null as string | null })
const overall = computed(() => store.items.find((b) => !b.category_id))
const categoryBudgets = computed(() => store.items.filter((b) => b.category_id))
function category(id: string | null) {
  return categories.items.find((c) => c.id === id)
}
function spent(id: string | null) {
  return id
    ? (summary.value.category_totals.find((c) => c.category_id === id)
        ?.amount ?? 0)
    : summary.value.expenses
}
let generation = 0
async function load() {
  const version = ++generation
  await run(async () => {
    const range = monthRange(month.value)
    const result = await transactions.summary(range.start, range.end)
    if (version !== generation) return
    summary.value = result
    await store.fetch(month.value)
  })
}
onMounted(async () => {
  await run(() => categories.fetch())
  await load()
})
watch(month, () => {
  if (month.value) void load()
})
function edit(budget?: Budget) {
  editing.value = budget
  form.amount = budget?.amount ?? 0
  form.category_id = budget?.category_id ?? null
  mutation.error.value = ''
  open.value = true
}
async function save() {
  const ok = await mutation.run(() =>
    store.save({ ...form, month: `${month.value}-01` }, editing.value?.id),
  )
  if (ok) {
    open.value = false
    success.value = 'Budget saved.'
  }
}
async function remove() {
  const ok = await mutation.run(() => store.remove(deleting.value!.id))
  if (ok) {
    deleting.value = undefined
    success.value = 'Budget deleted.'
  }
}
</script>
<template>
  <div>
    <UiPageHeader
      title="Budgets"
      description="A thoughtful plan for every dollar."
      ><label for="budget-month" class="sr-only">Budget month</label
      ><input
        id="budget-month"
        v-model="month"
        type="month"
        class="!w-auto"
        required
      /><button class="btn" @click="edit()">
        <UiAppIcon name="plus" :size="18" />New budget
      </button></UiPageHeader
    ><UiFeedback :error="error" :success="success" :pending="pending" />
    <div class="card mb-7">
      <div class="mb-5 flex items-center justify-between">
        <div>
          <h2 class="font-bold">Monthly spending plan</h2>
          <p class="muted mt-1">
            One overall limit, with room for the things that matter.
          </p>
        </div>
        <div v-if="overall" class="flex gap-2">
          <button
            class="btn-secondary !p-2"
            aria-label="Edit overall budget"
            @click="edit(overall)"
          >
            <UiAppIcon name="edit" :size="17" /></button
          ><button
            class="btn-secondary !p-2"
            aria-label="Delete overall budget"
            @click="requestDelete(overall)"
          >
            <UiAppIcon name="delete" :size="17" />
          </button>
        </div>
      </div>
      <BudgetsBudgetProgress
        v-if="overall"
        name="Total monthly budget"
        :amount="overall.amount"
        :spent="summary.expenses"
      /><UiEmptyState
        v-else
        title="Set your monthly intention"
        :description="`You’ve spent ${money(summary.expenses, auth.profile?.currency)} this month. Set a total budget to see how you’re doing.`"
        icon="budgets"
        ><button class="btn-secondary" @click="edit()">
          Set monthly budget
        </button></UiEmptyState
      >
    </div>
    <h2 class="mb-4 font-bold">Category budgets</h2>
    <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="budget in categoryBudgets" :key="budget.id" class="card">
        <BudgetsBudgetProgress
          :name="category(budget.category_id)?.name || 'Category'"
          :amount="budget.amount"
          :spent="spent(budget.category_id)"
          :color="category(budget.category_id)?.color"
          :icon="category(budget.category_id)?.icon"
        />
        <div class="mt-5 flex justify-end gap-3 border-t border-slate-100 pt-3">
          <button
            class="text-xs font-medium text-slate-500 hover:text-emerald-700"
            @click="edit(budget)"
          >
            Edit budget</button
          ><button
            class="text-xs text-slate-400 hover:text-red-600"
            @click="requestDelete(budget)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
    <UiEmptyState
      v-if="!categoryBudgets.length"
      title="A plan for each category"
      description="Set category budgets to keep your spending in balance."
      icon="budgets"
    /><UiBaseModal
      v-if="open"
      :title="editing ? 'Edit budget' : 'New monthly budget'"
      @close="!mutation.pending.value && (open = false)"
      ><form class="space-y-4" @submit.prevent="save">
        <p class="muted">
          Budget for {{ month }}. Category limits sit within your overall
          budget; they are not added to it.
        </p>
        <div class="field">
          <label for="budget-category">Category</label
          ><select id="budget-category" v-model="form.category_id">
            <option :value="null">Overall monthly budget</option>
            <option
              v-for="c in categories.items.filter((v) => v.type === 'expense')"
              :key="c.id"
              :value="c.id"
            >
              {{ c.name }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="budget-amount">Monthly limit</label
          ><input
            id="budget-amount"
            v-model.number="form.amount"
            type="number"
            min="0.01"
            max="9999999999.99"
            step="0.01"
            required
          />
        </div>
        <UiFeedback :error="mutation.error.value" />
        <div class="flex justify-end gap-3 pt-3">
          <button
            type="button"
            class="btn-secondary"
            :disabled="mutation.pending.value"
            @click="open = false"
          >
            Cancel</button
          ><button class="btn" :disabled="mutation.pending.value">
            {{ mutation.pending.value ? 'Saving…' : 'Save budget' }}
          </button>
        </div>
      </form></UiBaseModal
    ><UiConfirmDialog
      v-if="deleting"
      title="Delete budget?"
      description="This removes the spending limit. Your transactions will stay in your ledger."
      :pending="mutation.pending.value"
      :error="mutation.error.value"
      @close="deleting = undefined"
      @confirm="remove"
    />
  </div>
</template>
