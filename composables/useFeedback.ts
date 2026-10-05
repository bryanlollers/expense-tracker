import { ZodError } from 'zod'
export function useFeedback() {
  const error = ref('')
  const success = ref('')
  const pending = ref(false)
  let request = 0
  async function run(action: () => Promise<void>, message = '') {
    const current = ++request
    error.value = ''
    success.value = ''
    pending.value = true
    try {
      await action()
      if (current === request) success.value = message
      return true
    } catch (e) {
      if (current === request)
        error.value =
          e instanceof ZodError
            ? e.issues[0]?.message || 'Check the form fields.'
            : e instanceof Error
              ? e.message
              : 'Something went wrong. Please try again.'
      return false
    } finally {
      if (current === request) pending.value = false
    }
  }
  return { error, success, pending, run }
}
