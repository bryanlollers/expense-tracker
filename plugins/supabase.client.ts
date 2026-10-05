import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database'
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public
  const demo = useDemoMode()
  const configured = Boolean(config.supabaseUrl && config.supabaseKey)
  const supabase = demo
    ? null
    : createClient<Database>(
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
  return { provide: { supabase, supabaseConfigured: !demo && configured } }
})
