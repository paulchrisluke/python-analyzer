"use client"

import { MailIcon, PlusCircleIcon, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  showRequestInfo = false,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    id?: string
  }[]
  showRequestInfo?: boolean
}) {
  const pathname = usePathname()
  
  // Debug logging
  console.log('NavMain - Current pathname:', pathname)
  console.log('NavMain - Items:', items.map(item => ({ title: item.title, url: item.url })))

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {showRequestInfo && (
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                tooltip="Request Info"
                className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              >
                <PlusCircleIcon />
                <span>Request Info</span>
              </SidebarMenuButton>
              <Button
                size="icon"
                className="h-9 w-9 shrink-0 group-data-[collapsible=icon]:opacity-0"
                variant="outline"
              >
                <MailIcon />
                <span className="sr-only">Inbox</span>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <SidebarMenu>
          {items.map((item) => {
            // Normalize paths by removing trailing slashes for comparison
            const normalizedPathname = pathname.replace(/\/$/, '') || '/'
            const normalizedItemUrl = item.url.replace(/\/$/, '') || '/'
            const isActive = normalizedPathname === normalizedItemUrl
            
            // Debug logging
            if (isActive) {
              console.log('Active item:', item.title, 'pathname:', pathname, 'normalized:', normalizedPathname, 'url:', item.url, 'normalized:', normalizedItemUrl)
            }
            return (
              <SidebarMenuItem key={item.url || item.id}>
                <SidebarMenuButton 
                  tooltip={item.title} 
                  asChild 
                  isActive={isActive}
                  className={isActive ? "bg-primary text-primary-foreground" : ""}
                >
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
