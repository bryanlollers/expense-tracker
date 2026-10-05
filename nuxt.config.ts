export default defineNuxtConfig({
  compatibilityDate: '2025-09-01',
  ssr: false,
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: { demoMode: true, supabaseUrl: '', supabaseKey: '' },
  },
  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      title: 'Ledger · Expense Tracker',
      meta: [
        {
          name: 'description',
          content:
            'Your personal finance workspace. Track spending, plan budgets, and understand your money.',
        },
      ],
    },
  },
  typescript: { strict: true },
})
