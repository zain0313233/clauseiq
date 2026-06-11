"use client"

import { AuthProvider } from "@/contexts/auth-provider"
import { ThemeProvider } from "@/contexts/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import type { SiteThemeConfig } from "@/lib/theme"

export function AppProviders({
  children,
  initialTheme,
}: {
  children: React.ReactNode
  initialTheme: SiteThemeConfig
}) {
  return (
    <QueryProvider>
      <ThemeProvider initialTheme={initialTheme}>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}
