import withNuxt from './.nuxt/eslint.config.mjs'
export default withNuxt({
  ignores: ['127.0.0.1/**', 'test-results/**', 'playwright-report/**'],
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/html-self-closing': [
      'warn',
      { html: { void: 'always', normal: 'always', component: 'always' } },
    ],
  },
})
