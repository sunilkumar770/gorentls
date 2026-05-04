'use client';

import React from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import type { Listing, PagedResponse } from '@/types';
import { ListingCard } from '@/components/listing/ListingCard';
import { useListings } from '@/hooks/useListings';
import { Button } from '@/components/ui/Button';

type ListingsData = Listing[] | PagedResponse<Listing>;

interface ListingGridProps {
  listings?:     ListingsData;
  loading?:      boolean;
  error?:        string | null;
  onPageChange?: (page: number) => void;
  emptyTitle?:   string;
  emptyBody?:    string;
  emptyAction?:  React.ReactNode;
  filters?:      Record<string, unknown>;
}

// ── Skeleton ──────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#01696f]/8 animate-pulse shadow-[0_2px_8px_rgba(1,105,111,0.04)]">
      <div className="aspect-video bg-[#eeeee9]" />
      <div className="p-4 space-y-2.5">
        <div className="h-4 bg-[#eeeee9] rounded-lg w-3/4" />
        <div className="h-3 bg-[#eeeee9] rounded-lg w-1/2" />
        <div className="h-5 bg-[#eeeee9] rounded-lg w-1/3 mt-3" />
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
  emptyAction,
  filters,
}: ListingGridProps) {
  const { listings: fetchedListings, loading: fetchedLoading, error: fetchedError } = useListings(filters || {});

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
    <div className="text-center py-14 bg-red-50 rounded-2xl border border-red-100">
      <p className="text-red-500 font-medium text-sm">{currentError as string}</p>
    </div>
  );

  if (items.length === 0) return (
    <div className="text-center py-24 bg-[var(--bg-card)] rounded-[var(--r-xl)] border border-[var(--border)] max-w-2xl mx-auto my-10 shadow-card">
      <div className="w-20 h-20 bg-[var(--primary-light)] rounded-[var(--r-xl)] flex items-center justify-center mx-auto mb-6 transform -rotate-2">
        <Package className="w-10 h-10 text-[var(--primary)]" strokeWidth={1.5} />
      </div>
      <h3 className="text-3xl font-display font-bold text-[var(--text)] mb-3">{emptyTitle}</h3>
      <p className="text-[var(--text-muted)] text-lg max-w-sm mx-auto mb-8 leading-relaxed">
        {emptyBody}
      </p>
      {emptyAction ? (
        <div className="flex justify-center">{emptyAction}</div>
      ) : (
        <Link href="/search">
          <Button variant="secondary" size="md" className="font-bold uppercase tracking-widest text-xs">
            Clear all filters
          </Button>
        </Link>
      )}
    </div>
  );

  const pages = buildPages(current, total);

  return (
    <div>
      {/* Listing count — no broken letter-spacing */}
      <p className="text-sm font-medium text-[#6b6b65] mb-5">
        <span className="font-bold text-[#1a1a18]">{count.toLocaleString('en-IN')}</span>
        {' '}{count === 1 ? 'listing' : 'listings'} found
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
            className="flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-xl
                       border border-[#01696f]/20 text-[#01696f] hover:bg-[#01696f]/5
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>

          {pages.map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="w-9 text-center text-[#9b9b93] text-sm select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                aria-current={p === current ? 'page' : undefined}
                className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors
                  ${p === current
                    ? 'bg-[#01696f] text-white shadow-sm'
                    : 'text-[#6b6b65] hover:bg-[#01696f]/5 hover:text-[#01696f]'
                  }`}
              >
                {(p as number) + 1}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(current + 1)}
            disabled={isLast}
            className="flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-xl
                       border border-[#01696f]/20 text-[#01696f] hover:bg-[#01696f]/5
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </nav>
      )}
    </div>
  );
}
