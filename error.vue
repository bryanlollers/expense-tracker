<script setup lang="ts">
import type { NuxtError } from '#app'
defineProps<{ error: NuxtError }>()
</script>
<template>
  <main class="flex min-h-screen items-center justify-center px-6">
    <div class="card max-w-md text-center">
      <h1 class="text-3xl font-bold">
        {{
          error.statusCode === 404 ? 'Page not found' : 'Something went wrong'
        }}
      </h1>
      <p class="muted my-5">
        {{
          error.statusCode === 404
            ? 'This page may have moved. Your workspace is a click away.'
            : 'Please try again. If the problem continues, check your connection.'
        }}
      </p>
      <button class="btn" @click="clearError({ redirect: '/' })">
        Back to workspace
      </button>
    </div>
  </main>
</template>
