'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Typography, H1, Body } from '@/components/ui/Typography'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'
import { buildProfile, signUp } from '@/services/auth'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    userType: 'RENTER' as 'RENTER' | 'OWNER'
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { data, error: apiError } = await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phone,
        formData.userType
      )

      if (apiError) {
        setError(apiError)
        return
      }

      if (data) {
        const profile = buildProfile(data);
        login(data.accessToken, profile);
        router.push(formData.userType === 'OWNER' ? '/owner' : '/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      console.error('[SignupPage] Error:', err);
      const backendError = err.response?.data;
      if (backendError?.errors) {
        // Concatenate field errors
        const messages = Object.values(backendError.errors).join('. ');
        setError(messages || backendError.message || 'Validation failed');
      } else {
        setError(backendError?.message || err.message || 'Connection error. Please try again.');
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-subtle px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <Card padding="lg" className="shadow-xl">
          <div className="mb-8">
            <H1 className="text-2xl">Create your account</H1>
            <Body subtle className="mt-1">Join Hyderabad's most trusted rental community</Body>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Toggle */}
            <div className="flex p-1 bg-surface-subtle rounded-2xl mb-6 border border-border-subtle">
              {(['RENTER', 'OWNER'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setFormData({ ...formData, userType: role })}
                  className={cn(
                    'flex-1 py-2 text-xs font-bold rounded-xl transition-all',
                    formData.userType === role 
                      ? 'bg-surface-base text-brand-600 shadow-sm' 
                      : 'text-text-tertiary hover:text-text-primary'
                  )}
                >
                  {role === 'RENTER' ? 'I want to Rent' : 'I want to List'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Full Name"
                required
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="John Doe"
              />

              <Input
                label="Email"
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />

              <Input
                label="Phone"
                type="tel"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />

              <Input
                label="Password"
                type="password"
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                minLength={8}
                hint="Min 8 chars, 1 uppercase, 1 number, 1 special char (!@#$%^&*)"
              />
            </div>

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
              className="h-14 rounded-2xl shadow-lg shadow-brand-500/20 mt-4"
            >
              Get Started
            </Button>
          </form>

          <p className="mt-8 text-center text-[10px] text-text-tertiary font-medium leading-relaxed">
            By joining, you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </Card>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
