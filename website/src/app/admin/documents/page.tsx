import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import DocumentsPageClient from '@/components/admin/DocumentsPageClient'

export default async function DocumentsPage() {
  // Server-side admin authentication check
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }
  
  if (session.user?.role !== 'admin') {
    redirect('/unauthorized')
  }

  // Only render the client component if admin check passes
  return <DocumentsPageClient />
}