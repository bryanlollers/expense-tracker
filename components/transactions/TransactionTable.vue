<script setup lang="ts">
import type { Transaction } from '~/types/database'
import { displayDate, money } from '~/utils/finance'
defineProps<{ items: Transaction[] }>()
const categories = useCategoriesStore()
const auth = useAuthStore()
function category(id: string) {
  return categories.items.find((c) => c.id === id)
}
</script>
<template>
  <div class="relative max-w-full overflow-x-auto">
    <table class="w-full whitespace-nowrap text-left text-sm">
      <caption class="sr-only">
        Transactions
      </caption>
      <thead
        class="border-y border-slate-100 bg-slate-50/60 text-[11px] uppercase tracking-wide text-slate-400"
      >
        <tr>
          <th class="px-5 py-3 font-medium">Transaction</th>
          <th class="px-4 py-3 font-medium">Category</th>
          <th class="px-4 py-3 font-medium">Date</th>
          <th class="px-5 py-3 text-right font-medium">Amount</th>
          <th class="sr-only">Details</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <tr
          v-for="transaction in items"
          :key="transaction.id"
          class="hover:bg-slate-50/70"
        >
          <td class="px-5 py-4">
            <NuxtLink
              :to="`/transactions/${transaction.id}`"
              class="flex items-center gap-3 rounded-lg"
              ><span
                class="rounded-xl p-2.5"
                :style="{
                  color: category(transaction.category_id)?.color,
                  backgroundColor: `${category(transaction.category_id)?.color || '#64748b'}15`,
                }"
                ><UiAppIcon
                  :name="category(transaction.category_id)?.icon || 'receipt'"
                  :size="19"
              /></span>
              <div>
                <p class="max-w-[240px] truncate font-medium">
                  {{
                    transaction.description ||
                    category(transaction.category_id)?.name ||
                    'Transaction'
                  }}
                </p>
                <p class="mt-0.5 text-xs capitalize text-slate-400">
                  {{ transaction.type
                  }}<span v-if="transaction.receipt_path">
                    · Receipt attached</span
                  >
                </p>
              </div></NuxtLink
            >
          </td>
          <td class="px-4 py-4">
            <span
              class="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600"
              >{{ category(transaction.category_id)?.name }}</span
            >
          </td>
          <td class="px-4 py-4 text-xs text-slate-500">
            {{ displayDate(transaction.transaction_date) }}
          </td>
          <td
            class="px-5 py-4 text-right font-semibold tabular-nums"
            :class="
              transaction.type === 'income'
                ? 'text-emerald-700'
                : 'text-slate-700'
            "
          >
            {{ transaction.type === 'income' ? '+' : '−'
            }}{{ money(transaction.amount, auth.profile?.currency) }}
          </td>
          <td class="pr-4">
            <NuxtLink
              :to="`/transactions/${transaction.id}`"
              class="rounded-md p-1 text-slate-400"
              :aria-label="`View ${transaction.description || 'transaction'}`"
              ><UiAppIcon name="right" :size="16"
            /></NuxtLink>
          </td>
        </tr>
      </tbody>
    </table>
    <UiEmptyState
      v-if="!items.length"
      title="No transactions yet"
      description="Add your first transaction, or adjust your filters to find what you’re looking for."
    />
  </div>
</template>
