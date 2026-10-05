<script setup lang="ts">
import { money } from '~/utils/finance'
const props = defineProps<{
  items: { name: string; amount: number; color: string }[]
  currency?: string
}>()
const total = computed(() => props.items.reduce((sum, v) => sum + v.amount, 0))
const gradient = computed(() => {
  if (!total.value) return '#eef2f5'
  let position = 0
  return `conic-gradient(${props.items
    .map((v) => {
      const start = position
      position += (v.amount / total.value) * 100
      return `${v.color} ${start}% ${position}%`
    })
    .join(',')})`
})
</script>
<template>
  <div v-if="total" class="flex flex-col items-center gap-6 sm:flex-row">
    <div
      class="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full"
      :style="{ background: gradient }"
      role="img"
      :aria-label="`Expense breakdown, total ${money(total, currency)}`"
    >
      <div
        class="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white"
      >
        <span class="text-[10px] text-slate-400">TOTAL SPENT</span
        ><span class="mt-1 text-lg font-bold">{{
          money(total, currency)
        }}</span>
      </div>
    </div>
    <ul class="w-full space-y-3">
      <li
        v-for="item in items"
        :key="item.name"
        class="flex items-center justify-between gap-3 text-xs"
      >
        <span class="flex min-w-0 items-center gap-2 text-slate-500"
          ><span
            class="h-2 w-2 shrink-0 rounded-full"
            :style="{ backgroundColor: item.color }"
          /><span class="truncate">{{ item.name }}</span></span
        ><span class="whitespace-nowrap font-medium"
          >{{ money(item.amount, currency) }}
          <span class="ml-1 font-normal text-slate-400"
            >{{ Math.round((item.amount / total) * 100) }}%</span
          ></span
        >
      </li>
    </ul>
  </div>
  <UiEmptyState
    v-else
    title="A clearer picture starts here"
    description="Your spending breakdown will appear when you add expenses."
    icon="reports"
  />
</template>
