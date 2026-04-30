'use client';

import React, { useMemo, useState } from 'react';
import { DayPicker, DateRange, DayProps, useDayRender } from 'react-day-picker';
import { format, isWithinInterval, startOfDay, isBefore } from 'date-fns';
import { BlockedRange } from '@/types';
import { Info } from 'lucide-react';

interface BookingCalendarProps {
  blockedRanges: BlockedRange[];
  selectedRange?: DateRange;
  onSelect: (range: DateRange | undefined) => void;
  disabled?: boolean;
}

/**
 * Production-Grade Booking Calendar Component
 *
 * Features:
 * - Custom Day rendering with per-day block-reason tooltips
 * - Clear visual distinction: available / booked (orange) / owner-blocked (red) / selected (teal)
 * - Prevents past-date selection
 * - Full accessibility: ARIA labels, keyboard navigation
 * - Performance-optimised with useMemo
 */

/**
 * Custom Day component — handles specialised per-day styling and tooltips.
 */
function CustomDay(props: DayProps & { blockedRanges: BlockedRange[]; disabled?: boolean }) {
  const { date, displayMonth, blockedRanges } = props;
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const { activeModifiers, buttonProps } = useDayRender(
    date,
    displayMonth,
    buttonRef as React.RefObject<HTMLButtonElement>,
  );

  // Determine if this specific day is blocked and why
  const blockReason = useMemo(() => {
    const day = startOfDay(date);
    const range = blockedRanges.find(r => {
      const start = startOfDay(new Date(r.startDate));
      const end = startOfDay(new Date(r.endDate));
      return isWithinInterval(day, { start, end });
    });
    return range?.reason;
  }, [date, blockedRanges]);

  const isPast = isBefore(startOfDay(date), startOfDay(new Date()));
  const isBlocked = !!blockReason || isPast;

  const getDayStyles = () => {
    if (isPast) return 'text-gray-300 cursor-not-allowed bg-gray-50 opacity-50';
    if (blockReason === 'BOOKING') return 'bg-orange-100 text-orange-700 cursor-not-allowed border-orange-200';
    if (blockReason === 'MANUAL') return 'bg-red-50 text-red-700 cursor-not-allowed border-red-100';

    if (activeModifiers.selected) {
      if (activeModifiers.range_start || activeModifiers.range_end) {
        return 'bg-[#0d9488] text-white font-bold ring-2 ring-[#0d9488]/20 z-10';
      }
      return 'bg-[#0d9488]/10 text-[#0d9488] font-semibold';
    }

    return 'hover:bg-gray-100 text-gray-700';
  };

  const getTooltipText = (): string | null => {
    if (isPast) return 'Date is in the past';
    if (blockReason === 'BOOKING') return 'Already booked by another renter';
    if (blockReason === 'MANUAL') return 'Unavailable (Owner blocked)';
    return null;
  };

  const tooltip = getTooltipText();

  return (
    <div className="relative group">
      <button
        {...buttonProps}
        ref={buttonRef}
        disabled={isBlocked || props.disabled}
        aria-label={`${format(date, 'PPPP')}${tooltip ? `. ${tooltip}` : ''}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          w-10 h-10 md:w-11 md:h-11 flex items-center justify-center text-sm rounded-xl transition-all relative
          ${getDayStyles()}
          ${isBlocked ? 'pointer-events-auto' : ''}
          ${activeModifiers.range_middle ? 'rounded-none' : ''}
          ${activeModifiers.range_start ? 'rounded-r-none' : ''}
          ${activeModifiers.range_end ? 'rounded-l-none' : ''}
        `}
      >
        {format(date, 'd')}

        {/* Visual indicators for blocked states */}
        {blockReason === 'BOOKING' && (
          <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-orange-400" />
        )}
        {blockReason === 'MANUAL' && (
          <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-red-400" />
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold rounded-lg whitespace-nowrap z-[100] shadow-xl pointer-events-none">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

export default function BookingCalendar({
  blockedRanges,
  selectedRange,
  onSelect,
  disabled
}: BookingCalendarProps) {

  return (
    <div className="booking-calendar-wrapper w-full max-w-sm mx-auto">
      <div className="flex flex-col gap-6">
        {/* Legend */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 py-3 px-4 bg-gray-50/50 rounded-2xl border border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-white border border-gray-200" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Owner Blocked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#0d9488]" />
            <span>Selection</span>
          </div>
        </div>

        <div className="flex justify-center p-2 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <DayPicker
            mode="range"
            selected={selectedRange}
            onSelect={onSelect}
            disabled={[
              { before: startOfDay(new Date()) },
              ...blockedRanges.map(r => ({ from: new Date(r.startDate), to: new Date(r.endDate) }))
            ]}
            components={{
              Day: (props) => <CustomDay {...props} blockedRanges={blockedRanges} disabled={disabled} />
            }}
            styles={{
              caption: { color: '#1a1a18', fontWeight: '700', marginBottom: '0.5rem' },
              head_cell: { color: '#6b6b65', fontSize: '0.75rem', fontWeight: '600', paddingBottom: '0.75rem' },
              table: { borderCollapse: 'separate', borderSpacing: '2px' },
              nav_button: { color: '#6b6b65' }
            }}
          />
        </div>

        {selectedRange?.from && !selectedRange?.to && (
          <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-100 rounded-xl">
            <Info className="w-4 h-4 text-[#0d9488]" />
            <p className="text-xs text-teal-800 font-medium">Select your intended return date</p>
          </div>
        )}
      </div>
    </div>
  );
}
