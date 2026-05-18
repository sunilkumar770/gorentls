'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  User, 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  MessageSquare,
  FileText,
  Download
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Typography } from '@/components/ui/Typography'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'react-hot-toast'
import { 
  getBooking, 
  cancelBooking, 
  acceptBooking, 
  rejectBooking, 
  triggerReceiptDownload,
} from '@/services/bookings'
import { getConversations, startConversation } from '@/services/messages'

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Payment Pending',
  PENDING: 'Awaiting Approval',
  CONFIRMED: 'Confirmed',
  IN_USE: 'Currently Renting',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
  RETURNED: 'Returned',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PENDING: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CONFIRMED: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  IN_USE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  COMPLETED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  CANCELLED: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  REJECTED: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  RETURNED: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
}

export default function BookingDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [booking, setBooking] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?from=/dashboard/bookings/${id}`)
    }
  }, [authLoading, user, id, router])

  const fetchBooking = async () => {
    try {
      setIsLoading(true)
      const data = await getBooking(id)
      setBooking(data)
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to load booking details')
      if (err.response?.status === 404) {
        router.push('/dashboard/bookings')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user && id) fetchBooking()
  }, [user, id])

  const handleAction = async (actionFn: (id: string) => Promise<any>, successMsg: string) => {
    try {
      setIsActionLoading(true)
      await actionFn(id)
      toast.success(successMsg)
      await fetchBooking()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDownloadReceipt = async () => {
    try {
      toast.loading('Preparing your receipt...', { id: 'receipt' })
      await triggerReceiptDownload(id)
      toast.success('Receipt downloaded successfully!', { id: 'receipt' })
    } catch (err) {
      toast.error('Failed to download receipt', { id: 'receipt' })
    }
  }

  const handleChat = async () => {
    if (!booking || !user) return
    try {
      setIsActionLoading(true)
      // 1. Get all conversations for the user
      const convs = await getConversations()
      
      // 2. Find matching conversation (same listing and renter)
      const existing = convs.find(c => 
        c.listingId === booking.listing.id && 
        c.renterId === booking.renter.id
      )

      if (existing) {
        router.push(`/dashboard/messages/${existing.id}`)
        return
      }

      // 3. If no conversation exists, we can start one
      const isRenter = user.id === booking.renter.id
      const isOwner = user.id === booking.owner.id

      if (isRenter || isOwner) {
        const newConv = await startConversation(
          booking.listing.id, 
          `Hi, I'm reaching out about the booking for ${booking.listing.title}.`,
          isOwner ? booking.renter.id : undefined
        )
        router.push(`/dashboard/messages/${newConv.id}`)
      } else {
        toast.error('You are not authorized to chat for this booking.')
      }
    } catch (err) {
      console.error('[Chat] Error:', err)
      toast.error('Failed to open chat')
    } finally {
      setIsActionLoading(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading booking details...</p>
      </div>
    )
  }

  if (!booking) return null

  const startDate = new Date(booking.startDate)
  const endDate = new Date(booking.endDate)
  const days = booking.totalDays || Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  
  const isOwner = user?.id === booking.owner?.id
  const isRenter = user?.id === booking.renter?.id

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Navigation */}
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Bookings
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding="none" className="overflow-hidden border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-3xl">
            {/* Hero Image / Header */}
            <div className="relative h-64 bg-slate-100 dark:bg-slate-800">
              {booking.listing?.imageUrl || (booking.listing?.images && booking.listing.images[0]) ? (
                <img 
                  src={booking.listing.imageUrl || booking.listing.images[0]} 
                  alt={booking.listing.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">📦</div>
              )}
              <div className="absolute top-4 right-4">
                <Badge className={`${STATUS_COLORS[booking.status]} border-none px-4 py-1.5 text-xs font-bold uppercase tracking-widest`}>
                  {STATUS_LABELS[booking.status] ?? booking.status}
                </Badge>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div>
                <Typography variant="h2" className="text-3xl font-bold tracking-tight">
                  {booking.listing?.title ?? 'Equipment Rental'}
                </Typography>
                <div className="flex items-center gap-2 mt-2 text-slate-500 dark:text-slate-400 font-medium">
                  <MapPin className="w-4 h-4" />
                  <span>{booking.listing?.city ?? 'Hyderabad'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 py-8 border-y border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Start Date
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> End Date
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div>
                <Typography variant="h4" className="mb-4">Rental Information</Typography>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                        <Clock className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Duration</p>
                        <p className="font-bold text-slate-900 dark:text-white">{days} Days</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Price</p>
                      <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">₹{booking.totalAmount?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Role-based Information Card */}
          <Card className="p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar 
                  src={isOwner ? booking.renter?.avatarUrl : booking.owner?.avatarUrl} 
                  name={isOwner ? (booking.renter?.fullName ?? 'Renter') : (booking.owner?.fullName ?? 'Owner')} 
                  size="lg" 
                  className="rounded-2xl"
                />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                    {isOwner ? 'Rented by' : 'Lent by'}
                  </p>
                  <Typography variant="h4">
                    {isOwner ? (booking.renter?.fullName ?? 'Verified Renter') : (booking.owner?.fullName ?? 'Verified Owner')}
                  </Typography>
                </div>
              </div>
              <Button 
                variant="secondary" 
                className="rounded-xl gap-2"
                onClick={handleChat}
                disabled={isActionLoading}
              >
                <MessageSquare className="w-4 h-4" />
                Chat
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Sidebar Actions */}
        <div className="space-y-6">
          <Card className="p-6 bg-indigo-600 text-white border-none rounded-3xl shadow-xl shadow-indigo-200/50 dark:shadow-none overflow-hidden relative">
            <div className="relative z-10 space-y-4">
              <h3 className="text-xl font-bold">Manage Booking</h3>
              <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                {isOwner 
                  ? "Respond to this rental request to confirm the availability of your gear."
                  : "Need to make changes or cancel your request? You can do so here before the owner confirms."}
              </p>
              
              <div className="pt-4 space-y-3">
                {/* Renter Actions */}
                {isRenter && booking.status === 'PENDING' && (
                  <Button 
                    variant="secondary" 
                    onClick={() => handleAction(cancelBooking, 'Booking cancelled successfully')}
                    disabled={isActionLoading}
                    className="w-full bg-white text-indigo-600 hover:bg-indigo-50 border-none h-12 rounded-2xl font-bold"
                  >
                    Cancel Request
                  </Button>
                )}
                {isRenter && booking.status === 'PENDING_PAYMENT' && (
                  <Button 
                    variant="primary" 
                    onClick={() => router.push(`/checkout/${id}`)}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-none h-12 rounded-2xl font-bold shadow-lg shadow-emerald-900/20"
                  >
                    Pay Now
                  </Button>
                )}

                {/* Owner Actions */}
                {isOwner && booking.status === 'PENDING' && (
                  <div className="space-y-3">
                    <Button 
                      variant="primary" 
                      onClick={() => handleAction(acceptBooking, 'Booking accepted!')}
                      disabled={isActionLoading}
                      className="w-full bg-white text-indigo-600 hover:bg-indigo-50 border-none h-12 rounded-2xl font-bold"
                    >
                      Accept Booking
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleAction(rejectBooking, 'Booking rejected')}
                      disabled={isActionLoading}
                      className="w-full border-white/20 text-white hover:bg-white/10 h-12 rounded-2xl font-bold"
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {/* Shared Actions */}
                {booking.status === 'CONFIRMED' && (
                  <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                    <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Confirmed
                    </p>
                    <p className="text-[11px] mt-1 text-indigo-100 font-medium leading-relaxed">
                      {isRenter 
                        ? `The owner has confirmed your request. Prepare for pickup on ${startDate.toLocaleDateString()}.`
                        : `You have confirmed this booking. Prepare the item for pickup on ${startDate.toLocaleDateString()}.`}
                    </p>
                  </div>
                )}

                {booking.status === 'COMPLETED' && (
                   <Button 
                     variant="secondary" 
                     onClick={handleDownloadReceipt}
                     className="w-full bg-white text-indigo-600 hover:bg-indigo-50 border-none h-12 rounded-2xl font-bold flex items-center gap-2"
                   >
                     <Download className="w-4 h-4" />
                     Download Receipt
                   </Button>
                )}

                {/* Info for Terminal States */}
                {(booking.status === 'CANCELLED' || booking.status === 'REJECTED') && (
                  <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                    <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <XCircle className="w-4 h-4" /> {STATUS_LABELS[booking.status]}
                    </p>
                    <p className="text-[11px] mt-1 text-indigo-100 font-medium">
                      This booking has been {booking.status.toLowerCase()}.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          </Card>

          <Card className="p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-3xl space-y-4">
            <Typography variant="h4">Need Help?</Typography>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              If you encounter any issues with this rental, please contact our support team or refer to our safety guidelines.
            </p>
            <Button variant="outline" asChild className="w-full rounded-2xl h-11">
              <Link href="/help">Help Center</Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
