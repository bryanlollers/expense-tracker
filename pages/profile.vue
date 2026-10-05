<script setup lang="ts">
import { z } from 'zod'
import { currencyOptions, currencySchema } from '~/utils/currencies'
const auth = useAuthStore()
const demo = useDemoMode()
const { error, success, pending, run } = useFeedback()
const logout = useFeedback()
const form = reactive({ full_name: '', currency: 'USD' })
onMounted(() =>
  run(async () => {
    await auth.loadProfile()
    Object.assign(form, {
      full_name: auth.profile?.full_name || '',
      currency: auth.profile?.currency || 'USD',
    })
  }),
)
async function save() {
  await run(async () => {
    const values = z
      .object({
        full_name: z.string().trim().min(1, 'Enter your name').max(100),
        currency: currencySchema,
      })
      .parse(form)
    await auth.saveProfile(values)
  }, 'Profile updated.')
}
</script>
<template>
  <div>
    <UiPageHeader
      title="Your profile"
      description="A workspace that feels like you."
    /><UiFeedback
      :error="error || logout.error.value"
      :success="success"
      :pending="pending"
    />
    <div class="grid max-w-4xl gap-6 lg:grid-cols-3">
      <section class="card lg:col-span-2">
        <h2 class="mb-6 font-bold">Personal details</h2>
        <form class="space-y-5" @submit.prevent="save">
          <div class="field">
            <label for="profile-name">Full name</label
            ><input
              id="profile-name"
              v-model="form.full_name"
              required
              maxlength="100"
              autocomplete="name"
            />
          </div>
          <div class="field">
            <label for="profile-email">Email</label
            ><input
              id="profile-email"
              :value="auth.user?.email"
              type="email"
              disabled
            />
            <p class="text-xs text-slate-400">
              {{
                demo
                  ? 'Sample identity for this demo. No account is required.'
                  : 'Your verified account email.'
              }}
            </p>
          </div>
          <div class="field">
            <label for="currency">Display currency</label
            ><select id="currency" v-model="form.currency">
              <option
                v-for="currency in currencyOptions"
                :key="currency.code"
                :value="currency.code"
              >
                {{ currency.code }} — {{ currency.name }}
              </option>
            </select>
            <p class="text-xs leading-relaxed text-slate-400">
              All entries use one currency. Changing this relabels existing
              amounts; it does not convert them. Use a single currency
              consistently.
            </p>
          </div>
          <button class="btn" :disabled="pending">
            {{ pending ? 'Saving…' : 'Save changes' }}
          </button>
        </form>
      </section>
      <section class="card self-start">
        <span
          class="mb-4 inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-700"
          ><UiAppIcon name="shield" :size="24"
        /></span>
        <h2 class="text-sm font-bold">
          {{ demo ? 'Your demo workspace' : 'Your private workspace' }}
        </h2>
        <p v-if="demo" class="muted mt-3 leading-relaxed">
          Explore with fictional financial data. Changes and receipts stay in
          this browser. Reset the demo whenever you want a fresh start.
        </p>
        <p v-else class="muted mt-3 leading-relaxed">
          Only your account can access your transactions, budgets, categories,
          and receipts.
        </p>
        <p v-if="!demo" class="mt-5 text-xs text-slate-400">
          Member since
          {{
            auth.user?.created_at
              ? new Date(auth.user.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })
              : '—'
          }}
        </p>
        <button
          v-if="!demo"
          class="btn-secondary mt-6 w-full"
          :disabled="logout.pending.value"
          @click="logout.run(() => auth.logout())"
        >
          <UiAppIcon name="logout" :size="16" />{{
            logout.pending.value ? 'Signing out…' : 'Sign out'
          }}
        </button>
      </section>
    </div>
  </div>
</template>
