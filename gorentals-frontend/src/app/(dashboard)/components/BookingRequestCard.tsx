'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Typography } from '@/components/ui/Typography'
import { Button } from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import { Loader2, Check, X } from 'lucide-react'

interface BookingRequestCardProps {
  booking: any
}

export function BookingRequestCard({ booking }: BookingRequestCardProps) {
  const router = useRouter()
  const [processingAction, setProcessingAction] = useState<'CONFIRMED' | 'CANCELLED' | null>(null)

  const handleAction = async (action: 'CONFIRMED' | 'CANCELLED') => {
    setProcessingAction(action)
    try {
      // Extract cookie safely
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('gorentals_token='))
        ?.split('=')[1]

      const url = action === 'CONFIRMED'
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080'}/api/bookings/${booking.id}/confirm`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080'}/api/bookings/${booking.id}/reject`

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        toast.success(action === 'CONFIRMED' ? 'Booking accepted!' : 'Booking declined')
        router.refresh() // Trigger real-time Server Component data re-validation!
      } else {
        const error = await res.json()
        toast.error(error.message || 'Failed to update booking')
      }
    } catch (err) {
      toast.error('Connection error')
    } finally {
      setProcessingAction(null)
    }
  }

  return (
    <Card variant="bordered" className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-surface-subtle transition-all group">
      <div className="flex-1 min-w-0">
        <Typography variant="body-md" className="font-bold text-text-primary">
          {booking.renter?.fullName ?? 'Customer'} wants {booking.listing?.title}
        </Typography>
        <Typography variant="body-xs" className="mt-1">
          {new Date(booking.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} –{' '}
          {new Date(booking.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          {' · '} <span className="font-bold text-text-primary">₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
        </Typography>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          variant="success"
          size="sm"
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 min-h-[36px]"
          onClick={() => handleAction('CONFIRMED')}
          disabled={processingAction !== null}
        >
          {processingAction === 'CONFIRMED' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          Accept
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 min-h-[36px]"
          onClick={() => handleAction('CANCELLED')}
          disabled={processingAction !== null}
        >
          {processingAction === 'CANCELLED' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <X className="w-3.5 h-3.5" />
          )}
          Decline
        </Button>
      </div>
    </Card>
  )
}
