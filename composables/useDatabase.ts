export function useDatabase() {
  const { $supabase, $supabaseConfigured } = useNuxtApp()
  if (!$supabaseConfigured)
    throw new Error(
      'Supabase is not configured. Set the variables in .env.example and restart the app.',
    )
  return $supabase
}
