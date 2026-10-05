<script setup lang="ts">
import { money } from '~/utils/finance'
const props = defineProps<{
  items: { month: string; income: number; expenses: number }[]
  currency?: string
}>()
const max = computed(() =>
  Math.max(100, ...props.items.flatMap((v) => [v.income, v.expenses])),
)
function label(month: string) {
  return new Date(`${month}-01T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
  })
}
</script>
<template>
  <div>
    <div class="mb-5 flex justify-end gap-5 text-xs text-slate-500">
      <span class="flex items-center gap-2"
        ><span class="h-2 w-2 rounded-full bg-emerald-600" />Income</span
      ><span class="flex items-center gap-2"
        ><span class="h-2 w-2 rounded-full bg-[#b9d9ca]" />Expenses</span
      >
    </div>
    <div class="overflow-x-auto">
      <div
        class="relative pl-12"
        :style="{ minWidth: `${Math.max(280, items.length * 40 + 48)}px` }"
      >
        <div
          class="pointer-events-none absolute inset-0 flex flex-col justify-between pb-8 text-[10px] text-slate-400"
        >
          <div
            v-for="ratio in [1, 0.75, 0.5, 0.25, 0]"
            :key="ratio"
            class="flex items-center gap-2"
          >
            <span class="w-10 text-right">{{
              new Intl.NumberFormat('en-US', {
                notation: 'compact',
                maximumFractionDigits: 1,
              }).format(max * ratio)
            }}</span>
            <div class="flex-1 border-t border-dashed border-slate-100" />
          </div>
        </div>
        <div
          class="relative flex h-[230px] items-end justify-around gap-3 pb-8"
        >
          <div
            v-for="item in items"
            :key="item.month"
            class="group relative flex h-full flex-1 items-end justify-center gap-1.5"
          >
            <div
              class="w-full max-w-5 rounded-t bg-emerald-600"
              :style="{
                height: `${(item.income / max) * 100}%`,
                minHeight: item.income ? '3px' : '0',
              }"
            />
            <div
              class="w-full max-w-5 rounded-t bg-[#b9d9ca]"
              :style="{
                height: `${(item.expenses / max) * 100}%`,
                minHeight: item.expenses ? '3px' : '0',
              }"
            />
            <span class="absolute -bottom-7 text-[11px] text-slate-400">{{
              label(item.month)
            }}</span>
            <div
              class="absolute bottom-full z-10 hidden whitespace-nowrap rounded-md bg-slate-800 p-2 text-xs text-white group-hover:block"
            >
              {{ label(item.month) }} ·
              {{ money(item.income, currency) }} income ·
              {{ money(item.expenses, currency) }} expenses
            </div>
          </div>
        </div>
      </div>
    </div>
    <details class="mt-3 text-xs text-slate-400">
      <summary class="cursor-pointer">View chart data</summary>
      <table class="mt-2 w-full text-left">
        <caption class="sr-only">
          Monthly income and expenses
        </caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Income</th>
            <th>Expenses</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.month">
            <th class="font-normal">{{ item.month }}</th>
            <td>{{ money(item.income, currency) }}</td>
            <td>{{ money(item.expenses, currency) }}</td>
          </tr>
        </tbody>
      </table>
    </details>
  </div>
</template>
