"use client"

import * as React from "react"
import {
  ArrowUpCircleIcon,
  BarChartIcon,
  Building2Icon,
  CalculatorIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  HelpCircleIcon,
  HomeIcon,
  LayoutDashboardIcon,
  MapPinIcon,
  SettingsIcon,
  ShieldIcon,
  UserIcon,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { getAnchorUrl, ANCHORS } from "@/lib/anchors"
import { usePathname } from "next/navigation"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Base navigation items
const salesPageItem = {
  title: "Sales Page",
  url: "/",
  icon: HomeIcon,
}

const adminNavItems = [
  {
    title: "Admin Dashboard",
    url: "/admin",
    icon: ShieldIcon,
  },
  {
    title: "Data Sources",
    url: "/admin/documents",
    icon: DatabaseIcon,
  },
  {
    title: "Business Metrics",
    url: "/admin/metrics",
    icon: BarChartIcon,
  },
]

// Buyer-specific navigation items
const buyerNavItems = [
  {
    title: "Dashboard",
    url: "/buyer",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Financial Analysis",
    url: "/buyer/financials",
    icon: BarChartIcon,
  },
  {
    title: "Location Details",
    url: "/buyer/locations",
    icon: MapPinIcon,
  },
  {
    title: "Documents",
    url: "/buyer/documents",
    icon: FileTextIcon,
  },
]

// Get navigation data based on user role
const getNavData = (user: { name?: string; email?: string; image?: string | null; role?: string } | null) => {
  const isAuthenticated = !!user
  const isAdmin = user?.role === 'admin'
  const isBuyer = user?.role === 'buyer'
  
  let navMain = [salesPageItem]
  let sections = []
  
  // Add role-specific navigation with section headers
  if (isAdmin) {
    // Admins can see buyer pages for oversight (shown first)
    sections.push({
      title: "Buyer Pages",
      items: buyerNavItems
    })
    // Admin section comes last
    sections.push({
      title: "Admin",
      items: adminNavItems
    })
  } else if (isBuyer) {
    sections.push({
      title: "Buyer",
      items: buyerNavItems
    })
  }
  
  return {
    user: isAuthenticated ? {
      name: user?.name || "User",
      email: user?.email || "user@example.com",
      avatar: user?.image || "/avatars/user.jpg",
    } : null,
    navMain,
    sections,
    navSecondary: isAuthenticated ? [
      {
        title: "Settings",
        url: isAdmin ? "/admin/settings" : "/settings",
        icon: SettingsIcon,
      },
      {
        title: "Get Help",
        url: "#",
        icon: HelpCircleIcon,
      },
    ] : [],
  }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  console.log("📱 AppSidebar rendering");
  
  const { data: session } = useSession()
  const isAuthenticated = !!session?.user
  
  console.log("🔍 Sidebar Debug:", {
    isAuthenticated,
    userRole: session?.user?.role,
    userEmail: session?.user?.email
  })
  
  // Get navigation data based on user role
  const data = getNavData(session?.user || null)

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Cranberry Hearing</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} showRequestInfo={isAuthenticated} />
        
        {/* Role-specific sections with headers */}
        {data.sections && data.sections.map((section, index) => (
          <div key={index} className="px-2 py-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              {section.title}
            </div>
            <NavMain items={section.items} showRequestInfo={false} />
          </div>
        ))}
        
        {/* Secondary navigation - for authenticated users */}
        {isAuthenticated && data.navSecondary && data.navSecondary.length > 0 && (
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        )}
      </SidebarContent>
      <SidebarFooter>
        {isAuthenticated && data.user ? (
          <NavUser user={data.user} />
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <a href="/login">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">Sign In</span>
                      <span className="truncate text-xs text-muted-foreground">
                        Access your account
                      </span>
                    </div>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
