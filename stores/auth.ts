import type { User } from '@supabase/supabase-js'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Profile } from '~/types/database'
import { useDemoMode } from '~/composables/useDemoMode'
import { getDemoRepository } from '~/utils/demoRepository'
import { demoUserId } from '~/utils/demoSeed'
export const useAuthStore = defineStore('auth', () => {
  const user = ref<Pick<User, 'id' | 'email' | 'created_at'> | null>(null)
  const profile = ref<Profile | null>(null)
  const ready = ref(false)
  let initialization: Promise<void> | null = null
  function clearData() {
    profile.value = null
    useCategoriesStore().$reset()
    useBudgetsStore().$reset()
    useTransactionsStore().$reset()
  }
  async function loadProfile() {
    if (useDemoMode()) {
      profile.value = getDemoRepository().profile()
      return
    }
    if (!user.value) return
    const owner = user.value.id
    const { data, error } = await useDatabase()
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()
    if (error) throw new Error(error.message)
    if (user.value?.id === owner) profile.value = data
  }
  async function initialize() {
    if (initialization) return initialization
    initialization = (async () => {
      if (useDemoMode()) {
        user.value = {
          id: demoUserId,
          email: 'alex@example.test',
          created_at: new Date().toISOString(),
        }
        try {
          profile.value = getDemoRepository().profile()
        } catch {
          /* The layout surfaces storage errors while keeping Reset demo accessible. */
        }
        ready.value = true
        return
      }
      if (!useNuxtApp().$supabaseConfigured) {
        ready.value = true
        return
      }
      const client = useDatabase()
      const { data, error } = await client.auth.getSession()
      if (error) {
        ready.value = true
        throw new Error(error.message)
      }
      user.value = data.session?.user ?? null
      client.auth.onAuthStateChange((_event, session) => {
        const next = session?.user ?? null
        if (user.value?.id !== next?.id) clearData()
        user.value = next
        if (
          !next &&
          !['/login', '/register'].includes(window.location.pathname)
        )
          void navigateTo('/login')
      })
      ready.value = true
    })()
    return initialization
  }
  async function login(email: string, password: string) {
    const { data, error } = await useDatabase().auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw new Error(error.message)
    clearData()
    user.value = data.user
    await loadProfile()
  }
  async function register(email: string, password: string, name: string) {
    const { data, error } = await useDatabase().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) throw new Error(error.message)
    user.value = data.user && data.session ? data.user : null
    return Boolean(data.session)
  }
  async function logout() {
    const { error } = await useDatabase().auth.signOut()
    if (error) throw new Error(error.message)
    user.value = null
    clearData()
    await navigateTo('/login')
  }
  async function saveProfile(values: { full_name: string; currency: string }) {
    if (useDemoMode()) {
      profile.value = getDemoRepository().saveProfile(values)
      return
    }
    if (!user.value) throw new Error('Please sign in')
    const { error } = await useDatabase()
      .from('profiles')
      .update(values)
      .eq('id', user.value.id)
    if (error) throw new Error(error.message)
    await loadProfile()
  }
  return {
    user,
    profile,
    ready,
    initialize,
    login,
    register,
    logout,
    loadProfile,
    saveProfile,
  }
})
