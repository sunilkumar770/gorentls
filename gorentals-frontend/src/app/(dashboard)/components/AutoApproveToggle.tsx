'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Typography } from '@/components/ui/Typography'
import { toast } from 'react-hot-toast'
import { Sparkles, Shield, Clock, AlertCircle } from 'lucide-react'

interface AutoApproveToggleProps {
  initialEnabled: boolean
}

export function AutoApproveToggle({ initialEnabled }: AutoApproveToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [loading, setLoading] = useState(false)

  const toggleSettings = async () => {
    if (loading) return
    setLoading(true)
    const nextState = !enabled

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('gorentals_token='))
        ?.split('=')[1]

      if (!token) {
        toast.error('Session expired. Please log in again.')
        setLoading(false)
        return
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080'
      const url = `${baseUrl}/api/users/settings`

      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          autoApproveBookings: nextState
        })
      })

      if (res.ok) {
        setEnabled(nextState)
        toast.success(
          nextState
            ? '⚡ Instant Booking Enabled! All incoming requests will be approved instantly.'
            : '🔒 Manual Booking Enabled. You will review all requests manually.'
        )
      } else {
        const errorData = await res.json().catch(() => ({}))
        toast.error(errorData.message || 'Failed to update auto-approve preference')
      }
    } catch (err) {
      console.error('[AutoApproveToggle] error:', err)
      toast.error('Network connection issue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white relative p-6 md:p-8">
      {/* Decorative backdrop gradients */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/10 rounded-full blur-2xl -ml-20 -mb-20 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              Preference Settings
            </span>
          </div>

          <Typography variant="h3" className="text-white font-extrabold tracking-tight animate-in slide-in-from-left duration-500">
            Instant Booking Approval
          </Typography>

          <Typography variant="body-sm" className="text-slate-300 leading-relaxed font-medium">
            Automate your rental pipeline. Let renters book instantly when your gear is available, or manually verify each inquiry to match your schedule.
          </Typography>
        </div>

        {/* The Premium Toggle Switch */}
        <div className="flex flex-col items-center sm:items-end justify-center shrink-0">
          <button
            onClick={toggleSettings}
            disabled={loading}
            className={`w-20 h-10 rounded-full p-1 transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 ${
              enabled ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-slate-700'
            } relative shadow-lg ${loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            aria-label="Toggle Instant Booking"
          >
            <div
              className={`w-8 h-8 rounded-full bg-white shadow-md transform transition-transform duration-500 flex items-center justify-center ${
                enabled ? 'translate-x-10' : 'translate-x-0'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : enabled ? (
                <span className="text-xs">⚡</span>
              ) : (
                <span className="text-xs">🔒</span>
              )}
            </div>
          </button>
          
          <span className="mt-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
            {enabled ? 'INSTANT APPROVAL ON' : 'MANUAL APPROVAL ONLY'}
          </span>
        </div>
      </div>

      {/* Feature cards for explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 relative z-10 pt-6 border-t border-white/10">
        <div
          onClick={() => !enabled && toggleSettings()}
          className={`flex gap-4 p-4 rounded-xl transition-all duration-300 cursor-pointer ${
            enabled 
              ? 'bg-white/5 border border-emerald-500/30 shadow-md shadow-emerald-500/5 scale-[1.02]' 
              : 'hover:bg-white/5 border border-transparent'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
          }`}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <Typography variant="body-sm" className="font-bold text-white">
              Instant Confirmations (Auto)
            </Typography>
            <Typography variant="body-xs" className="mt-1 text-slate-400 leading-normal">
              Bookings are approved immediately. Blocked dates are generated instantly to maximize occupancy and revenue.
            </Typography>
          </div>
        </div>

        <div
          onClick={() => enabled && toggleSettings()}
          className={`flex gap-4 p-4 rounded-xl transition-all duration-300 cursor-pointer ${
            !enabled 
              ? 'bg-white/5 border border-indigo-500/30 shadow-md shadow-indigo-500/5 scale-[1.02]' 
              : 'hover:bg-white/5 border border-transparent'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            !enabled ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'
          }`}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <Typography variant="body-sm" className="font-bold text-white">
              Manual Verification
            </Typography>
            <Typography variant="body-xs" className="mt-1 text-slate-400 leading-normal">
              You retain 100% control. Every booking request must be manually accepted or declined via your requests panel.
            </Typography>
          </div>
        </div>
      </div>
    </Card>
  )
}
