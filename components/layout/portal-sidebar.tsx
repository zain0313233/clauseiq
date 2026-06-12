"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Upload,
  MessageSquare,
  Settings,
  LogOut,
  Scale,
  Shield,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-provider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useSidebar } from "./sidebar-context"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Documents", href: "/dashboard/documents", icon: FileText },
  { label: "Upload", href: "/dashboard/upload", icon: Upload },
  { label: "Standards", href: "/dashboard/standards", icon: Shield },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function PortalSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { collapsed, mobileOpen, isMobile, closeMobileSidebar } = useSidebar()

  const showCollapsed = collapsed && !isMobile

  useEffect(() => {
    closeMobileSidebar()
  }, [pathname, closeMobileSidebar])

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  async function handleLogout() {
    closeMobileSidebar()
    await logout()
    router.push("/login")
  }

  function handleNavClick() {
    if (isMobile) closeMobileSidebar()
  }

  return (
    <>
      {isMobile && mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        className={cn(
          "flex h-screen shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground",
          "fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:transition-[width]",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          showCollapsed ? "md:w-[72px]" : "md:w-64"
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-border py-4",
            showCollapsed ? "justify-center px-2" : "gap-3 px-5"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scale className="h-5 w-5" />
          </div>
          <div
            className={cn(
              "min-w-0 flex-1 overflow-hidden transition-all duration-300",
              showCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}
          >
            <p className="whitespace-nowrap text-sm font-semibold leading-tight tracking-tight">
              ClauseIQ
            </p>
            <p className="mt-0.5 whitespace-nowrap text-[11px] leading-tight text-muted-foreground">
              Legal AI Portal
            </p>
          </div>
          {isMobile && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              onClick={closeMobileSidebar}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <nav className={cn("flex-1 space-y-0.5 p-3", showCollapsed && "px-2")}>
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                title={showCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-lg py-2 text-sm transition-colors",
                  showCollapsed ? "justify-center px-0" : "gap-3 px-3",
                  active
                    ? "bg-primary font-medium text-primary-foreground"
                    : "font-normal text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap transition-all duration-300",
                    showCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        <div className={cn("p-3", showCollapsed && "px-2")}>
          {!showCollapsed && user && (
            <div className="mb-3 rounded-xl border border-border/60 bg-background/40 p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-primary/30">
                  <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight">
                    {user.name}
                  </p>
                  <p className="truncate text-[11px] leading-tight text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Separator className="mb-3" />
          <Button
            variant="ghost"
            size="sm"
            title={showCollapsed ? "Logout" : undefined}
            className={cn(
              "w-full text-sm font-normal text-muted-foreground hover:text-destructive",
              showCollapsed ? "justify-center px-0" : "justify-start gap-3"
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap transition-all duration-300",
                showCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              )}
            >
              Logout
            </span>
          </Button>
        </div>
      </aside>
    </>
  )
}
