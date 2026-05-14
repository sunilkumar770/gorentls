'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/services/auth'
import { Typography } from '@/components/ui/Typography'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import KYCModal from '@/components/profile/KYCModal'
import { toast } from 'react-hot-toast'
import type { Profile } from '@/types'

import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { user, updateUser, isLoading: authLoading } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isKYCOpen, setIsKYCOpen] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/dashboard/profile')
    }
  }, [authLoading, user, router])

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    dateOfBirth: '',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const data = await authService.getProfile()
      setProfile(data)
      setFormData({
        fullName: data.fullName || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        dateOfBirth: data.dateOfBirth || '',
      })
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      toast.error('Failed to load profile data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSaving(true)
      const data = await authService.updateProfile(formData)
      setProfile(data)
      
      if (user) {
        updateUser(data);
      }
      
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Update failed:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-indigo-600" />
        <p className="text-xl font-medium text-center text-slate-600">Loading your profile...</p>
      </div>
    )
  }

  if (!user) {
    return null // Redirects via useEffect
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Typography variant="h2" className="text-foreground">Account Settings</Typography>
          <Typography variant="body-sm" className="text-muted-foreground">Manage your profile information and account preferences</Typography>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={profile?.kycStatus || 'NOT_SUBMITTED'} />
          {profile?.kycStatus !== 'APPROVED' && (
            <Button variant="outline" size="sm" onClick={() => setIsKYCOpen(true)}>
              {profile?.kycStatus === 'REJECTED' ? 'Retry KYC' : 'Complete KYC'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="space-y-6">
          <Card className="p-6 text-center space-y-4">
            <div className="relative inline-block">
              <Avatar 
                name={profile?.fullName || 'User'} 
                size="xl" 
                src={profile?.profilePicture}
                className="w-24 h-24 text-2xl mx-auto border-4 border-background shadow-md"
              />
              <button className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors">
                📷
              </button>
            </div>
            <div>
              <Typography variant="h4" className="text-foreground">{profile?.fullName}</Typography>
              <Typography variant="body-sm" className="text-muted-foreground">{profile?.email}</Typography>
            </div>
            <div className="pt-4 border-t border-border">
              <div className="flex justify-between text-sm py-1">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium text-foreground capitalize">{(profile?.userType || 'RENTER').toLowerCase()}</span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-muted-foreground">Member since</span>
                <span className="font-medium text-foreground">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <Typography variant="h4" className="text-foreground">Account Status</Typography>
            <div className="space-y-3">
              <StatusItem label="Email Verified" status={true} />
              <StatusItem label="Phone Verified" status={!!profile?.phone} />
              <StatusItem label="Identity Verified" status={profile?.kycStatus === 'APPROVED'} />
            </div>
          </Card>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80">Full Name</label>
                  <Input 
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80">Phone Number</label>
                  <Input 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-foreground/80">Address</label>
                  <Input 
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Street Name, Area"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80">City</label>
                  <Input 
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Mumbai"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80">State</label>
                  <Input 
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="e.g. Maharashtra"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80">Pincode</label>
                  <Input 
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="400001"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80">Date of Birth</label>
                  <Input 
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-border flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90 text-white px-8 h-11"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      <KYCModal 
        isOpen={isKYCOpen} 
        onClose={() => setIsKYCOpen(false)} 
        onSuccess={fetchProfile}
      />
    </div>
  )
}

function Badge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    NOT_SUBMITTED: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
  }

  const labels: Record<string, string> = {
    APPROVED: 'Verified',
    PENDING: 'Verification Pending',
    REJECTED: 'Verification Failed',
    NOT_SUBMITTED: 'Unverified',
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status] || styles.NOT_SUBMITTED}`}>
      {labels[status] || labels.NOT_SUBMITTED}
    </span>
  )
}

function StatusItem({ label, status }: { label: string; status: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={status ? "text-green-500" : "text-slate-300"}>
        {status ? "✓" : "○"}
      </span>
    </div>
  )
}

