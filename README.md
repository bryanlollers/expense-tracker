# Expense Tracker

[**Live demo**](https://expense-tracker-bryanlollers.vercel.app)

A responsive personal finance portfolio project built with Nuxt 3, Vue 3, TypeScript, Tailwind CSS, Pinia, and Supabase.

## Demo

Explore six months of sample data without signing up. Your transactions, budgets, profile changes, and receipts stay in your browser. Reset demo restores the sample workspace.

## Features

- Income and expense tracking with search, filters, sorting, and pagination.
- Dashboard charts, monthly and category budgets, and CSV reports.
- Custom categories, 42 display currencies, and receipts up to 5 MB.
- Responsive desktop and mobile layouts with accessible forms and feedback.

## Screenshots

![Dashboard](docs/screenshots/demo-dashboard.png)

[Mobile screenshot](docs/screenshots/demo-mobile.png)

## Engineering highlights

Vue Composition API, reusable components, focused Pinia stores, typed composables, and shared validation keep the application organized. The public demo uses localStorage for records and IndexedDB for receipts.

The project also includes Supabase authentication, PostgreSQL migrations, and private Storage. Row Level Security enforces ownership on profiles, categories, transactions, and budgets. Composite foreign keys prevent cross-account category references.

Automated tests cover authentication, financial calculations, validation, demo persistence, visitor isolation, receipts, and database security. See the [verification record](docs/verification.md).

Display currencies relabel amounts without conversion.

## Future improvements

Recurring transactions, CSV import, password recovery, and receipt OCR.
