import { handleDashboardRedirect } from '@/lib/auth-server'

// Force this route to be dynamic since it uses headers() for authentication
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // This will never return as it always redirects
  await handleDashboardRedirect()
}
