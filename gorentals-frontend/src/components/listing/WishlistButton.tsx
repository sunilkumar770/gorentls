'use client';

import { Heart } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export function WishlistButton({
  listingId,
  size = 'md',
  className = '',
}: {
  listingId: string;
  size?:     'sm' | 'md';
  className?: string;
}) {
  const { toggle, isWishlisted } = useWishlist();
  const saved = isWishlisted(listingId);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();    // don't navigate when inside a Link
    e.stopPropagation();
    toggle(listingId);
    toast(saved ? 'Removed from wishlist' : '❤️ Saved to wishlist', {
      duration: 1500,
    });
  }

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5';
  const btnSize  = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';

  return (
    <button
      onClick={handleClick}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      className={cn(
        `${btnSize} rounded-full flex items-center justify-center
         transition-all duration-200 active:scale-90 shadow-sm`,
        saved
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-white/90 text-gray-400 hover:text-red-400 hover:bg-white backdrop-blur-sm',
        className,
      )}
    >
      <Heart className={cn(iconSize, saved && 'fill-current')} />
    </button>
  );
}
