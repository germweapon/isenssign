"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  CalendarCheck2,
  CalendarClock,
  Clock,
  FileText,
  LayoutDashboard,
  Send,
  Settings,
  PanelLeft,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Link, usePathname } from "@/i18n/navigation"

interface NavItem {
  href: string
  labelKey: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  groupLabelKey: string
  items: NavItem[]
}

const topLevelItems: NavItem[] = [
  { href: "/", labelKey: "dashboard", icon: LayoutDashboard },
]

const navGroups: NavGroup[] = [
  {
    groupLabelKey: "bookingManagement",
    items: [
      { href: "/event-types", labelKey: "eventTypes", icon: CalendarClock },
      { href: "/bookings", labelKey: "bookings", icon: CalendarCheck2 },
      { href: "/availability", labelKey: "availability", icon: Clock },
    ],
  },
  {
    groupLabelKey: "contractManagement",
    items: [
      { href: "/templates", labelKey: "templates", icon: FileText },
      { href: "/submissions", labelKey: "signRequests", icon: Send },
    ],
  },
]

const bottomItems: NavItem[] = [
  { href: "/settings", labelKey: "settings", icon: Settings },
]

export function AppSidebar() {
  const t = useTranslations("nav")
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <FileText className="size-4" />
        </div>
        <span className="text-lg font-bold tracking-tight">iSensSign</span>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-3">
        {/* Top-level items (Dashboard) */}
        <div className="space-y-1">
          {topLevelItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {t(item.labelKey)}
              </Link>
            )
          })}
        </div>

        {/* Grouped items */}
        {navGroups.map((group) => (
          <div key={group.groupLabelKey}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/50 px-3 pt-4 pb-1">
              {t(group.groupLabelKey)}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {t(item.labelKey)}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        {/* Bottom items (Settings) */}
        <div className="space-y-1 pt-4">
          {bottomItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {t(item.labelKey)}
              </Link>
            )
          })}
        </div>
      </nav>

      <Separator />

      {/* User section */}
      <div className="p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar className="size-8">
            <AvatarFallback>사</AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium leading-none">사용자</p>
            <p className="text-xs text-muted-foreground">user@example.com</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-3 top-3 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X className="size-5" /> : <PanelLeft className="size-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
        {sidebarContent}
      </aside>
    </>
  )
}
