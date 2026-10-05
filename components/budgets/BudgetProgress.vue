<script setup lang="ts">
import { computed } from 'vue'
import { budgetProgress, money } from '~/utils/finance'
const props = defineProps<{
  name: string
  amount: number
  spent: number
  color?: string
  icon?: string
  compact?: boolean
}>()
const progress = computed(() => budgetProgress(props.amount, props.spent))
const auth = useAuthStore()
</script>
<template>
  <div>
    <div class="mb-3 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <span
          v-if="icon"
          class="rounded-lg p-2"
          :style="{
            color: color || '#059669',
            backgroundColor: `${color || '#059669'}15`,
          }"
          ><UiAppIcon :name="icon" :size="17"
        /></span>
        <p class="text-sm font-medium">{{ name }}</p>
      </div>
      <span
        class="text-xs font-medium"
        :class="progress.exceeded ? 'text-red-600' : 'text-slate-500'"
        >{{ progress.percentage }}%</span
      >
    </div>
    <div
      role="progressbar"
      :aria-label="`${name} budget used`"
      :aria-valuenow="Math.min(progress.percentage, 100)"
      :aria-valuetext="`${progress.percentage}% used`"
      aria-valuemin="0"
      aria-valuemax="100"
      class="h-2 overflow-hidden rounded-full bg-slate-100"
    >
      <div
        class="h-full rounded-full transition-all"
        :style="{
          width: `${Math.min(progress.percentage, 100)}%`,
          backgroundColor: progress.exceeded ? '#dc2626' : color || '#059669',
        }"
      />
    </div>
    <div class="mt-2 flex justify-between text-xs">
      <span class="text-slate-500"
        ><span class="font-medium text-slate-700">{{
          money(spent, auth.profile?.currency)
        }}</span>
        of {{ money(amount, auth.profile?.currency) }}</span
      ><span :class="progress.exceeded ? 'text-red-600' : 'text-slate-400'"
        >{{ money(Math.abs(progress.remaining), auth.profile?.currency) }}
        {{ progress.exceeded ? 'over' : 'left' }}</span
      >
    </div>
    <slot />
  </div>
</template>
