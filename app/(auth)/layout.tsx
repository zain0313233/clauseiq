import { Scale } from "lucide-react"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dark min-h-screen bg-background">
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 bottom-20 h-80 w-80 rounded-full bg-chart-2/10 blur-3xl" />

        <Link
          href="/"
          className="relative z-10 mb-8 flex items-center gap-2 text-lg font-bold"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scale className="h-5 w-5" />
          </div>
          ClauseIQ
        </Link>

        <div className="relative z-10 w-full max-w-md">{children}</div>

        <p className="relative z-10 mt-8 text-center text-xs text-muted-foreground">
          AI-powered legal document analysis · Secure & private
        </p>
      </div>
    </div>
  )
}
