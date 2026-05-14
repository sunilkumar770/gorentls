'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/axios'
import { Card } from '@/components/ui/Card'
import { Typography } from '@/components/ui/Typography'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Loader2, Rocket, Trash2, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function OwnerDraftsPage() {
  const { user } = useAuth()
  const [drafts, setDrafts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPublishing, setIsPublishing] = useState<string | null>(null)

  const fetchDrafts = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/api/listings/owner/drafts')
      setDrafts(res.data.content || [])
    } catch (err) {
      console.error('Failed to fetch drafts:', err)
      toast.error('Failed to load draft listings')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchDrafts()
  }, [user])

  const handlePublish = async (id: string) => {
    if (user?.kycStatus !== 'APPROVED') {
      toast.error('Complete KYC to publish listings')
      return
    }

    try {
      setIsPublishing(id)
      await api.patch(`/api/listings/${id}/publish`)
      toast.success('Listing published successfully!')
      setDrafts(prev => prev.filter(d => d.id !== id))
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to publish listing'
      toast.error(msg)
    } finally {
      setIsPublishing(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return

    try {
      await api.delete(`/api/listings/${id}`)
      toast.success('Draft deleted')
      setDrafts(prev => prev.filter(d => d.id !== id))
    } catch (err) {
      toast.error('Failed to delete draft')
    }
  }

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Fetching your drafts...</p>
      </div>
    )
  }

  const isKycApproved = user?.kycStatus === 'APPROVED'

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-display">
            Draft Listings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage your unpublished assets
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/owner">Back to Dashboard</Link>
        </Button>
      </div>

      {!isKycApproved && drafts.length > 0 && (
        <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              You cannot publish these drafts until your KYC is approved. 
              <Link href="/dashboard/profile" className="ml-2 underline font-bold">Complete KYC now</Link>
            </p>
          </div>
        </Card>
      )}

      {drafts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12">
          <EmptyState
            icon="📝"
            title="No drafts found"
            description="All your listings are either published or you haven't created any yet."
            cta={{ label: 'Create Listing', href: '/owner/listings/new' }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {drafts.map((draft) => (
            <Card key={draft.id} variant="bordered" className="overflow-hidden flex flex-col group">
              <div className="aspect-[16/9] relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                {draft.images?.[0] ? (
                  <img 
                    src={draft.images[0]} 
                    alt={draft.title} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-300">📷</div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge variant="warning" size="sm">DRAFT</Badge>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex-1">
                  <Typography variant="body-md" className="font-bold text-slate-900 dark:text-white truncate">
                    {draft.title}
                  </Typography>
                  <Typography variant="body-xs" className="mt-1 line-clamp-2 text-slate-500">
                    {draft.description}
                  </Typography>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="primary" 
                      size="sm"
                      disabled={!isKycApproved || isPublishing === draft.id}
                      onClick={() => handlePublish(draft.id)}
                      className="flex-1 sm:flex-none"
                    >
                      {isPublishing === draft.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Rocket className="w-4 h-4" />
                      )}
                      <span>Publish</span>
                    </Button>
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/owner/listings/${draft.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                  <button 
                    onClick={() => handleDelete(draft.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete draft"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

