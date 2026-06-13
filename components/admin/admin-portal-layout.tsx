"use client"

import { Loader2 } from "lucide-react"
import { useRequireAdmin } from "@/contexts/auth-provider"
import { PortalLayout } from "@/components/layout/portal-layout"

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useRequireAdmin()

  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}

export function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout>
      <AdminRouteGuard>{children}</AdminRouteGuard>
    </PortalLayout>
  )
}
