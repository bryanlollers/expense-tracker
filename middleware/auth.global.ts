import { safeRedirect } from '~/utils/finance'
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  await auth.initialize()
  if (['/forgot-password', '/reset-password'].includes(to.path)) return
  const publicPage = ['/login', '/register'].includes(to.path)
  if (!auth.user && !publicPage)
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  if (auth.user && publicPage)
    return navigateTo(safeRedirect(to.query.redirect))
})
