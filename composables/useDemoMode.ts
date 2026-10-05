export function useDemoMode() {
  const value = useRuntimeConfig().public.demoMode
  return value === true || String(value) === 'true'
}
