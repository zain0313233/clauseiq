"use client"

import { AuthProvider } from "@/contexts/auth-provider"
import { ThemeProvider } from "@/contexts/theme-provider"
import type { SiteThemeConfig } from "@/lib/theme"

export function AppProviders({
  children,
  initialTheme,
}: {
  children: React.ReactNode
  initialTheme: SiteThemeConfig
}) {
  return (
    <ThemeProvider initialTheme={initialTheme}>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  )
}
