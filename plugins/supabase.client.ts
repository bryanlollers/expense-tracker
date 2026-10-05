import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database'
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public
  const configured = Boolean(config.supabaseUrl && config.supabaseKey)
  const supabase = createClient<Database>(
    config.supabaseUrl || 'https://unconfigured.supabase.co',
    config.supabaseKey || 'unconfigured',
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  )
  return { provide: { supabase, supabaseConfigured: configured } }
})
