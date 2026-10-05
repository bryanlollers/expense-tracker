<script setup lang="ts">
import type { Category, TransactionType } from '~/types/database'
const store = useCategoriesStore()
const { error, success, pending, run } = useFeedback()
const editing = ref<Category>()
const open = ref(false)
const deleting = ref<Category>()
const mutation = useFeedback()
function requestDelete(category: Category) {
  deleting.value = category
  mutation.error.value = ''
}
const form = reactive({
  name: '',
  type: 'expense' as TransactionType,
  icon: 'circle',
  color: '#059669',
})
const icons = [
  'utensils',
  'bag',
  'car',
  'home',
  'film',
  'heart',
  'briefcase',
  'laptop',
  'circle',
  'plus',
]
onMounted(() => run(() => store.fetch()))
function edit(category?: Category) {
  editing.value = category
  Object.assign(
    form,
    category
      ? {
          name: category.name,
          type: category.type,
          icon: category.icon,
          color: category.color,
        }
      : { name: '', type: 'expense', icon: 'circle', color: '#059669' },
  )
  mutation.error.value = ''
  open.value = true
}
async function save() {
  const ok = await mutation.run(() => store.save(form, editing.value?.id))
  if (ok) {
    open.value = false
    success.value = 'Category saved.'
  }
}
async function remove() {
  const ok = await mutation.run(() => store.remove(deleting.value!.id))
  if (ok) {
    deleting.value = undefined
    success.value = 'Category deleted.'
  }
}
</script>
<template>
  <div>
    <UiPageHeader
      title="Categories"
      description="Give your income and spending a little structure."
      ><button class="btn" @click="edit()">
        <UiAppIcon name="plus" :size="18" />Add category
      </button></UiPageHeader
    ><UiFeedback :error="error" :success="success" :pending="pending" />
    <section v-for="type in ['expense', 'income']" :key="type" class="mb-8">
      <h2 class="mb-4 text-base font-bold">
        {{ type === 'expense' ? 'Expense categories' : 'Income categories' }}
        <span class="ml-2 text-sm font-normal text-slate-400">{{
          store.items.filter((c) => c.type === type).length
        }}</span>
      </h2>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="category in store.items.filter((c) => c.type === type)"
          :key="category.id"
          class="card flex items-center gap-3"
        >
          <span
            class="rounded-xl p-3"
            :style="{
              color: category.color,
              backgroundColor: `${category.color}15`,
            }"
            ><UiAppIcon :name="category.icon" :size="22"
          /></span>
          <div class="min-w-0 flex-1">
            <h3 class="truncate text-sm font-semibold">{{ category.name }}</h3>
            <p class="mt-1 text-xs capitalize text-slate-400">
              {{ category.type }}
            </p>
          </div>
          <button
            class="rounded-lg p-2 text-slate-400 hover:bg-slate-50"
            :aria-label="`Edit ${category.name}`"
            @click="edit(category)"
          >
            <UiAppIcon name="edit" :size="16" /></button
          ><button
            class="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
            :aria-label="`Delete ${category.name}`"
            @click="requestDelete(category)"
          >
            <UiAppIcon name="delete" :size="16" />
          </button>
        </div>
      </div>
    </section>
    <UiEmptyState
      v-if="!store.items.length && !pending"
      title="Make it your own"
      description="Create categories to organize your transactions."
      icon="categories"
    /><UiBaseModal
      v-if="open"
      :title="editing ? 'Edit category' : 'New category'"
      @close="!mutation.pending.value && (open = false)"
      ><form class="space-y-4" @submit.prevent="save">
        <div class="field">
          <label for="category-name">Name</label
          ><input
            id="category-name"
            v-model="form.name"
            required
            maxlength="60"
          />
        </div>
        <div class="field">
          <label for="category-type">Type</label
          ><select id="category-type" v-model="form.type">
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <p v-if="editing" class="text-xs text-slate-400">
            Type can only change when no transactions or budgets reference this
            category.
          </p>
        </div>
        <div class="field">
          <label for="category-color">Display color</label
          ><input
            id="category-color"
            v-model="form.color"
            type="color"
            class="!h-11 !w-20 !p-1"
          />
        </div>
        <fieldset>
          <legend class="mb-2 text-sm font-medium">Icon</legend>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="icon in icons"
              :key="icon"
              type="button"
              class="rounded-lg border p-2"
              :class="
                form.icon === icon
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 text-slate-400'
              "
              :aria-label="icon"
              :aria-pressed="form.icon === icon"
              @click="form.icon = icon"
            >
              <UiAppIcon :name="icon" />
            </button>
          </div>
        </fieldset>
        <UiFeedback :error="mutation.error.value" />
        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            class="btn-secondary"
            :disabled="mutation.pending.value"
            @click="open = false"
          >
            Cancel</button
          ><button class="btn" :disabled="mutation.pending.value">
            {{ mutation.pending.value ? 'Saving…' : 'Save category' }}
          </button>
        </div>
      </form></UiBaseModal
    ><UiConfirmDialog
      v-if="deleting"
      title="Delete category?"
      :description="`Delete ${deleting.name}? Categories used by transactions or budgets cannot be deleted.`"
      :pending="mutation.pending.value"
      :error="mutation.error.value"
      @close="deleting = undefined"
      @confirm="remove"
    />
  </div>
</template>
