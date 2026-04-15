'use client';

import Link from 'next/link';
import { MapPin, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import type { Listing, PagedResponse } from '@/types';
import { ListingCard } from '@/components/listing/ListingCard';
import { useListings } from '@/hooks/useListings';

type ListingsData = Listing[] | PagedResponse<Listing>;

interface ListingGridProps {
  listings?:     ListingsData;
  loading?:      boolean;
  error?:        string | null;
  onPageChange?: (page: number) => void;
  emptyTitle?:   string;
  emptyBody?:    string;
  filters?:      any;
}

// ── Skeleton ──────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3 mt-3" />
      </div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────
function buildPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  if (current < 4)        return [0, 1, 2, 3, 4, '…', total - 1];
  if (current > total - 5) return [0, '…', total - 5, total - 4, total - 3, total - 2, total - 1];
  return [0, '…', current - 1, current, current + 1, '…', total - 1];
}

// ── Main component ────────────────────────────────────────────
export default function ListingGrid({
  listings: dataProp,
  loading      = false,
  error        = null,
  onPageChange,
  emptyTitle   = 'No listings found',
  emptyBody    = 'Try adjusting your filters or search in a different area.',
  filters,
}: ListingGridProps) {
  const { listings: fetchedListings, loading: fetchedLoading, error: fetchedError, setFilters } = useListings(filters || {});
  
  const data = dataProp ?? fetchedListings;
  const currentLoading = dataProp ? loading : fetchedLoading;
  const currentError = dataProp ? error : fetchedError;

  const isPaged  = !!data && !Array.isArray(data) && 'content' in data;
  const paged    = isPaged ? (data as PagedResponse<Listing>) : null;
  const items    = paged ? paged.content : ((data as Listing[]) ?? []);
  const total    = paged?.totalPages    ?? 1;
  const current  = paged?.number        ?? 0;
  const isFirst  = paged?.first         ?? true;
  const isLast   = paged?.last          ?? true;
  const count    = paged?.totalElements ?? items.length;

  if (currentLoading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)}
    </div>
  );

  if (currentError) return (
    <div className="text-center py-14 bg-red-50 rounded-2xl">
      <p className="text-red-500 font-medium text-sm">{currentError as string}</p>
    </div>
  );

  if (items.length === 0) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">🔍</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{emptyTitle}</h3>
      <p className="text-gray-500 text-sm">{emptyBody}</p>
    </div>
  );

  const pages = buildPages(current, total);

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        {count.toLocaleString('en-IN')} listing{count !== 1 ? 's' : ''} found
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {items.map(l => <ListingCard key={l.id} listing={l} />)}
      </div>

      {total > 1 && onPageChange && (
        <nav aria-label="Listings pagination"
             className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
          <button
            onClick={() => onPageChange(current - 1)}
            disabled={isFirst}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-xl
                       border border-gray-200 text-gray-600 hover:bg-gray-50
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>

          {pages.map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="w-9 text-center text-gray-400 text-sm select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                aria-current={p === current ? 'page' : undefined}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors
                  ${p === current
                    ? 'bg-[#16a34a] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {(p as number) + 1}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(current + 1)}
            disabled={isLast}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-xl
                       border border-gray-200 text-gray-600 hover:bg-gray-50
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
