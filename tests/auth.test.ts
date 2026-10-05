import { beforeEach, describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../stores/auth'
const reset = vi.fn()
const profile = { id: 'alice', full_name: 'Alice', currency: 'USD' }
const client = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(),
}
beforeEach(() => {
  setActivePinia(createPinia())
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { demoMode: false } }))
  vi.stubGlobal('useNuxtApp', () => ({ $supabaseConfigured: true }))
  vi.stubGlobal('useDatabase', () => client)
  vi.stubGlobal('useCategoriesStore', () => ({ $reset: reset }))
  vi.stubGlobal('useBudgetsStore', () => ({ $reset: reset }))
  vi.stubGlobal('useTransactionsStore', () => ({ $reset: reset }))
  vi.stubGlobal('navigateTo', vi.fn())
  client.auth.getSession.mockResolvedValue({
    data: { session: { user: { id: 'alice' } } },
    error: null,
  })
  client.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  })
  client.from.mockReturnValue({
    select: () => ({
      eq: () => ({ single: async () => ({ data: profile, error: null }) }),
    }),
  })
})
describe('authentication state', () => {
  it('opens a demo identity without restoring or contacting Supabase', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { demoMode: true } }))
    localStorage.clear()
    const store = useAuthStore()
    await store.initialize()
    expect(store.ready).toBe(true)
    expect(store.profile?.full_name).toBe('Alex Morgan')
    expect(client.auth.getSession).not.toHaveBeenCalled()
    expect(client.from).not.toHaveBeenCalled()
  })
  it('restores the persistent session once across concurrent route checks', async () => {
    const store = useAuthStore()
    await Promise.all([store.initialize(), store.initialize()])
    expect(store.user?.id).toBe('alice')
    expect(store.ready).toBe(true)
    expect(client.auth.getSession).toHaveBeenCalledTimes(1)
  })
  it('clears shared financial data on logout', async () => {
    const store = useAuthStore()
    await store.initialize()
    client.auth.signOut.mockResolvedValue({ error: null })
    await store.logout()
    expect(store.user).toBeNull()
    expect(store.profile).toBeNull()
    expect(reset).toHaveBeenCalledTimes(3)
    expect(navigateTo).toHaveBeenCalledWith('/login')
  })
  it('retains session on failed logout so errors can be retried', async () => {
    const store = useAuthStore()
    await store.initialize()
    client.auth.signOut.mockResolvedValue({
      error: { message: 'Network error' },
    })
    await expect(store.logout()).rejects.toThrow('Network error')
    expect(store.user?.id).toBe('alice')
  })
  it('does not treat an unconfirmed signup as authenticated', async () => {
    const store = useAuthStore()
    client.auth.signUp.mockResolvedValue({
      data: { user: { id: 'alice' }, session: null },
      error: null,
    })
    expect(
      await store.register('alice@test.dev', 'strong-password', 'Alice'),
    ).toBe(false)
    expect(store.user).toBeNull()
  })
  it('surfaces credential failures', async () => {
    const store = useAuthStore()
    client.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    })
    await expect(store.login('alice@test.dev', 'wrong')).rejects.toThrow(
      'Invalid login credentials',
    )
    expect(store.user).toBeNull()
  })
  it('loads the profile after successful login', async () => {
    const store = useAuthStore()
    client.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'alice' } },
      error: null,
    })
    await store.login('alice@test.dev', 'password')
    expect(store.profile?.full_name).toBe('Alice')
  })
  it('clears data when another tab changes the signed-in account', async () => {
    const store = useAuthStore()
    await store.initialize()
    const callback = client.auth.onAuthStateChange.mock.calls[0]![0] as (
      event: string,
      session: unknown,
    ) => void
    callback('SIGNED_IN', { user: { id: 'bob' } })
    expect(store.user?.id).toBe('bob')
    expect(reset).toHaveBeenCalledTimes(3)
  })
})
