import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { loadAdminData } from '@/lib/admin-data-server'
import { requireAdmin } from '@/lib/auth-server'
import { unstable_noStore } from 'next/cache'

unstable_noStore()

// Disable caching for sensitive admin data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DocumentsPage() {
  // Enforce admin authentication on the server before loading sensitive data
  const user = await requireAdmin()
  
  // Only load admin data after confirming user is authenticated as admin
  const adminData = await loadAdminData()


  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Data Sources & Documents" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <h1>Data Sources & Documents</h1>
                <h2>Business Metrics</h2>
                <pre>{JSON.stringify(adminData.businessMetrics, null, 2)}</pre>
                
                <h2>Coverage Analysis</h2>
                <pre>{JSON.stringify(adminData.coverageAnalysis, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
