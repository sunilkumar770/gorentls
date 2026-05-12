import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Typography, H2 } from '@/components/ui/Typography'

export function OwnerCTABand() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="relative rounded-[2.5rem] bg-brand-600 dark:bg-brand-700 px-8 sm:px-16 py-16 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-brand-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col lg:flex-row items-center justify-between gap-12 text-center lg:text-left">
          <div className="max-w-xl">
            <H2 className="text-white lg:text-5xl leading-tight">
              Turn your gear into <br className="hidden sm:block" />
              <span className="text-brand-200">passive income.</span>
            </H2>
            <p className="mt-6 text-brand-100 text-lg sm:text-xl font-medium leading-relaxed">
              List your cameras, drones, tools, or vehicles on GoRentals. 
              Reach thousands of renters in Hyderabad — earn while you sleep.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full sm:w-auto">
            <Link href="/signup?role=OWNER">
              <Button 
                variant="secondary" 
                size="lg" 
                className="bg-white text-brand-600 hover:bg-brand-50 border-none shadow-xl px-10 h-16 rounded-2xl"
              >
                Start listing free
              </Button>
            </Link>
            <Link href="/pricing">
              <Button 
                variant="ghost" 
                size="lg" 
                className="border-2 border-brand-400/50 text-white hover:bg-white/10 px-10 h-16 rounded-2xl"
              >
                See how it works
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

