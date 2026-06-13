"use client"

import { Menu, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-provider"
import { useSidebar } from "./sidebar-context"
import { NotificationBell } from "./notification-bell"

export function PortalHeader() {
  const { user } = useAuth()
  const { toggleSidebar } = useSidebar()
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 md:gap-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3 md:gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="relative hidden w-full max-w-md md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="h-9 bg-muted/50 pl-9 text-sm placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-4">
        <NotificationBell />

        <Avatar className="h-9 w-9 border-2 border-emerald-500/40">
          <AvatarFallback className="bg-emerald-500/20 text-sm font-semibold text-emerald-400">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
