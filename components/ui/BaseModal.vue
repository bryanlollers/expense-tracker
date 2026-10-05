<script setup lang="ts">
defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement>()
let previouslyFocused: HTMLElement | null = null
onMounted(() => {
  previouslyFocused = document.activeElement as HTMLElement
  dialog.value?.showModal()
})
onBeforeUnmount(() => {
  dialog.value?.close()
  previouslyFocused?.focus()
})
</script>
<template>
  <Teleport to="body"
    ><dialog
      ref="dialog"
      class="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border-0 p-0 shadow-2xl backdrop:bg-slate-900/40"
      aria-labelledby="modal-title"
      @cancel.prevent="emit('close')"
      @click="
        (e) => {
          if (e.target === dialog) emit('close')
        }
      "
    >
      <div class="p-6">
        <div class="mb-5 flex items-center justify-between">
          <h2 id="modal-title" class="text-lg font-bold">{{ title }}</h2>
          <button
            type="button"
            class="rounded-md p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close dialog"
            @click="emit('close')"
          >
            <UiAppIcon name="close" />
          </button>
        </div>
        <slot />
      </div></dialog
  ></Teleport>
</template>
