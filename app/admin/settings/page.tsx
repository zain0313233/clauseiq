"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ThemeCustomizer } from "@/components/settings/theme-customizer"
import { AdminAccessSettingsCard } from "@/components/admin/admin-access-settings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"
import { getPasswordRequirements } from "@/lib/password-validation"
import { useAuth } from "@/contexts/auth-provider"
import { cn } from "@/lib/utils"

export default function AdminSettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)

  const requirements = getPasswordRequirements(newPassword)
  const allMet = requirements.every((r) => r.met)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!allMet) {
      toast.error("Please meet all password requirements")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Failed to update password")
      toast.success("Password updated — please sign in again")
      await logout()
      router.push("/login")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Site-wide theme and your admin account security
        </p>
      </div>

      <ThemeCustomizer />

      <AdminAccessSettingsCard />

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4 text-primary" />
            Change password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="max-w-md space-y-4" onSubmit={(e) => void handleChangePassword(e)}>
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {requirements.map((r) => (
                <li
                  key={r.id}
                  className={cn(r.met && "text-emerald-400")}
                >
                  {r.met ? "✓" : "○"} {r.label}
                </li>
              ))}
            </ul>
            <Button type="submit" size="sm" disabled={saving || !allMet}>
              {saving ? "Updating…" : "Update password"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Or use{" "}
              <Link href="/forgot-password" className="text-primary hover:underline">
                forgot password
              </Link>{" "}
              if you are signed out.
            </p>
          </form>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Signed in as {user?.email} ({user?.role})
      </p>
    </div>
  )
}
