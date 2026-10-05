<script setup lang="ts">
withDefaults(
  defineProps<{ title: string; description?: string; icon?: string }>(),
  { icon: 'receipt', description: '' },
)
</script>
<template>
  <div class="flex flex-col items-center justify-center px-6 py-12 text-center">
    <div class="mb-3 rounded-full bg-slate-100 p-4 text-slate-400">
      <UiAppIcon :name="icon" :size="28" />
    </div>
    <h3 class="font-semibold">{{ title }}</h3>
    <p class="muted mt-2 max-w-sm">{{ description }}</p>
    <div class="mt-4"><slot /></div>
  </div>
</template>
