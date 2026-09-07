"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Home } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/data-center", label: "Data Center", icon: BarChart3 },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary font-heading text-sm font-semibold text-primary-foreground">
            MB
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-wide">
              Market Brief
            </span>
            <span className="text-xs text-muted-foreground">
              Futures desk feed
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => {
                const Icon = item.icon
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      render={<Link href={item.href} />}
                      className="data-active:bg-primary/15 data-active:text-primary"
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-4 pb-4">
        <Separator className="mb-3" />
        <Badge variant="outline" className="w-fit border-primary/40 text-primary">
          Mon–Fri ingest
        </Badge>
      </SidebarFooter>
    </Sidebar>
  )
}
