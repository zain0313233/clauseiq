import { Upload, Cpu, MessageCircle } from "lucide-react"

const steps = [
  {
    step: "01",
    icon: Upload,
    title: "Upload your contract",
    description: "Drop a PDF or DOCX file. We store it securely and start processing.",
  },
  {
    step: "02",
    icon: Cpu,
    title: "AI indexes every clause",
    description:
      "Our engine parses, chunks, and embeds your document for semantic search.",
  },
  {
    step: "03",
    icon: MessageCircle,
    title: "Ask anything",
    description:
      "Chat with your document. Get answers grounded in the actual contract text.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-muted/30 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">How it works</h2>
          <p className="mt-3 text-muted-foreground">
            From upload to insight in three simple steps
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                  <Icon className="h-7 w-7" />
                </div>
                <span className="text-xs font-bold text-primary">
                  STEP {item.step}
                </span>
                <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
