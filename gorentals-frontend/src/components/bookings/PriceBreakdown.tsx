'use client';

// src/components/bookings/PriceBreakdown.tsx
// Reusable price breakdown card.
// Used in: item detail preview, checkout page, booking history detail.

import { Info } from 'lucide-react';
import { formatINR } from '@/lib/pricing';

export interface BreakdownItem {
  label:    string;
  amount:   number;
  isBold?:  boolean;
  isGreen?: boolean;
  isNote?:  string;
}

interface Props {
  lines:       BreakdownItem[];
  title?:      string;
  showNotice?: boolean;
  className?:  string;
}

export function PriceBreakdown({
  lines,
  title = 'Price Breakdown',
  showNotice = true,
  className = '',
}: Props) {
  // Separate regular lines from the final "total" line (last item with isBold).
  // This makes the separator placement explicit and avoids index-as-key anti-pattern.
  const bodyLines = lines.slice(0, -1);
  const totalLine = lines[lines.length - 1];

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${className}`}>

      <h3 className="font-semibold text-gray-900 mb-4 text-[15px]">{title}</h3>

      <div className="space-y-2.5 text-sm">
        {/* Sub-total lines */}
        {bodyLines.map((line) => (
          <div key={line.label} className="flex items-center justify-between gap-4">
            <span className="text-gray-500">
              {line.label}
              {line.isNote && (
                <span className="ml-1 text-xs text-gray-400">{line.isNote}</span>
              )}
            </span>
            <span className="font-semibold tabular-nums text-gray-900">
              {formatINR(line.amount)}
            </span>
          </div>
        ))}

        {/* Divider before total */}
        {totalLine && (
          <>
            <div className="border-t border-gray-100 !mt-3 !mb-0" />
            <div className="flex items-center justify-between gap-4 !mt-3">
              <span className="font-bold text-gray-900">
                {totalLine.label}
                {totalLine.isNote && (
                  <span className="ml-1 text-xs text-gray-400">{totalLine.isNote}</span>
                )}
              </span>
              <span
                className={[
                  'font-bold tabular-nums text-base',
                  totalLine.isGreen ? 'text-[#16a34a]' : 'text-gray-900',
                ].join(' ')}
              >
                {formatINR(totalLine.amount)}
              </span>
            </div>
          </>
        )}
      </div>

      {showNotice && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-green-50
                        border border-green-100 px-3 py-2.5">
          <Info className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-green-700 leading-relaxed">
            No hidden charges. Price includes 18% GST and 5% platform fee.
            Payment gateway fees are absorbed by GoRentals.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function PriceBreakdownSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm
                    p-5 space-y-4 animate-pulse">
      <div className="h-4 w-36 bg-gray-100 rounded" />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex justify-between">
          <div className="h-3 bg-gray-100 rounded w-32" />
          <div className="h-3 bg-gray-100 rounded w-20" />
        </div>
      ))}
      <div className="border-t border-gray-100 pt-3 flex justify-between">
        <div className="h-4 bg-gray-100 rounded w-24" />
        <div className="h-4 bg-gray-100 rounded w-28" />
      </div>
    </div>
  );
}
