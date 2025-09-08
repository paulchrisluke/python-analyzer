"use client"

import * as React from "react"
import {
  ArrowUpCircleIcon,
  BarChartIcon,
  Building2Icon,
  ClipboardListIcon,
  DatabaseIcon,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  ListIcon,
  SettingsIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react"
import { useSession } from "@/lib/auth-client"

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

const getNavData = (user: { name?: string; email?: string; image?: string | null } | null) => ({
  user: {
    name: user?.name || "User",
    email: user?.email || "user@example.com",
    avatar: user?.image || "/avatars/user.jpg",
  },
  navMain: user ? [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Business Sale",
      url: "/",
      icon: BarChartIcon,
    },
    {
      title: "Equipment",
      url: "/docs",
      icon: Building2Icon,
    },
    {
      title: "Operations",
      url: "/docs",
      icon: ListIcon,
    },
    {
      title: "Due Diligence",
      url: "/docs",
      icon: FolderIcon,
    },
  ] : [
    {
      title: "Business Sale",
      url: "/",
      icon: BarChartIcon,
    },
    {
      title: "About",
      url: "/#about",
      icon: HelpCircleIcon,
    },
    {
      title: "Contact",
      url: "/#contact",
      icon: UsersIcon,
    },
  ],
  navClouds: [
    {
      title: "Quick Create",
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
  navSecondary: user ? [
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
  ] : [],
  documents: user ? [
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
  ] : [],
})

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  console.log("📱 AppSidebar rendering");
  
  const { data: session } = useSession()
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
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {session?.user ? (
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
