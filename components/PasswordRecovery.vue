<script setup lang="ts">
const props = defineProps<{ reset?: boolean }>()
const auth = useAuthStore()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const sent = ref(false)
const configured = useNuxtApp().$supabaseConfigured
const { error, pending, run } = useFeedback()
async function submit() {
  await run(async () => {
    if (props.reset) {
      if (password.value !== confirmPassword.value)
        throw new Error('Passwords do not match')
      await auth.resetPassword(password.value)
    } else {
      await auth.requestPasswordReset(email.value.trim())
    }
    password.value = ''
    confirmPassword.value = ''
    sent.value = true
  })
}
</script>
<template>
  <div>
    <h1 class="text-3xl font-extrabold tracking-tight">
      {{ reset ? 'Set a new password' : 'Forgot password?' }}
    </h1>
    <p class="muted mt-3">
      {{
        reset
          ? 'Choose a password with at least 8 characters.'
          : 'Enter your email and we’ll send you a password reset link.'
      }}
    </p>
    <p v-if="!configured" role="status" class="muted mt-6">
      Connect your Supabase project to use password recovery.
    </p>
    <div
      v-if="sent"
      role="status"
      class="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800"
    >
      {{
        reset
          ? 'Your password has been updated.'
          : 'If an account exists for that email, you’ll receive a password reset link. Check your inbox and spam folder.'
      }}
      <NuxtLink v-if="reset" to="/" class="mt-3 block font-semibold underline"
        >Continue to your account</NuxtLink
      >
    </div>
    <div v-else-if="reset && !auth.user" role="alert" class="mt-6">
      <p>This reset link is invalid or expired.</p>
      <NuxtLink
        to="/forgot-password"
        class="font-semibold text-emerald-700 underline"
        >Request a new reset link</NuxtLink
      >
    </div>
    <form v-else class="mt-8 space-y-5" @submit.prevent="submit">
      <template v-if="reset">
        <div class="field">
          <label for="password">New password</label
          ><input
            id="password"
            v-model="password"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
          />
        </div>
        <div class="field">
          <label for="confirm-password">Confirm password</label
          ><input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
          />
        </div>
      </template>
      <div v-else class="field">
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
      <UiFeedback :error="error" />
      <button class="btn w-full" :disabled="pending || !configured">
        {{
          pending
            ? 'Please wait…'
            : reset
              ? 'Update password'
              : 'Send reset link'
        }}
      </button>
    </form>
    <NuxtLink
      to="/login"
      class="mt-7 block text-center font-semibold text-emerald-700"
      >Back to sign in</NuxtLink
    >
  </div>
</template>
