"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Mail, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-provider"

export function VerifyEmailForm() {
  const router = useRouter()
  const { user, login } = useAuth()
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/verify-email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Verification failed")

      if (data.user) login(data.user)
      toast.success("Email verified!")
      router.replace("/dashboard")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    try {
      const res = await fetch("/api/auth/verify-email/send", {
        method: "POST",
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not send code")
      toast.success(data.message || "Code sent")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send code")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col">
      <div className="mb-8 space-y-2">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Verify your email
        </h2>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">{user?.email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="code" className="text-sm font-medium">
            Verification code
          </Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              className="h-11 rounded-lg border-border bg-background pl-10 text-center tracking-[0.4em] focus-visible:border-primary focus-visible:ring-primary/30"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full text-sm font-semibold"
          disabled={loading || code.length !== 6}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify email"
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="h-11 w-full text-sm"
          disabled={resending}
          onClick={handleResend}
        >
          {resending ? "Sending..." : "Resend code"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Wrong account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
