// src/components/ui/ImageWithFallback.tsx
'use client'
import { useState, useEffect } from 'react'
import { Package, Camera, Smartphone, Laptop, Bike, Hammer } from 'lucide-react'

interface Props {
  src: string | null | undefined
  alt: string
  className?: string
  category?: string
}

export default function ImageWithFallback({ src, alt, className = '', category }: Props) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  // Reset error state if src changes
  useEffect(() => {
    setError(false)
    setLoading(true)
  }, [src])

  if (!src || error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 ${className}`}>
        {category?.toLowerCase().includes('camera') ? (
          <Camera className="w-12 h-12 opacity-20" />
        ) : category?.toLowerCase().includes('phone') ? (
          <Smartphone className="w-12 h-12 opacity-20" />
        ) : category?.toLowerCase().includes('laptop') ? (
          <Laptop className="w-12 h-12 opacity-20" />
        ) : category?.toLowerCase().includes('bike') ? (
          <Bike className="w-12 h-12 opacity-20" />
        ) : category?.toLowerCase().includes('tool') ? (
          <Hammer className="w-12 h-12 opacity-20" />
        ) : (
          <Package className="w-12 h-12 opacity-20" />
        )}
        <span className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-40">No Image</span>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true)
          setLoading(false)
        }}
      />
    </div>
  )
}
