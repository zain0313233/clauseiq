import {
  Upload,
  Brain,
  MessageSquare,
  Shield,
  Zap,
  BarChart3,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Upload,
    title: "Smart Upload",
    description:
      "Drag & drop PDF or DOCX contracts. Automatic parsing, chunking, and indexing.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Brain,
    title: "AI Understanding",
    description:
      "Advanced RAG pipeline extracts meaning from complex legal language.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: MessageSquare,
    title: "Natural Q&A",
    description:
      "Ask questions in plain English. Get precise answers with source references.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "JWT auth, role-based access, and encrypted storage for your documents.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: Zap,
    title: "Fast Processing",
    description:
      "Documents indexed in seconds. Vector search delivers instant relevant context.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track uploads, queries, and document types with beautiful visual insights.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
]

export function Features() {
  return (
    <section id="features" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Everything you need to analyze contracts
          </h2>
          <p className="mt-3 text-muted-foreground">
            Built for legal teams, founders, and anyone who reads contracts
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card
                key={feature.title}
                className="border-border/50 transition-shadow hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${feature.bg}`}
                  >
                    <Icon className={`h-5 w-5 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
