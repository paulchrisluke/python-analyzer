import { AdminOnly } from '@/components/nextauth-guard'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { loadAdminData } from '@/lib/admin-data-server'

export default async function MetricsPage() {
  const adminData = await loadAdminData()

  return (
    <AdminOnly>
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader title="Business Metrics" />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <h1>Business Metrics</h1>
                  <h2>Financial Performance</h2>
                  <pre>{JSON.stringify(adminData.businessMetrics, null, 2)}</pre>
                  
                  <h2>Coverage Analysis</h2>
                  <pre>{JSON.stringify(adminData.coverageAnalysis, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminOnly>
  )
}
