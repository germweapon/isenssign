"use client"

import { Link, usePathname } from "@/i18n/navigation"
import {
  User,
  Code2,
  Webhook,
  Bell,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { label: "계정", href: "account", icon: User },
  { label: "API", href: "api", icon: Code2 },
  { label: "웹훅", href: "webhooks", icon: Webhook },
  { label: "알림", href: "notifications", icon: Bell },
  { label: "인증", href: "verification", icon: ShieldCheck },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">설정</h1>
        <p className="text-muted-foreground">
          서비스 설정을 관리합니다.
        </p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col md:w-48 md:shrink-0">
          {navItems.map((item) => {
            const href = `/settings/${item.href}` as const
            const isActive = pathname === href || pathname.startsWith(`${href}/`)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
