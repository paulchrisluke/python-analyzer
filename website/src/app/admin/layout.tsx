"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { RoleGuard } from "@/components/role-guard"
import { UserRole } from "@/lib/roles"
import { useSession } from "@/lib/auth-client"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()

  return (
    <AuthGuard>
      <RoleGuard requiredRole={UserRole.ADMIN}>
        <SidebarProvider>
          <AppSidebar variant="inset" user={session?.user} />
          <SidebarInset>
            <SiteHeader title="Admin Panel" />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  {children}
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </RoleGuard>
    </AuthGuard>
  )
}


