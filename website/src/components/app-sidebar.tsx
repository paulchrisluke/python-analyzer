"use client"

import * as React from "react"
import {
  ArrowUpCircleIcon,
  BarChartIcon,
  Building2Icon,
  CalculatorIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  ListIcon,
  MapPinIcon,
  SettingsIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react"
import { useSession } from "@/lib/simple-auth"
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

// Public (unauthenticated) navigation data
const getPublicNavData = () => ({
  navMain: [
    {
      title: "Investment Highlights",
      url: getAnchorUrl("INVESTMENT_HIGHLIGHTS"),
      icon: BarChartIcon,
    },
    {
      title: "Business Details",
      url: getAnchorUrl("BUSINESS_DETAILS"),
      icon: Building2Icon,
    },
    {
      title: "Location Information",
      url: getAnchorUrl("LOCATION_INFORMATION"),
      icon: MapPinIcon,
    },
    {
      title: "Due Diligence",
      url: getAnchorUrl("DUE_DILIGENCE"),
      icon: FolderIcon,
    },
  ],
  navClouds: [
    {
      title: "Request Info",
      icon: ArrowUpCircleIcon,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Schedule Meeting",
          url: "#",
        },
        {
          title: "Request Documents",
          url: "#",
        },
      ],
    },
    {
      title: "Investment",
      icon: FileTextIcon,
      url: "#",
      items: [
        {
          title: "Financial Analysis",
          url: "#",
        },
        {
          title: "Market Research",
          url: "#",
        },
      ],
    },
    {
      title: "Legal",
      icon: FileCodeIcon,
      url: "#",
      items: [
        {
          title: "Contracts",
          url: "#",
        },
        {
          title: "Compliance",
          url: "#",
        },
      ],
    },
  ],
})

// Authenticated user navigation data
const getAuthenticatedNavData = (user: { name?: string; email?: string; image?: string | null }) => ({
  user: {
    name: user?.name || "User",
    email: user?.email || "user@example.com",
    avatar: user?.image || "/avatars/user.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Investment Highlights",
      url: getAnchorUrl("INVESTMENT_HIGHLIGHTS"),
      icon: BarChartIcon,
    },
    {
      title: "Business Details",
      url: getAnchorUrl("BUSINESS_DETAILS"),
      icon: Building2Icon,
    },
    {
      title: "Location Information",
      url: getAnchorUrl("LOCATION_INFORMATION"),
      icon: MapPinIcon,
    },
    {
      title: "Due Diligence",
      url: getAnchorUrl("DUE_DILIGENCE_DOCUMENTS"),
      icon: FolderIcon,
    },
  ],
  navAdmin: [
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
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: SettingsIcon,
    },
    {
      title: "Get Help",
      url: "#",
      icon: HelpCircleIcon,
    },
  ],
  documents: [
    {
      name: "Financial Reports",
      url: "/docs",
      icon: DatabaseIcon,
    },
    {
      name: "Due Diligence",
      url: "/docs",
      icon: ClipboardListIcon,
    },
    {
      name: "Equipment List",
      url: "/docs",
      icon: FileIcon,
    },
    {
      name: "Legal Documents",
      url: "/docs",
      icon: FileTextIcon,
    },
  ],
})

// Admin-specific navigation data (cleaner, focused on admin tasks)
const getAdminNavData = (user: { name?: string; email?: string; image?: string | null }) => ({
  user: {
    name: user?.name || "Admin",
    email: user?.email || "admin@example.com",
    avatar: user?.image || "/avatars/admin.jpg",
  },
  navMain: [
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
    {
      title: "Pipeline Status",
      url: "/admin/pipeline",
      icon: CalculatorIcon,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/admin/settings",
      icon: SettingsIcon,
    },
    {
      title: "Get Help",
      url: "#",
      icon: HelpCircleIcon,
    },
  ],
})

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  console.log("📱 AppSidebar rendering");
  
  const { data: session } = useSession()
  const pathname = usePathname()
  const isAuthenticated = !!session?.user
  
  // Check if we're on an admin page
  const isAdminPage = pathname.startsWith('/admin')
  
  // Get appropriate navigation data based on auth state and page type
  const data = isAuthenticated 
    ? (isAdminPage ? getAdminNavData(session.user) : getAuthenticatedNavData(session.user))
    : getPublicNavData()

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
        
        {/* Admin section - only for authenticated users on non-admin pages */}
        {isAuthenticated && !isAdminPage && (data as any).navAdmin && (data as any).navAdmin.length > 0 && (
          <div className="px-2 py-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Admin Tools
            </div>
            <NavMain items={(data as any).navAdmin} showRequestInfo={false} />
          </div>
        )}
        
        {/* Documents section - only for authenticated users on non-admin pages */}
        {isAuthenticated && !isAdminPage && (data as any).documents && (data as any).documents.length > 0 && (
          <NavDocuments items={(data as any).documents} />
        )}
        
        {/* Secondary navigation - for authenticated users */}
        {isAuthenticated && (data as any).navSecondary && (data as any).navSecondary.length > 0 && (
          <NavSecondary items={(data as any).navSecondary} className="mt-auto" />
        )}
      </SidebarContent>
      <SidebarFooter>
        {isAuthenticated ? (
          <NavUser user={(data as any).user} />
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
