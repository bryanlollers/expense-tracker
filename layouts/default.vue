<script setup lang="ts">
const mobile = ref(false)
const auth = useAuthStore()
const { error, run } = useFeedback()
onMounted(() => {
  if (auth.user) void run(() => auth.loadProfile())
})
</script>
<template>
  <div class="min-h-screen">
    <div class="fixed inset-y-0 left-0 hidden lg:block"><AppSidebar /></div>
    <div class="lg:pl-64">
      <header
        class="flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white px-5 sm:px-8"
      >
        <div class="flex items-center gap-3">
          <button
            class="rounded-lg p-2 lg:hidden"
            aria-label="Open navigation"
            @click="mobile = true"
          >
            <UiAppIcon name="menu" /></button
          ><span class="text-sm text-slate-400"
            >Workspace <span class="mx-3 text-slate-300">/</span>
            <span class="font-medium text-slate-700">{{
              $route.path === '/'
                ? 'Overview'
                : $route.path
                    .split('/')[1]!
                    .replace(/^./, (v) => v.toUpperCase())
            }}</span></span
          >
        </div>
        <NuxtLink
          to="/profile"
          class="flex items-center gap-2 rounded-lg text-sm"
          ><span class="hidden text-slate-500 sm:block">Personal account</span
          ><span
            class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-800"
            >{{
              (auth.profile?.full_name || auth.user?.email || 'U')
                .slice(0, 1)
                .toUpperCase()
            }}</span
          ></NuxtLink
        >
      </header>
      <main id="main-content" class="mx-auto max-w-[1440px] p-5 sm:p-8">
        <UiFeedback :error="error" /><slot />
      </main>
      <footer
        class="mx-auto flex max-w-[1440px] justify-between px-8 pb-6 text-xs text-slate-400"
      >
        <span>Ledger · Make room for what matters.</span
        ><span>Personal finance, simplified.</span>
      </footer>
    </div>
    <UiBaseModal v-if="mobile" title="Your workspace" @close="mobile = false"
      ><div class="-mx-6 -mb-6 h-[70vh]">
        <AppSidebar class="!w-full !border-0" @navigate="mobile = false" /></div
    ></UiBaseModal>
  </div>
</template>
