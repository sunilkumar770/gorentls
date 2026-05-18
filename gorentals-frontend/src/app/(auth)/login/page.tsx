"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { LogIn, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Alert } from "@/components/ui/Alert"
import { signIn, buildProfile } from "@/services/auth"

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { login, user } = useAuth()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // If already logged in, redirect away from login page
  useEffect(() => {
    if (user) {
      const redirect = params.get('from') || '/dashboard'
      router.replace(redirect)
    }
  }, [user, router, params])

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault()
    console.log('[LoginPage] handleSubmit started');
    setError("")
    setIsLoading(true)

    try {
      console.log('[LoginPage] Calling signIn with:', email);
      const { data, error: apiError } = await signIn(email, password)
      
      if (apiError) {
        console.warn('[LoginPage] signIn error:', apiError);
        setError(apiError)
        return
      }

      if (data) {
        console.log('[LoginPage] Login successful, building profile...');
        const profile = buildProfile(data);
        login(data.accessToken, profile);
        
        const redirectPath = params.get('from') || (profile.role === 'OWNER' ? '/owner' : '/dashboard')
        console.log('[LoginPage] Redirecting to:', redirectPath);
        router.push(redirectPath)
      }
    } catch (err: any) {
      console.error('[LoginPage] Unexpected error:', err);
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-surface-base">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-surface-elevated p-8 rounded-3xl shadow-xl border border-border-subtle relative overflow-hidden">
          {/* Header */}
          <div className="relative z-10 mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 mb-4">
              <LogIn size={32} />
            </div>
            <h1 className="text-3xl font-bold text-text-primary">Welcome Back</h1>
            <p className="text-text-secondary mt-2">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {error && (
              <Alert variant="error" className="rounded-2xl">
                {error}
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary ml-1">Email Address</label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                leftIcon={<Mail size={18} />}
                className="h-12 rounded-xl border-border-default focus:border-brand-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-text-secondary">Password</label>
                <Link 
                  href="/forgot-password" 
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                leftIcon={<Lock size={18} />}
                className="h-12 rounded-xl border-border-default focus:border-brand-500"
              />
            </div>

            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              size="lg"
              className="h-14 rounded-2xl shadow-lg shadow-brand-500/20"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-8 pt-4 border-t border-border-subtle text-center relative z-10">
            <p className="text-sm text-text-secondary">
              Don't have an account?{" "}
              <Link 
                href="/signup" 
                className="font-semibold text-brand-600 hover:text-brand-700 transition-colors inline-flex items-center gap-1"
              >
                Create one now <ArrowRight size={14} />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
