"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import {
  DEFAULT_THEME,
  applyThemeToDocument,
  type SiteThemeConfig,
} from "@/lib/theme"

type ThemeContextValue = {
  theme: SiteThemeConfig
  isLoading: boolean
  isSaving: boolean
  setThemeLocal: (theme: SiteThemeConfig) => void
  saveTheme: (theme: SiteThemeConfig) => Promise<void>
  resetTheme: () => Promise<void>
  refreshTheme: () => Promise<void>
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode
  initialTheme?: SiteThemeConfig
}) {
  const [theme, setTheme] = useState<SiteThemeConfig>(initialTheme ?? DEFAULT_THEME)
  const [isLoading, setIsLoading] = useState(!initialTheme)
  const [isSaving, setIsSaving] = useState(false)

  const apply = useCallback((t: SiteThemeConfig) => {
    setTheme(t)
    applyThemeToDocument(t)
  }, [])

  const refreshTheme = useCallback(async () => {
    try {
      const res = await fetch("/api/theme")
      const data = await res.json()
      if (res.ok && data.theme) apply(data.theme)
    } finally {
      setIsLoading(false)
    }
  }, [apply])

  useEffect(() => {
    if (initialTheme) apply(initialTheme)
    else refreshTheme()
  }, [initialTheme, apply, refreshTheme])

  const setThemeLocal = useCallback(
    (t: SiteThemeConfig) => {
      apply(t)
    },
    [apply]
  )

  const saveTheme = useCallback(
    async (t: SiteThemeConfig) => {
      setIsSaving(true)
      try {
        const res = await fetch("/api/theme", {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(t),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to save theme")
        apply(data.theme)
      } finally {
        setIsSaving(false)
      }
    },
    [apply]
  )

  const resetTheme = useCallback(async () => {
    await saveTheme(DEFAULT_THEME)
  }, [saveTheme])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isLoading,
        isSaving,
        setThemeLocal,
        saveTheme,
        resetTheme,
        refreshTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
