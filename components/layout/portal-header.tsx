"use client"

import { Bell, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-provider"

export function PortalHeader() {
  const { user } = useAuth()
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          className="h-9 bg-muted/50 pl-9 text-sm placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-[18px] w-[18px]" />
          <Badge className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center p-0 text-[10px] font-medium">
            3
          </Badge>
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-tight tracking-tight">
              {user?.name || "User"}
            </p>
            <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
              {user?.email}
            </p>
          </div>
          <Avatar className="h-9 w-9 border-2 border-emerald-500/40">
            <AvatarFallback className="bg-emerald-500/20 text-sm font-semibold text-emerald-400">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
