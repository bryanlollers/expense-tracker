<script setup lang="ts">
defineProps<{ error?: string; success?: string; pending?: boolean }>()
</script>
<template>
  <div
    v-if="error"
    role="alert"
    class="my-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
  >
    <UiAppIcon name="alert" :size="18" class="shrink-0" /><span>{{
      error
    }}</span>
  </div>
  <div
    v-if="success"
    role="status"
    class="my-4 flex gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"
  >
    <UiAppIcon name="check" :size="18" />{{ success }}
  </div>
  <div
    v-if="pending"
    role="status"
    class="my-4 flex items-center gap-2 text-sm text-slate-500"
  >
    <UiAppIcon name="loading" class="animate-spin" :size="18" />Loading…
  </div>
</template>
