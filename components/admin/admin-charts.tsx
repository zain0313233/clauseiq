"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { fetchJson } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"

export type AdminChartsData = {
  weeklyActivity: Array<{
    day: string
    signups: number
    uploads: number
    queries: number
  }>
  documentStatus: Array<{ name: string; value: number; color: string }>
  riskDistribution: Array<{ name: string; value: number; color: string }>
}

const AdminChartsInner = dynamic(
  () =>
    import("./admin-charts-inner").then((m) => ({
      default: m.AdminChartsInner,
    })),
  { ssr: false, loading: () => <ChartsSkeleton /> }
)

function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="border-border/50 bg-card/50">
          <CardContent className="flex justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function AdminDashboardCharts() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "charts"],
    queryFn: () =>
      fetchJson<{ charts: AdminChartsData }>("/api/platform/charts").then(
        (r) => r.charts
      ),
  })

  if (isLoading || !data) return <ChartsSkeleton />

  return <AdminChartsInner data={data} />
}
