import { FileText, CheckCircle2, MessageSquare, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Stats = {
  total: number
  ready: number
  queries: number
  risky: number
}

export function StatCards({ stats }: { stats: Stats }) {
  const cards = [
    {
      label: "Total Documents",
      sub: "Uploaded contracts",
      value: stats.total,
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      badge: null,
    },
    {
      label: "Ready to Query",
      sub: "Processed & indexed",
      value: stats.ready,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      badge: "Active",
      badgeColor: "text-emerald-400 border-emerald-500/30",
    },
    {
      label: "Queries Made",
      sub: "AI questions asked",
      value: stats.queries,
      icon: MessageSquare,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      badge: null,
    },
    {
      label: "Risky Clauses",
      sub: "Flagged for review",
      value: stats.risky,
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      badge: "Review",
      badgeColor: "text-amber-400 border-amber-500/30",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card
            key={card.label}
            className="border-border/50 bg-card/50 transition-colors hover:bg-card/80"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}
                >
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                {card.badge && (
                  <Badge
                    variant="outline"
                    className={`px-2 py-0.5 text-[11px] font-medium ${card.badgeColor}`}
                  >
                    {card.badge}
                  </Badge>
                )}
              </div>
              <p className="mt-4 text-4xl font-bold leading-none tracking-tight">
                {card.value}
              </p>
              <p className="mt-2 text-sm font-medium leading-tight">
                {card.label}
              </p>
              <p className="mt-0.5 text-xs leading-tight text-muted-foreground">
                {card.sub}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
