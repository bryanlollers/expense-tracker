<script setup lang="ts">
defineProps<{ title: string; description: string }>()
</script>
<template>
  <div class="mb-7 flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-extrabold tracking-tight sm:text-[28px]">
        {{ title }}
      </h1>
      <p class="muted mt-1.5">{{ description }}</p>
    </div>
    <div class="flex max-w-full flex-wrap items-center gap-3"><slot /></div>
  </div>
</template>
