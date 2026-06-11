import { z } from "zod"

const hex = z.string().regex(/^#([0-9A-Fa-f]{6})$/, "Must be a valid hex color (#RRGGBB)")

export const themeSchema = z.object({
  primaryColor: hex,
  primaryForegroundColor: hex,
  textColor: hex,
  textColorDark: hex,
  mutedTextColor: hex,
  mutedTextColorDark: hex,
})

export type ThemeInput = z.infer<typeof themeSchema>
