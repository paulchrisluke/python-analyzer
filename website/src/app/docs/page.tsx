import { AuthGuard } from "@/components/auth-guard"
import { DocumentsTable } from "@/components/documents-table"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"

export default function DocsPage() {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          
          {/* Main Content */}
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                
                {/* Page Header */}
                <div className="px-4 lg:px-6">
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Due Diligence Documents</h1>
                    <p className="text-muted-foreground mt-2">
                      Access comprehensive documentation for business evaluation and due diligence
                    </p>
                  </div>
                </div>

                {/* Documents Table */}
                <div className="px-4 lg:px-6">
                  <DocumentsTable />
                </div>

                {/* Additional Document Categories */}
                <div className="px-4 lg:px-6">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="border rounded-lg p-6">
                      <h2 className="text-xl font-semibold mb-3">Financial Reports</h2>
                      <p className="text-muted-foreground mb-4">Access to financial statements, tax documents, and revenue analysis.</p>
                      <button className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90">
                        View Reports
                      </button>
                    </div>
                    <div className="border rounded-lg p-6">
                      <h2 className="text-xl font-semibold mb-3">Equipment Analysis</h2>
                      <p className="text-muted-foreground mb-4">Detailed equipment inventory and valuation reports.</p>
                      <button className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90">
                        View Equipment
                      </button>
                    </div>
                    <div className="border rounded-lg p-6">
                      <h2 className="text-xl font-semibold mb-3">Legal Documents</h2>
                      <p className="text-muted-foreground mb-4">Leases, insurance contracts, and legal agreements.</p>
                      <button className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90">
                        View Documents
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
