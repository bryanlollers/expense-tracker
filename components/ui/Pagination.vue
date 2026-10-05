<script setup lang="ts">
const props = defineProps<{ page: number; count: number; pageSize: number }>()
const emit = defineEmits<{ change: [page: number] }>()
const pages = computed(() =>
  Math.max(1, Math.ceil(props.count / props.pageSize)),
)
</script>
<template>
  <div
    class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4"
  >
    <p class="muted">
      {{ count ? (page - 1) * pageSize + 1 : 0 }}–{{
        Math.min(page * pageSize, count)
      }}
      of {{ count }} transactions
    </p>
    <div class="flex items-center gap-3">
      <button
        class="btn-secondary !p-2"
        :disabled="page <= 1"
        aria-label="Previous page"
        @click="emit('change', page - 1)"
      >
        <UiAppIcon name="left" :size="16" /></button
      ><span class="text-sm">{{ page }} / {{ pages }}</span
      ><button
        class="btn-secondary !p-2"
        :disabled="page >= pages"
        aria-label="Next page"
        @click="emit('change', page + 1)"
      >
        <UiAppIcon name="right" :size="16" />
      </button>
    </div>
  </div>
</template>
