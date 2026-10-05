<script setup lang="ts">
const props = defineProps<{ register?: boolean }>()
const auth = useAuthStore()
const route = useRoute()
const email = ref('')
const password = ref('')
const name = ref('')
const sent = ref(false)
const { error, pending, run } = useFeedback()
const configured = useNuxtApp().$supabaseConfigured
async function submit() {
  await run(async () => {
    if (props.register) {
      if (name.value.trim().length < 1) throw new Error('Enter your name')
      if (password.value.length < 8)
        throw new Error('Use at least 8 characters')
      const loggedIn = await auth.register(
        email.value.trim(),
        password.value,
        name.value.trim(),
      )
      if (!loggedIn) {
        sent.value = true
        return
      }
    } else await auth.login(email.value.trim(), password.value)
    await navigateTo(safeRedirect(route.query.redirect))
  })
}
</script>
<template>
  <div>
    <span class="mb-5 inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-700"
      ><UiAppIcon :name="register ? 'plus' : 'shield'" :size="24"
    /></span>
    <h1 class="text-3xl font-extrabold tracking-tight">
      {{ register ? 'Start your next chapter' : 'Welcome back' }}
    </h1>
    <p class="muted mt-3">
      {{
        register
          ? 'Create an account and take control of your finances.'
          : 'A little clarity is just a sign-in away.'
      }}
    </p>
    <div
      v-if="!configured"
      role="status"
      class="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
    >
      Connect your Supabase project to get started. Copy
      <code>.env.example</code> to <code>.env</code>, add the project URL and
      public key, and restart the app.
    </div>
    <div
      v-if="sent"
      role="status"
      class="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800"
    >
      Check your email to confirm your account, then sign in.<NuxtLink
        to="/login"
        class="mt-3 block font-semibold underline"
        >Go to sign in</NuxtLink
      >
    </div>
    <form v-else class="mt-8 space-y-5" @submit.prevent="submit">
      <div v-if="register" class="field">
        <label for="name">Full name</label
        ><input
          id="name"
          v-model="name"
          required
          maxlength="100"
          autocomplete="name"
          placeholder="Alex Morgan"
        />
      </div>
      <div class="field">
        <label for="email">Email address</label
        ><input
          id="email"
          v-model="email"
          type="email"
          required
          autocomplete="email"
          placeholder="you@example.com"
        />
      </div>
      <div class="field">
        <label for="password">Password</label
        ><input
          id="password"
          v-model="password"
          type="password"
          required
          :minlength="register ? 8 : 1"
          :autocomplete="register ? 'new-password' : 'current-password'"
          placeholder="Enter your password"
        />
        <p v-if="register" class="text-xs text-slate-400">
          Use at least 8 characters.
        </p>
      </div>
      <UiFeedback :error="error" /><button
        class="btn w-full"
        :disabled="pending || !configured"
      >
        {{ pending ? 'Please wait…' : register ? 'Create account' : 'Sign in'
        }}<UiAppIcon name="arrow" :size="17" />
      </button>
    </form>
    <p class="muted mt-7 text-center">
      {{ register ? 'Already have an account?' : 'New to Expense Tracker?' }}
      <NuxtLink
        :to="register ? '/login' : '/register'"
        class="font-semibold text-emerald-700"
        >{{ register ? 'Sign in' : 'Create an account' }}</NuxtLink
      >
    </p>
    <p
      class="mt-10 flex items-center justify-center gap-2 text-xs text-slate-400"
    >
      <UiAppIcon name="shield" :size="14" />Your financial data stays in your
      workspace.
    </p>
  </div>
</template>
