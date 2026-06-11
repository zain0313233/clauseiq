"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { RefreshCw, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCards } from "@/components/dashboard/stat-cards"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines"
import { PortfolioSearch } from "@/components/dashboard/portfolio-search"
import { authHeaders } from "@/lib/auth-client"

type Document = {
  id: string
  title: string
  status: string
  fileType: string
  createdAt: string
  analysis?: { riskScore: number | null; riskLevel: string | null; status: string } | null
}

type Stats = {
  total: number
  ready: number
  queries: number
  risky: number
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, ready: 0, queries: 0, risky: 0 })
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    setLoading(true)
    try {
      const [docsRes, statsRes] = await Promise.all([
        fetch("/api/documents", { headers: authHeaders() }),
        fetch("/api/dashboard/stats", { headers: authHeaders() }),
      ])

      const docsData = await docsRes.json()
      const statsData = await statsRes.json()

      if (docsRes.ok) setDocuments(docsData.documents || [])
      if (statsRes.ok) setStats(statsData.stats)
    } catch {
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight">
              Welcome to ClauseIQ
            </h1>
            <p className="mt-1.5 text-sm leading-normal text-white/75">
              ClauseMind analyzes your contracts — risks, summaries, and Q&amp;A
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="w-fit bg-white/15 text-sm font-medium text-white hover:bg-white/25"
            onClick={fetchData}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
        </CardContent>
      </Card>

      <StatCards stats={stats} />
      <PortfolioSearch />
      <UpcomingDeadlines />
      <DashboardCharts />
      <QuickActions />

      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold leading-tight tracking-tight">
              Recent Documents
            </h2>
            <Link
              href="/dashboard/documents"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading documents...
            </p>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No documents yet. Upload your first contract to get started.
              </p>
              <Link
                href="/dashboard/upload"
                className="mt-4 text-sm font-medium text-primary hover:underline"
              >
                Upload document →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.slice(0, 5).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.fileType.includes("pdf") ? "PDF" : "DOCX"}
                        {doc.analysis?.status === "ready" && doc.analysis.riskScore != null && (
                          <> · Risk score {doc.analysis.riskScore}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        doc.status === "ready"
                          ? "border-emerald-500/30 text-emerald-400"
                          : "border-amber-500/30 text-amber-400"
                      }
                    >
                      {doc.status}
                    </Badge>
                    {doc.status === "ready" && (
                      <>
                        <Link
                          href={`/dashboard/documents/${doc.id}`}
                          className="rounded-md border border-border px-3 py-1 text-xs transition-colors hover:border-primary hover:text-primary"
                        >
                          Report
                        </Link>
                        <Link
                          href={`/chat/${doc.id}`}
                          className="rounded-md border border-border px-3 py-1 text-xs transition-colors hover:border-primary hover:text-primary"
                        >
                          Ask AI
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
