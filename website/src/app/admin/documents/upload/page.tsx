import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { DocumentUpload } from '@/components/admin/document-upload'
import { requireAdmin } from '@/lib/auth-server'
import { unstable_noStore } from 'next/cache'

unstable_noStore()

// Disable caching for sensitive admin data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DocumentUploadPage() {
  // Enforce admin authentication on the server before loading sensitive data
  const user = await requireAdmin()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader title="Upload Document" />

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <DocumentUpload />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
