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
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
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
  it('sends recovery email with the reset page redirect and surfaces failures', async () => {
    const store = useAuthStore()
    client.auth.resetPasswordForEmail.mockResolvedValue({ error: null })
    await store.requestPasswordReset('alice@test.dev')
    expect(client.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'alice@test.dev',
      {
        redirectTo: `${window.location.origin}/reset-password`,
      },
    )
    client.auth.resetPasswordForEmail.mockResolvedValue({
      error: { message: 'Try again later' },
    })
    await expect(store.requestPasswordReset('alice@test.dev')).rejects.toThrow(
      'Try again later',
    )
  })
  it('requires a session and a strong password before updating credentials', async () => {
    const store = useAuthStore()
    await expect(store.resetPassword('new-password')).rejects.toThrow(
      'invalid or expired',
    )
    await store.initialize()
    await expect(store.resetPassword('short')).rejects.toThrow('8 characters')
    expect(client.auth.updateUser).not.toHaveBeenCalled()
    client.auth.updateUser.mockResolvedValue({ error: null })
    await store.resetPassword('new-password')
    expect(client.auth.updateUser).toHaveBeenCalledWith({
      password: 'new-password',
    })
    client.auth.updateUser.mockResolvedValue({
      error: { message: 'Expired session' },
    })
    await expect(store.resetPassword('new-password')).rejects.toThrow(
      'Expired session',
    )
  })
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
