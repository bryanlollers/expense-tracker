<script setup lang="ts">
const emit = defineEmits<{ navigate: [] }>()
const links = [
  { to: '/', label: 'Overview', icon: 'dashboard' },
  { to: '/transactions', label: 'Transactions', icon: 'transactions' },
  { to: '/budgets', label: 'Budgets', icon: 'budgets' },
  { to: '/reports', label: 'Reports', icon: 'reports' },
  { to: '/categories', label: 'Categories', icon: 'categories' },
]
const auth = useAuthStore()
const demo = useDemoMode()
</script>
<template>
  <aside
    class="flex h-full w-64 flex-col border-r border-slate-200 bg-white p-5"
  >
    <NuxtLink
      to="/"
      class="mb-11 flex items-center gap-2.5 px-2"
      @click="emit('navigate')"
      ><span class="rounded-xl bg-emerald-700 p-2 text-white"
        ><UiAppIcon name="leaf" :size="23" /></span
      ><span class="text-lg font-bold tracking-tight"
        >Expense Tracker</span
      ></NuxtLink
    >
    <p
      class="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400"
    >
      Workspace
    </p>
    <nav aria-label="Main navigation" class="space-y-1.5">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
        :class="{
          '!bg-emerald-50 !text-emerald-800':
            $route.path === link.to ||
            (link.to !== '/' && $route.path.startsWith(link.to)),
        }"
        @click="emit('navigate')"
        ><UiAppIcon :name="link.icon" :size="19" />{{ link.label }}</NuxtLink
      >
    </nav>
    <div class="mt-auto">
      <div class="mb-5 rounded-xl bg-[#f2f7f4] p-4">
        <span class="mb-3 inline-flex rounded-lg bg-white p-2 text-emerald-700"
          ><UiAppIcon name="shield" :size="19"
        /></span>
        <p class="text-sm font-semibold">Your money. Your space.</p>
        <p class="mt-2 text-xs leading-relaxed text-slate-500">
          A little clarity today.<br />A better tomorrow.
        </p>
      </div>
      <NuxtLink
        to="/profile"
        class="flex items-center gap-3 rounded-lg border-t border-slate-100 px-2 py-4"
        @click="emit('navigate')"
        ><span
          class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800"
          >{{
            (auth.profile?.full_name || auth.user?.email || 'U')
              .slice(0, 1)
              .toUpperCase()
          }}</span
        >
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold">
            {{ auth.profile?.full_name || 'My account' }}
          </p>
          <p class="text-xs text-slate-400">
            {{ demo ? 'Demo workspace' : 'Personal workspace' }}
          </p>
        </div>
        <UiAppIcon name="chevron" :size="15" class="ml-auto"
      /></NuxtLink>
    </div>
  </aside>
</template>
