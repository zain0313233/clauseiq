"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useChartsQuery } from "@/hooks/use-charts-query"

const DashboardChartsInner = dynamic(
  () =>
    import("./dashboard-charts-inner").then((m) => ({
      default: m.DashboardChartsInner,
    })),
  {
    ssr: false,
    loading: () => <ChartsLoadingSkeleton />,
  }
)

function ChartsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {[0, 1].map((i) => (
        <Card key={i} className="border-border/50 bg-card/50">
          <CardContent className="flex justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function DashboardCharts() {
  const { data, isLoading } = useChartsQuery()

  if (isLoading || !data) {
    return <ChartsLoadingSkeleton />
  }

  return <DashboardChartsInner data={data} />
}
