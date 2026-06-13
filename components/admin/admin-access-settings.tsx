"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Shield } from "lucide-react"
import { toast } from "sonner"
import { fetchJson } from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type AccessSettings = {
  maxConsecutiveIrrelevant: number
  strikeWarningAt: number
  appealSlaBusinessDays: number
}

export function AdminAccessSettingsCard() {
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "access-settings"],
    queryFn: () =>
      fetchJson<{ settings: AccessSettings }>("/api/platform/settings/access"),
  })

  const [form, setForm] = useState<AccessSettings | null>(null)
  const settings = form ?? data?.settings

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch("/api/platform/settings/access", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Save failed")
      toast.success("Access control settings updated")
      setForm(null)
      void queryClient.invalidateQueries({ queryKey: ["admin", "access-settings"] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !settings) {
    return (
      <Card className="border-border/60">
        <CardContent className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Shield className="h-4 w-4 text-primary" />
          Access control & abuse policy
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid max-w-md gap-4" onSubmit={(e) => void handleSave(e)}>
          <div className="space-y-2">
            <Label htmlFor="max-strikes">Max consecutive off-topic messages</Label>
            <Input
              id="max-strikes"
              type="number"
              min={3}
              max={20}
              value={settings.maxConsecutiveIrrelevant}
              onChange={(e) =>
                setForm({
                  ...settings,
                  maxConsecutiveIrrelevant: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="warn-at">Show warning after strike count</Label>
            <Input
              id="warn-at"
              type="number"
              min={1}
              max={19}
              value={settings.strikeWarningAt}
              onChange={(e) =>
                setForm({
                  ...settings,
                  strikeWarningAt: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sla-days">Appeal SLA (business days)</Label>
            <Input
              id="sla-days"
              type="number"
              min={1}
              max={14}
              value={settings.appealSlaBusinessDays}
              onChange={(e) =>
                setForm({
                  ...settings,
                  appealSlaBusinessDays: Number(e.target.value),
                })
              }
            />
          </div>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Saving…" : "Save access settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
