// src/app/(public)/components/HeroSection.tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Typography } from '@/components/ui/Typography'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

export function HeroSection() {
  return (
    <section className="relative bg-surface-base border-b border-border-subtle overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] bg-brand-50/50 dark:bg-brand-900/10 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          {/* Trust anchor */}
          <Badge variant="brand" dot className="mb-8">
            Peer-to-peer rentals · Hyderabad, India
          </Badge>

          {/* Headline */}
          <Typography variant="h1" className="mb-6 leading-[1.05]">
            Rent smarter.
            <br />
            <span className="text-brand-600">Own less.</span>
          </Typography>

          {/* Subheadline */}
          <Typography variant="body-lg" className="max-w-xl mb-10 text-text-secondary">
            Borrow professional gear, tools, and electronics from verified locals — 
            with escrow-protected payments and KYC-verified owners.
          </Typography>

          {/* Search bar */}
          <form
            action="/search"
            method="GET"
            className="flex flex-col sm:flex-row gap-3 max-w-xl mb-6 items-end"
          >
            <div className="flex-1 w-full">
              <Input
                name="q"
                type="text"
                placeholder="Search cameras, laptops, drones..."
                leftIcon={<Search className="w-5 h-5" />}
                className="bg-surface-base border-border-default"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="shrink-0 rounded-lg shadow-sm"
            >
              Browse Rentals
            </Button>
          </form>

          {/* Secondary CTA */}
          <Typography variant="body-sm" className="text-text-tertiary">
            Have gear to rent out?{' '}
            <Link
              href="/signup?role=OWNER"
              className="font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Start listing →
            </Link>
          </Typography>
        </motion.div>
      </div>
    </section>
  )
}

