"use client"

import { useQuery } from "@tanstack/react-query"
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { fetchJson } from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SystemHealth = {
  status: string
  checks: Record<string, string>
  appUrl: string | null
  engineUrl: string
}

function StatusIcon({ status }: { status: string }) {
  if (status === "ok")
    return <CheckCircle2 className="h-5 w-5 text-emerald-400" />
  if (status === "missing")
    return <AlertCircle className="h-5 w-5 text-amber-400" />
  return <XCircle className="h-5 w-5 text-destructive" />
}

export default function AdminSystemPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "system"],
    queryFn: () => fetchJson<SystemHealth>("/api/platform/system"),
    refetchInterval: 60_000,
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <p className="text-destructive">
        {error instanceof Error ? error.message : "Failed to load system status"}
      </p>
    )
  }

  const checkLabels: Record<string, string> = {
    web: "Next.js application",
    database: "PostgreSQL (Neon)",
    engine: "AI engine (FastAPI)",
    smtp: "Email (SMTP)",
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">System health</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Service status for production monitoring
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Refresh
        </Button>
      </div>

      <Card
        className={cn(
          "border-border/60",
          data.status === "healthy" ? "bg-emerald-500/5" : "bg-amber-500/5"
        )}
      >
        <CardContent className="flex items-center gap-3 p-5">
          <StatusIcon status={data.status === "healthy" ? "ok" : "error"} />
          <div>
            <p className="font-semibold capitalize">{data.status}</p>
            <p className="text-xs text-muted-foreground">
              Overall platform status
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {Object.entries(data.checks).map(([key, value]) => (
          <Card key={key} className="border-border/60">
            <CardContent className="flex items-center gap-3 p-5">
              <StatusIcon status={value} />
              <div>
                <p className="text-sm font-medium">
                  {checkLabels[key] ?? key}
                </p>
                <p className="text-xs capitalize text-muted-foreground">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">App URL: </span>
            {data.appUrl ?? "Not set"}
          </p>
          <p>
            <span className="text-muted-foreground">Engine URL: </span>
            {data.engineUrl}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
