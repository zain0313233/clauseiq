"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Mail, Lock, User, Eye, EyeOff, Check, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-provider"
import {
  getPasswordRequirements,
  passwordsMatch,
} from "@/lib/password-validation"
import { signupSchema } from "@/validators/auth.schema"
import { ACCEPTABLE_USE_LABEL } from "@/lib/access-policy"

export function SignupForm() {
  const router = useRouter()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const requirements = getPasswordRequirements(password)
  const allRequirementsMet = requirements.every((r) => r.met)
  const passwordsAreMatching =
    confirmPassword.length > 0 && passwordsMatch(password, confirmPassword)

  function validateForm(): string | null {
    const parsed = signupSchema.safeParse({ name, email, password, acceptedTerms })
    if (!parsed.success) {
      return parsed.error.issues[0]?.message ?? "Invalid form data"
    }
    if (!passwordsMatch(password, confirmPassword)) {
      return "Passwords do not match"
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, acceptedTerms: true }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Signup failed")

      login(data.user)

      if (data.user.emailVerified) {
        toast.success("Account created successfully!")
        router.replace("/dashboard")
        return
      }

      toast.success("Account created! Check your email for a verification code.")
      router.replace("/verify-email")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col">
      <div className="mb-8 space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Create your account
        </h2>
        <p className="text-sm text-muted-foreground">
          Start analyzing legal documents with AI in minutes
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Full name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              className="h-11 rounded-lg border-border bg-background pl-10 focus-visible:border-primary focus-visible:ring-primary/30"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              className="h-11 rounded-lg border-border bg-background pl-10 focus-visible:border-primary focus-visible:ring-primary/30"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              className="h-11 rounded-lg border-border bg-background pl-10 pr-10 focus-visible:border-primary focus-visible:ring-primary/30"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {password.length > 0 && (
            <ul className="grid grid-cols-2 gap-1.5 pt-1">
              {requirements.map((req) => (
                <li
                  key={req.id}
                  className={`flex items-center gap-1.5 text-xs ${
                    req.met ? "text-emerald-600" : "text-muted-foreground"
                  }`}
                >
                  {req.met ? (
                    <Check className="h-3 w-3 shrink-0" />
                  ) : (
                    <X className="h-3 w-3 shrink-0" />
                  )}
                  {req.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              className="h-11 rounded-lg border-border bg-background pl-10 pr-10 focus-visible:border-primary focus-visible:ring-primary/30"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={
                showConfirmPassword ? "Hide confirm password" : "Show confirm password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {confirmPassword.length > 0 && !passwordsAreMatching && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/10 p-3 text-xs leading-relaxed text-muted-foreground">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border"
          />
          <span>{ACCEPTABLE_USE_LABEL}</span>
        </label>

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full text-sm font-semibold"
          disabled={
            loading ||
            !allRequirementsMet ||
            !passwordsAreMatching ||
            confirmPassword.length === 0 ||
            !acceptedTerms
          }
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
