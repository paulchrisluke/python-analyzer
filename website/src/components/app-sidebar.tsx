"use client"

import * as React from "react"
import {
  ArrowUpCircleIcon,
  BarChartIcon,
  Building2Icon,
  CalculatorIcon,
  ClipboardListIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  HelpCircleIcon,
  HomeIcon,
  LayoutDashboardIcon,
  MapPinIcon,
  PenToolIcon,
  SettingsIcon,
  ShieldIcon,
  UserIcon,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { getAnchorUrl, ANCHORS } from "@/lib/anchors"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { NDAStatusResponse } from "@/types/nda"

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

const publicNavItems = [
  salesPageItem,
  {
    title: "Sign NDA",
    url: "/nda",
    icon: PenToolIcon,
  },
]

const adminNavItems = [
  {
    title: "Admin Dashboard",
    url: "/admin",
    icon: ShieldIcon,
  },
  {
    title: "Documents",
    url: "/admin/documents",
    icon: FileTextIcon,
  },
]

// Buyer-specific navigation items
const buyerNavItems = [
  {
    title: "Buyer Dashboard",
    url: "/buyer",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Sign NDA",
    url: "/nda",
    icon: PenToolIcon,
  },
]

// Get navigation data based on user role
const getNavData = (user: { name?: string; email?: string; image?: string | null; role?: string } | null, ndaStatus: NDAStatusResponse | null) => {
  const isAuthenticated = !!user
  const isAdmin = user?.role === 'admin'
  const isBuyer = user?.role === 'buyer'
  
  // Create NDA items with status
  const createNDAItem = (baseItem: any) => ({
    ...baseItem,
    title: ndaStatus?.isSigned ? `${baseItem.title} (Signed)` : baseItem.title,
    badge: ndaStatus?.isSigned ? "Signed" : undefined
  })
  
  let navMain = isAuthenticated ? [salesPageItem] : publicNavItems.map(item => 
    item.title === "Sign NDA" ? createNDAItem(item) : item
  )
  let sections = []
  
  // Add role-specific navigation with section headers
  if (isAdmin) {
    // Admins can see buyer pages for oversight (shown first)
    sections.push({
      title: "Buyer Pages",
      items: buyerNavItems.map(item => 
        item.title === "Sign NDA" ? createNDAItem(item) : item
      )
    })
    // Admin section comes last
    sections.push({
      title: "Admin",
      items: adminNavItems
    })
  } else if (isBuyer) {
    sections.push({
      title: "Buyer",
      items: buyerNavItems.map(item => 
        item.title === "Sign NDA" ? createNDAItem(item) : item
      )
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
  const [ndaStatus, setNdaStatus] = React.useState<NDAStatusResponse | null>(null)
  
  console.log("🔍 Sidebar Debug:", {
    isAuthenticated,
    userRole: session?.user?.role,
    userEmail: session?.user?.email
  })
  
  // Fetch NDA status for authenticated users
  React.useEffect(() => {
    if (!isAuthenticated) {
      setNdaStatus(null)
      return
    }

    const fetchNDAStatus = async () => {
      try {
        const response = await fetch('/api/nda/status')
        if (response.ok) {
          const data = await response.json()
          setNdaStatus(data.data)
        }
      } catch (error) {
        console.error('Error fetching NDA status:', error)
      }
    }

    fetchNDAStatus()
  }, [isAuthenticated])
  
  // Get navigation data based on user role
  const data = getNavData(session?.user || null, ndaStatus)

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Cranberry Hearing</span>
              </Link>
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
                <Link href="/api/auth/signin">
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
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
