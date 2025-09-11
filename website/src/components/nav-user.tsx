"use client"

import { UserButton } from "@daveyplate/better-auth-ui"
import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavUser() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <UserButton />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
