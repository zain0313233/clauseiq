"use client"

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { BarChart3, Loader2, PieChart as PieChartIcon } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useChartsQuery } from "@/hooks/use-charts-query"

export function DashboardCharts() {
  const { data, isLoading } = useChartsQuery()

  const weeklyData = data?.weeklyActivity ?? []
  const distributionData = data?.typeDistribution ?? []

  if (isLoading) {
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

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="gap-1 pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="text-lg font-semibold leading-tight tracking-tight">
              Weekly Activity
            </h3>
          </div>
          <p className="text-xs leading-tight text-muted-foreground">
            Uploads & queries — last 7 days
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} barGap={4}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "inherit" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "inherit" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                  fontSize: "12px",
                  fontFamily: "inherit",
                }}
              />
              <Bar
                dataKey="uploads"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                name="Uploads"
              />
              <Bar
                dataKey="queries"
                fill="#14b8a6"
                radius={[4, 4, 0, 0]}
                name="Queries"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50">
        <CardHeader className="gap-1 pb-2">
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-primary" />
            <h3 className="text-lg font-semibold leading-tight tracking-tight">
              Document Types
            </h3>
          </div>
          <p className="text-xs leading-tight text-muted-foreground">
            Breakdown by contract category
          </p>
        </CardHeader>
        <CardContent>
          {distributionData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No typed contracts yet. Re-analyze documents to classify types.
            </p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {distributionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                      fontSize: "12px",
                      fontFamily: "inherit",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex-1 space-y-2.5">
                {distributionData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: item.color }}
                    />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                    <span className="ml-auto text-xs font-medium">
                      {item.count} ({item.value}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
