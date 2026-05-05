'use client';

import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
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
  const { favorites, addFavorite, removeFavorite } = useFavorites();
  const saved = favorites.some(f => f.listing?.id === listingId);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();    // don't navigate when inside a Link
    e.stopPropagation();
    
    let success = false;
    if (saved) {
      success = await removeFavorite(listingId);
    } else {
      success = await addFavorite(listingId);
    }
    
    if (success) {
      toast(saved ? 'Removed from favorites' : '❤️ Saved to favorites', {
        duration: 1500,
      });
    } else {
      toast.error('Failed to update favorites. Please login.', {
        duration: 2000,
      });
    }
  }

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5';
  const btnSize  = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';

  return (
    <button
      onClick={handleClick}
      aria-label={saved ? 'Remove from favorites' : 'Save to favorites'}
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
