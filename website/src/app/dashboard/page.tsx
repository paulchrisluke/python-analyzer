import { handleDashboardRedirect } from '@/lib/auth-server'

export default async function DashboardPage() {
  // This will never return as it always redirects
  await handleDashboardRedirect()
}
