"use client"

import { User, Mail, Shield, Bell, Settings2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-provider"
import { ThemeCustomizer } from "./theme-customizer"

export function SettingsPanel() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1.5 text-sm leading-normal text-muted-foreground">
          Manage your account, preferences, and site-wide theme
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ThemeCustomizer />

          <Card className="border-border/60 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <User className="h-4 w-4 text-primary" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-medium">
                  Full name
                </Label>
                <Input
                  id="name"
                  defaultValue={user?.name || ""}
                  className="h-10 bg-background/60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    className="h-10 bg-background/60 pl-10"
                    defaultValue={user?.email || ""}
                    disabled
                  />
                </div>
              </div>
              <Button size="sm">Save changes</Button>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Shield className="h-4 w-4 text-primary" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-xs font-medium">
                  Current password
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  className="h-10 bg-background/60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-xs font-medium">
                  New password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  className="h-10 bg-background/60"
                />
              </div>
              <Button size="sm" variant="outline">
                Update password
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border/60 bg-card/40">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Account
                </h3>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-primary">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {user?.name || "User"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Bell className="h-4 w-4 text-primary" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Email when document processing completes",
                "Weekly activity summary",
                "Risky clause alerts",
              ].map((item) => (
                <label
                  key={item}
                  className="flex cursor-pointer items-center justify-between gap-3"
                >
                  <span className="text-xs leading-relaxed text-foreground">
                    {item}
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="accent-primary h-4 w-4 rounded"
                  />
                </label>
              ))}
              <Separator />
              <Button size="sm" variant="outline" className="w-full">
                Save preferences
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
