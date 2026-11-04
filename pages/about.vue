<script setup lang="ts">
useHead({ title: 'About | Expense Tracker' })
const techStack = [
  {
    category: 'Frontend',
    tools: [
      'Nuxt 3',
      'Vue 3',
      'TypeScript',
      'Tailwind CSS',
      'Lucide',
      'Pinia',
      'Zod',
    ],
  },
  {
    category: 'Backend and storage',
    tools: ['Supabase Auth', 'PostgreSQL', 'Supabase Storage'],
  },
  {
    category: 'Development workflow',
    tools: ['Vercel', 'Git', 'GitHub', 'GitHub Actions'],
  },
  { category: 'AI tools', tools: ['Codex'] },
]
</script>

<template>
  <div>
    <UiPageHeader
      title="About Expense Tracker"
      description="The project, its purpose, and guidelines for using it."
    />
    <div class="max-w-5xl space-y-6">
      <section class="card" aria-labelledby="about-project">
        <div class="flex items-center gap-3">
          <span
            class="inline-flex shrink-0 rounded-xl bg-emerald-50 p-3 text-emerald-700"
          >
            <UiAppIcon name="leaf" :size="24" aria-hidden="true" />
          </span>
          <h2 id="about-project" class="text-xl font-bold tracking-tight">
            A clearer view of everyday finances
          </h2>
        </div>
        <p class="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
          Expense Tracker brings transactions, budgets, and spending reports
          into one workspace. It was built as a portfolio and educational
          project to demonstrate a practical personal finance application and
          modern web development practices.
        </p>
        <div
          class="mt-6 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-3"
        >
          <div>
            <h3 class="text-sm font-semibold">Organize transactions</h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              Record income and expenses, manage categories, and keep receipts
              alongside your entries.
            </p>
          </div>
          <div>
            <h3 class="text-sm font-semibold">Plan your spending</h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              Set monthly and category budgets and follow your progress
              throughout the month.
            </p>
          </div>
          <div>
            <h3 class="text-sm font-semibold">Understand the details</h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              Explore dashboard charts, review spending reports, and export
              transactions as CSV.
            </p>
          </div>
        </div>
      </section>

      <div class="grid gap-6 md:grid-cols-2">
        <section class="card" aria-labelledby="project-purpose">
          <h2 id="project-purpose" class="text-base font-bold">
            Purpose and availability
          </h2>
          <div class="mt-4 space-y-4 text-sm leading-relaxed text-slate-600">
            <p>
              This application is provided for demonstration and educational
              purposes only.
            </p>
            <p>
              This app is not monetized. It is provided free of charge as a
              portfolio and educational project, with no paid subscriptions,
              premium features, advertisements, or affiliate links. It is not
              intended to generate revenue.
            </p>
            <p>
              Availability and data retention are not guaranteed. Stored data,
              including accounts, transactions, and receipts, may be deleted at
              any time without notice.
            </p>
          </div>
        </section>
        <section class="card" aria-labelledby="responsible-use">
          <h2 id="responsible-use" class="text-base font-bold">
            Using the application
          </h2>
          <div class="mt-4 space-y-4 text-sm leading-relaxed text-slate-600">
            <p>
              Use sample data only. Do not upload sensitive personal, financial,
              or payment information.
            </p>
            <p>
              Keep your financial records separately and do not rely on this
              application as your only financial record.
            </p>
            <p>
              The application does not provide financial, investment, tax, or
              accounting advice.
            </p>
          </div>
        </section>
      </div>

      <section
        class="rounded-2xl border border-slate-200 bg-slate-50 p-6"
        aria-labelledby="brand-notice"
      >
        <h2 id="brand-notice" class="text-sm font-semibold text-slate-700">
          Brand notice
        </h2>
        <p class="mt-2 text-sm leading-relaxed text-slate-600">
          The brand name is a fictional placeholder, not an actual business or a
          claim to a registered trademark. Any resemblance to existing brands is
          coincidental; no affiliation or endorsement is implied.
        </p>
      </section>

      <div class="card">
        <section aria-labelledby="about-developer">
          <div class="flex items-center gap-3">
            <span
              class="inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-700"
            >
              <UiAppIcon name="code" :size="24" aria-hidden="true" />
            </span>
            <h2 id="about-developer" class="text-base font-bold">
              Development
            </h2>
          </div>
          <p class="mt-4 text-sm leading-relaxed text-slate-600">
            Developed by
            <span class="font-semibold text-slate-800">bryanlollers</span>,
            Expense Tracker is a hands-on portfolio project exploring
            application design, account authentication, data management, and
            responsive user interfaces. The project brings these elements
            together in a practical workflow for tracking everyday finances.
          </p>
          <div class="mt-5 flex flex-wrap gap-3">
            <a href="https://github.com/bryanlollers" class="btn-secondary"
              >Developer on GitHub</a
            >
            <a
              href="https://github.com/bryanlollers/expense-tracker"
              class="btn-secondary"
              >View source code</a
            >
          </div>
        </section>

        <section
          class="mt-6 border-t border-slate-200 pt-6"
          aria-labelledby="tech-stack"
        >
          <h2 id="tech-stack" class="text-base font-bold">Technology stack</h2>
          <dl class="mt-5 grid gap-6 md:grid-cols-2">
            <div
              v-for="group in techStack"
              :key="group.category"
              class="min-w-0"
            >
              <dt class="text-sm font-semibold">{{ group.category }}</dt>
              <dd class="mt-3 flex flex-wrap gap-2">
                <span
                  v-for="tool in group.tools"
                  :key="tool"
                  class="inline-flex rounded border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                  >{{ tool }}</span
                >
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  </div>
</template>
