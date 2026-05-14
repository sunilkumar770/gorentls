'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Typography, H1, Body } from '@/components/ui/Typography'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { Logo } from '@/components/ui/Logo'
import { buildProfile, signIn } from '@/services/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // --- Client-side validation (US-004) ---
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setIsLoading(true)
    try {
      const { data, error: signInError } = await signIn(email, password)
      
      if (signInError || !data) {
        setError(signInError ?? 'Invalid email or password')
        return
      }
      
      const profile = buildProfile(data);
      login(data.accessToken, profile);
      
      const redirect = params.get('redirect') ?? (profile.role === 'OWNER' ? '/owner' : '/dashboard')
      router.push(redirect)
      router.refresh()
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-subtle px-4">
      <div className="w-full max-sm:max-w-xs max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <Card padding="lg" className="shadow-xl">
          <div className="mb-8">
            <H1 className="text-2xl">Welcome back</H1>
            <Body subtle className="mt-1">Sign in to your premium gear hub</Body>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-secondary">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-brand-600 hover:underline font-semibold"
                >
                  Forgot?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            {/* Error state */}
            {error && (
              <Alert variant="error" className="py-2.5">
                {error}
              </Alert>
            )}

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

          <div className="mt-8 pt-4 border-t border-border-subtle text-center">
            <p className="text-xs text-text-tertiary font-medium">
              🔒 Secure, encrypted session
            </p>
          </div>
        </Card>

        <p className="mt-6 text-center text-sm text-text-secondary">
          New to GoRentals?{' '}
          <Link href="/signup" className="font-bold text-brand-600 hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  )
}

