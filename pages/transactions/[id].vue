<script setup lang="ts">
import type { Transaction } from '~/types/database'
import { displayDate, money } from '~/utils/finance'
const route = useRoute()
const store = useTransactionsStore()
const categories = useCategoriesStore()
const auth = useAuthStore()
const transaction = ref<Transaction>()
const edit = ref(false)
const confirm = ref(false)
const { error, success, pending, run } = useFeedback()
const deletion = useFeedback()
const category = computed(() =>
  categories.items.find((c) => c.id === transaction.value?.category_id),
)
onMounted(() =>
  run(async () => {
    await categories.fetch()
    transaction.value = await store.get(String(route.params.id))
  }),
)
async function saved(value: Transaction) {
  transaction.value = value
  edit.value = false
  success.value = 'Changes saved.'
}
async function remove() {
  await deletion.run(async () => {
    await store.remove(String(route.params.id))
    await navigateTo('/transactions')
  })
}
async function openReceipt() {
  const tab = window.open('about:blank', '_blank')
  if (tab) tab.opener = null
  const ok = await run(async () => {
    const url = await store.receiptUrl(transaction.value!.receipt_path!)
    if (tab) tab.location.href = url
    else window.location.assign(url)
  })
  if (!ok) tab?.close()
}
</script>
<template>
  <div>
    <NuxtLink
      to="/transactions"
      class="mb-5 inline-flex items-center gap-1 text-sm text-slate-500"
      ><UiAppIcon name="left" :size="16" />All transactions</NuxtLink
    ><UiPageHeader
      title="Transaction details"
      description="The full picture behind this entry."
      ><template v-if="transaction"
        ><button class="btn-secondary" @click="confirm = true">
          <UiAppIcon name="delete" :size="16" />Delete</button
        ><button class="btn" @click="edit = true">
          <UiAppIcon name="edit" :size="16" />Edit transaction
        </button></template
      ></UiPageHeader
    ><UiFeedback :error="error" :success="success" :pending="pending" />
    <div v-if="transaction" class="card max-w-2xl">
      <div class="mb-7 flex items-center gap-4">
        <span
          class="rounded-xl p-4"
          :style="{
            color: category?.color,
            backgroundColor: `${category?.color}15`,
          }"
          ><UiAppIcon :name="category?.icon || 'receipt'" :size="28"
        /></span>
        <div>
          <p class="muted capitalize">{{ transaction.type }}</p>
          <h2
            class="mt-1 text-3xl font-bold"
            :class="transaction.type === 'income' ? 'text-emerald-700' : ''"
          >
            {{ transaction.type === 'income' ? '+' : '−'
            }}{{ money(transaction.amount, auth.profile?.currency) }}
          </h2>
        </div>
      </div>
      <dl class="grid grid-cols-2 gap-6 border-t border-slate-100 pt-6">
        <div>
          <dt class="muted">Category</dt>
          <dd class="mt-1 font-medium">{{ category?.name }}</dd>
        </div>
        <div>
          <dt class="muted">Date</dt>
          <dd class="mt-1 font-medium">
            {{ displayDate(transaction.transaction_date) }}
          </dd>
        </div>
        <div class="col-span-2">
          <dt class="muted">Description</dt>
          <dd class="mt-1 whitespace-pre-wrap break-words">
            {{ transaction.description || 'No description' }}
          </dd>
        </div>
        <div>
          <dt class="muted">Added</dt>
          <dd class="mt-1 text-sm">
            {{ new Date(transaction.created_at).toLocaleString() }}
          </dd>
        </div>
        <div>
          <dt class="muted">Last updated</dt>
          <dd class="mt-1 text-sm">
            {{ new Date(transaction.updated_at).toLocaleString() }}
          </dd>
        </div>
      </dl>
      <button
        v-if="transaction.receipt_path"
        class="btn-secondary mt-6"
        :disabled="pending"
        @click="openReceipt"
      >
        <UiAppIcon name="receipt" :size="17" />View receipt
      </button>
    </div>
    <UiBaseModal
      v-if="edit && transaction"
      title="Edit transaction"
      @close="edit = false"
      ><TransactionsTransactionForm
        :transaction="transaction"
        @saved="saved"
        @close="edit = false" /></UiBaseModal
    ><UiConfirmDialog
      v-if="confirm"
      title="Delete transaction?"
      description="This entry will be permanently deleted and any attached receipt will be removed."
      :pending="deletion.pending.value"
      :error="deletion.error.value"
      @close="confirm = false"
      @confirm="remove"
    />
  </div>
</template>
