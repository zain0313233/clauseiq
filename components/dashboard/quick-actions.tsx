import Link from "next/link"
import { Upload, FileText, MessageSquare, Settings } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const actions = [
  {
    title: "Upload Document",
    description: "Upload contracts & legal files",
    href: "/dashboard/upload",
    icon: Upload,
    gradient: "from-blue-600 to-blue-500",
  },
  {
    title: "View Documents",
    description: "Manage your contract library",
    href: "/dashboard/documents",
    icon: FileText,
    gradient: "from-purple-600 to-purple-500",
  },
  {
    title: "Ask AI",
    description: "Chat about your documents",
    href: "/chat",
    icon: MessageSquare,
    gradient: "from-emerald-600 to-emerald-500",
  },
  {
    title: "Settings",
    description: "Account & preferences",
    href: "/dashboard/settings",
    icon: Settings,
    gradient: "from-amber-600 to-amber-500",
  },
]

export function QuickActions() {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold leading-tight tracking-tight">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.href} href={action.href}>
              <Card
                className={`group cursor-pointer border-0 bg-gradient-to-br ${action.gradient} text-white transition-transform hover:scale-[1.02] hover:shadow-lg`}
              >
                <CardContent className="p-5">
                  <Icon className="mb-3 h-7 w-7 opacity-90" />
                  <p className="text-base font-semibold leading-tight">
                    {action.title}
                  </p>
                  <p className="mt-1 text-xs leading-tight text-white/75">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
