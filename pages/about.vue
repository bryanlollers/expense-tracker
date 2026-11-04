<script setup lang="ts">
useHead({ title: 'About | Expense Tracker' })
</script>

<template>
  <div>
    <UiPageHeader
      title="About"
      description="A demonstration of personal finance tracking."
    />
    <section class="card max-w-3xl" aria-labelledby="about-project">
      <h2 id="about-project" class="mb-5 text-lg font-bold">
        About this project
      </h2>
      <ul
        class="list-disc space-y-4 pl-5 text-sm leading-relaxed text-slate-600"
      >
        <li>
          This app is a portfolio project for demonstration and educational
          purposes only.
        </li>
        <li>
          The brand name is a fictional placeholder, not an actual business or a
          claim to a registered trademark. Any resemblance to existing brands is
          coincidental; no affiliation or endorsement is implied.
        </li>
        <li>This app is not monetized.</li>
        <li>
          Stored data, including accounts, transactions, and receipts, may be
          deleted at any time without notice. Availability and data retention
          are not guaranteed.
        </li>
        <li>
          Use sample data only. Do not upload sensitive personal, financial, or
          payment information, and do not rely on this app as your only
          financial record.
        </li>
        <li>
          The app does not provide financial, investment, tax, or accounting
          advice.
        </li>
      </ul>
    </section>
  </div>
</template>
