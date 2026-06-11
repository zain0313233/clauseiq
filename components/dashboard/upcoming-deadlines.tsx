"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, Clock, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { authHeaders } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import type { TimelineEvent } from "@/types/analysis"

const typeStyles: Record<string, string> = {
  expiration: "border-red-500/30 text-red-400",
  deadline: "border-amber-500/30 text-amber-400",
  renewal: "border-blue-500/30 text-blue-400",
  notice: "border-purple-500/30 text-purple-400",
  payment: "border-emerald-500/30 text-emerald-400",
  effective: "border-slate-500/30 text-slate-400",
  other: "border-border text-muted-foreground",
}

export function UpcomingDeadlines() {
  const [deadlines, setDeadlines] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard/deadlines", {
          headers: authHeaders(),
        })
        const data = await res.json()
        if (res.ok) setDeadlines(data.deadlines || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="gap-1 pb-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h3 className="text-lg font-semibold leading-tight tracking-tight">
            Upcoming dates
          </h3>
        </div>
        <p className="text-xs leading-tight text-muted-foreground">
          Key deadlines extracted from your contracts
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : deadlines.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Clock className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No timeline events yet. Re-analyze documents to extract dates.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {deadlines.map((item, i) => (
              <div
                key={`${item.documentId}-${item.label}-${i}`}
                className="flex items-start justify-between gap-3 rounded-lg border border-border/40 bg-background/30 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{item.label}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] capitalize",
                        typeStyles[item.type] ?? typeStyles.other
                      )}
                    >
                      {item.type}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.date}
                    {item.party ? ` · ${item.party}` : ""}
                  </p>
                  {item.description && (
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                  {item.documentTitle && item.documentId && (
                    <Link
                      href={`/dashboard/documents/${item.documentId}`}
                      className="mt-1.5 inline-block text-[11px] font-medium text-primary hover:underline"
                    >
                      {item.documentTitle}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
