<script setup lang="ts">
defineProps<{
  title: string
  description: string
  pending?: boolean
  error?: string
}>()
const emit = defineEmits<{ close: []; confirm: [] }>()
</script>
<template>
  <UiBaseModal :title="title" @close="!pending && emit('close')"
    ><p class="muted">{{ description }}</p>
    <UiFeedback :error="error" />
    <div class="mt-6 flex justify-end gap-3">
      <button class="btn-secondary" :disabled="pending" @click="emit('close')">
        Cancel</button
      ><button
        class="btn !bg-red-600 hover:!bg-red-700"
        :disabled="pending"
        @click="emit('confirm')"
      >
        {{ pending ? 'Deleting…' : 'Delete' }}
      </button>
    </div></UiBaseModal
  >
</template>
