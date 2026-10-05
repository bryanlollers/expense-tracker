<script setup lang="ts">
import { getDemoRepository } from '~/utils/demoRepository'
const confirm = ref(false)
const { error, pending, run } = useFeedback()
async function reset() {
  await run(async () => {
    await getDemoRepository().reset()
    window.location.assign('/')
  })
}
</script>
<template>
  <div
    class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
  >
    <div class="flex items-start gap-3">
      <UiAppIcon
        name="leaf"
        :size="18"
        class="mt-0.5 shrink-0 text-emerald-700"
      />
      <div>
        <p class="text-sm font-semibold text-emerald-900">Demo workspace</p>
        <p class="mt-0.5 text-xs leading-relaxed text-emerald-800">
          Sample data · No signup · Your changes stay in this browser
        </p>
      </div>
    </div>
    <button
      class="btn-secondary !border-emerald-200 !text-emerald-800"
      @click="confirm = true"
    >
      Reset demo
    </button>
  </div>
  <UiBaseModal
    v-if="confirm"
    title="Reset demo?"
    @close="!pending && (confirm = false)"
    ><p class="muted">
      This restores the sample workspace and removes your demo edits and
      uploaded receipts from this browser.
    </p>
    <UiFeedback :error="error" />
    <div class="mt-6 flex justify-end gap-3">
      <button
        class="btn-secondary"
        :disabled="pending"
        @click="confirm = false"
      >
        Cancel</button
      ><button class="btn" :disabled="pending" @click="reset">
        {{ pending ? 'Resetting…' : 'Reset demo' }}
      </button>
    </div></UiBaseModal
  >
</template>
