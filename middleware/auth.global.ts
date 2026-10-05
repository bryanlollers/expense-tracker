import { safeRedirect } from '~/utils/finance'
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  await auth.initialize()
  const publicPage = ['/login', '/register'].includes(to.path)
  if (!auth.user && !publicPage)
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  if (auth.user && publicPage)
    return navigateTo(safeRedirect(to.query.redirect))
})
