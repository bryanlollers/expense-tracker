<template>
  <main class="grid min-h-screen lg:grid-cols-2">
    <section
      class="relative hidden flex-col justify-between overflow-hidden bg-[#073d31] p-14 text-white lg:flex"
    >
      <NuxtLink to="/login" class="flex items-center gap-2 text-2xl font-bold"
        ><UiAppIcon name="leaf" :size="30" />Expense Tracker</NuxtLink
      >
      <div class="relative z-10 max-w-lg">
        <p
          class="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300"
        >
          A clearer view of your money
        </p>
        <h1 class="text-5xl font-bold leading-[1.2] tracking-tight">
          Small habits.<br />Big possibilities.
        </h1>
        <p class="mt-6 max-w-sm text-lg leading-relaxed text-emerald-100/70">
          Know where your money goes. Give every goal a plan. Build a little
          more peace of mind.
        </p>
        <div class="mt-10 rounded-2xl border border-white/15 bg-white/5 p-6">
          <div class="flex justify-between text-sm text-emerald-100">
            <span>Your next chapter</span><UiAppIcon name="trend" />
          </div>
          <p class="mt-3 text-2xl font-semibold">
            Starts with a little clarity.
          </p>
          <div class="mt-5 flex h-20 items-end gap-3" aria-hidden="true">
            <div
              v-for="(height, index) in [
                20, 32, 28, 42, 38, 55, 48, 65, 60, 76, 70, 80,
              ]"
              :key="index"
              class="flex-1 rounded-t bg-emerald-300/70"
              :style="{ height: `${height}px` }"
            />
          </div>
        </div>
      </div>
      <p class="relative z-10 text-xs text-emerald-100/50">
        A personal workspace for your financial life.
      </p>
      <div
        class="absolute -bottom-48 -right-48 h-[650px] w-[650px] rounded-full border-[80px] border-emerald-500/10"
      />
    </section>
    <section class="flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-sm">
        <div
          class="mb-10 flex items-center gap-2 text-xl font-bold text-emerald-800 lg:hidden"
        >
          <UiAppIcon name="leaf" />Expense Tracker
        </div>
        <slot />
      </div>
    </section>
  </main>
</template>
