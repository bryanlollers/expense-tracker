<script setup lang="ts">
defineProps<{
  title: string
  value: string
  icon: string
  detail: string
  accent?: boolean
}>()
</script>
<template>
  <div
    class="card relative overflow-hidden"
    :class="accent ? '!border-emerald-800 !bg-[#0d5141] text-white' : ''"
  >
    <div class="flex items-center justify-between">
      <p
        class="text-xs font-medium"
        :class="accent ? 'text-emerald-100/80' : 'text-slate-500'"
      >
        {{ title }}
      </p>
      <span
        class="rounded-lg p-2"
        :class="
          accent ? 'bg-white/10 text-emerald-200' : 'bg-slate-50 text-slate-400'
        "
        ><UiAppIcon :name="icon" :size="17"
      /></span>
    </div>
    <h2 class="mt-4 text-[27px] font-extrabold tracking-tight tabular-nums">
      {{ value }}
    </h2>
    <p
      class="mt-3 flex items-center gap-1.5 text-xs"
      :class="accent ? 'text-emerald-100/60' : 'text-slate-400'"
    >
      {{ detail }}
    </p>
    <div
      v-if="accent"
      class="absolute -bottom-12 -right-12 h-40 w-40 rounded-full border-[25px] border-white/5"
    />
  </div>
</template>
