"use client"

import { useState, useRef, useEffect } from "react"
import { useTranslations } from "next-intl"
import { signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import {
  Bell,
  Search,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Globe,
  Sun,
  Moon,
  Monitor,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { usePathname, useRouter } from "@/i18n/navigation"

/** Simple dropdown that doesn't rely on base-ui Portal (which fails in some envs) */
function SimpleDropdown({
  trigger,
  children,
  align = "end",
}: {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "start" | "end"
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={`absolute top-full z-50 mt-1 min-w-[160px] rounded-lg border bg-popover p-1 text-popover-foreground shadow-md ${
            align === "end" ? "right-0" : "left-0"
          }`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function DropdownLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
      {children}
    </div>
  )
}

function DropdownItem({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function DropdownSeparator() {
  return <div className="-mx-1 my-1 h-px bg-border" />
}

export function Header() {
  const t = useTranslations("common")
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const switchLocale = (locale: "ko" | "en") => {
    router.replace(pathname, { locale })
  }

  const themeIcon = !mounted ? (
    <Monitor className="size-4" />
  ) : theme === "dark" ? (
    <Moon className="size-4" />
  ) : theme === "light" ? (
    <Sun className="size-4" />
  ) : (
    <Monitor className="size-4" />
  )

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6">
      {/* Spacer for mobile menu button */}
      <div className="w-8 md:hidden" />

      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("search")}
            className="w-56 pl-8"
          />
        </div>

        {/* Theme switcher */}
        <SimpleDropdown
          align="end"
          trigger={
            <Button variant="ghost" size="icon" type="button">
              {themeIcon}
            </Button>
          }
        >
          <DropdownLabel>{t("theme") ?? "테마"}</DropdownLabel>
          <DropdownItem onClick={() => setTheme("light")}>
            <Sun className="size-4" />
            {t("themeLight") ?? "라이트"}
          </DropdownItem>
          <DropdownItem onClick={() => setTheme("dark")}>
            <Moon className="size-4" />
            {t("themeDark") ?? "다크"}
          </DropdownItem>
          <DropdownItem onClick={() => setTheme("system")}>
            <Monitor className="size-4" />
            {t("themeSystem") ?? "시스템"}
          </DropdownItem>
        </SimpleDropdown>

        {/* Language switcher */}
        <SimpleDropdown
          align="end"
          trigger={
            <Button variant="ghost" size="icon" type="button">
              <Globe className="size-4" />
            </Button>
          }
        >
          <DropdownLabel>{t("language")}</DropdownLabel>
          <DropdownItem onClick={() => switchLocale("ko")}>
            한국어
          </DropdownItem>
          <DropdownItem onClick={() => switchLocale("en")}>
            English
          </DropdownItem>
        </SimpleDropdown>

        {/* Notifications - placeholder */}
        <Button variant="ghost" size="icon" type="button" className="relative">
          <Bell className="size-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* User menu */}
        <SimpleDropdown
          align="end"
          trigger={
            <Button variant="ghost" type="button" className="gap-2">
              <Avatar className="size-6">
                <AvatarFallback className="text-[10px]">사</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm md:inline-block">사용자</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </Button>
          }
        >
          <DropdownLabel>내 계정</DropdownLabel>
          <DropdownSeparator />
          <DropdownItem onClick={() => router.push("/settings/account")}>
            <User className="size-4" />
            {t("profile")}
          </DropdownItem>
          <DropdownItem onClick={() => router.push("/settings")}>
            <Settings className="size-4" />
            {t("settings")}
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="size-4" />
            {t("logout")}
          </DropdownItem>
        </SimpleDropdown>
      </div>
    </header>
  )
}
