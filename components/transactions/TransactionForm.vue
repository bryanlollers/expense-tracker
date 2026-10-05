<script setup lang="ts">
import type { Transaction, TransactionType } from '~/types/database'
import { localDate, transactionSchema, validateReceipt } from '~/utils/finance'
const props = defineProps<{ transaction?: Transaction }>()
const emit = defineEmits<{ saved: [transaction: Transaction]; close: [] }>()
const categories = useCategoriesStore()
const store = useTransactionsStore()
const form = reactive({
  type: props.transaction?.type ?? ('expense' as TransactionType),
  amount: props.transaction?.amount ?? 0,
  category_id: props.transaction?.category_id ?? '',
  description: props.transaction?.description ?? '',
  transaction_date: props.transaction?.transaction_date ?? localDate(),
})
const available = computed(() =>
  categories.items.filter((c) => c.type === form.type),
)
const file = ref<File>()
const removeReceipt = ref(false)
const fields = ref<Record<string, string>>({})
const { error, pending, run } = useFeedback()
watch(
  () => form.type,
  () => {
    form.category_id = ''
    file.value = undefined
  },
)
function selectFile(event: Event) {
  file.value = undefined
  const selected = (event.target as HTMLInputElement).files?.[0]
  if (!selected) return
  try {
    validateReceipt(selected)
    file.value = selected
    removeReceipt.value = false
    error.value = ''
  } catch (e) {
    error.value = (e as Error).message
    ;(event.target as HTMLInputElement).value = ''
  }
}
async function submit() {
  fields.value = {}
  const result = transactionSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues)
      fields.value[String(issue.path[0])] = issue.message
    return
  }
  await run(async () => {
    const saved = await store.save(
      result.data,
      props.transaction?.id,
      file.value,
      removeReceipt.value,
    )
    emit('saved', saved)
  })
}
</script>
<template>
  <form class="space-y-4" @submit.prevent="submit">
    <fieldset :disabled="pending" class="space-y-4">
      <legend class="sr-only">Transaction details</legend>
      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="type in ['expense', 'income'] as const"
          :key="type"
          type="button"
          class="flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium capitalize"
          :class="
            form.type === type
              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
              : 'border-slate-200 text-slate-500'
          "
          :aria-pressed="form.type === type"
          @click="form.type = type"
        >
          <UiAppIcon :name="type === 'expense' ? 'down' : 'up'" :size="18" />{{
            type
          }}
        </button>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="field">
          <label for="amount">Amount</label
          ><input
            id="amount"
            v-model.number="form.amount"
            type="number"
            min="0.01"
            max="9999999999.99"
            step="0.01"
            required
            :aria-invalid="Boolean(fields.amount)"
          />
          <p v-if="fields.amount" class="text-xs text-red-600">
            {{ fields.amount }}
          </p>
        </div>
        <div class="field">
          <label for="date">Date</label
          ><input
            id="date"
            v-model="form.transaction_date"
            type="date"
            required
          />
          <p v-if="fields.transaction_date" class="text-xs text-red-600">
            {{ fields.transaction_date }}
          </p>
        </div>
      </div>
      <div class="field">
        <label for="category">Category</label
        ><select id="category" v-model="form.category_id" required>
          <option value="" disabled>Choose a category</option>
          <option
            v-for="category in available"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>
        <p v-if="fields.category_id" class="text-xs text-red-600">
          {{ fields.category_id }}
        </p>
        <NuxtLink
          v-if="!available.length"
          to="/categories"
          class="text-xs text-emerald-700"
          >Create a {{ form.type }} category first</NuxtLink
        >
      </div>
      <div class="field">
        <label for="description"
          >Description
          <span class="font-normal text-slate-400">(optional)</span></label
        ><textarea
          id="description"
          v-model="form.description"
          rows="2"
          maxlength="500"
          placeholder="What was this for?"
        />
      </div>
      <div v-if="form.type === 'expense'" class="field">
        <label for="receipt"
          >Receipt
          <span class="font-normal text-slate-400">(optional)</span></label
        ><input
          id="receipt"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          class="text-xs"
          @change="selectFile"
        />
        <p class="text-xs text-slate-400">
          JPEG, PNG, WebP, or PDF · Up to 5 MB
        </p>
        <label
          v-if="transaction?.receipt_path"
          class="flex items-center gap-2 text-xs"
          ><input
            v-model="removeReceipt"
            type="checkbox"
            class="!w-auto"
            :disabled="Boolean(file)"
          />Remove current receipt</label
        >
      </div>
    </fieldset>
    <UiFeedback :error="error" />
    <div class="flex justify-end gap-3 border-t border-slate-100 pt-4">
      <button
        type="button"
        class="btn-secondary"
        :disabled="pending"
        @click="emit('close')"
      >
        Cancel</button
      ><button class="btn" :disabled="pending">
        {{
          pending ? 'Saving…' : transaction ? 'Save changes' : 'Add transaction'
        }}
      </button>
    </div>
  </form>
</template>
