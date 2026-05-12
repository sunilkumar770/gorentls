'use client';

import React, { useMemo, useState } from 'react';
import { DayPicker, DateRange, DayButtonProps } from 'react-day-picker';
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
function CustomDayButton(props: DayButtonProps & { blockedRanges: BlockedRange[]; disabled?: boolean }) {
  const { day, modifiers, blockedRanges, disabled, ...buttonProps } = props;
  const date = day.date;
  const [showTooltip, setShowTooltip] = useState(false);

  // Determine if this specific day is blocked and why
  const blockReason = useMemo(() => {
    const d = startOfDay(date);
    const range = blockedRanges.find(r => {
      const start = startOfDay(new Date(r.startDate));
      const end = startOfDay(new Date(r.endDate));
      return isWithinInterval(d, { start, end });
    });
    return range?.reason;
  }, [date, blockedRanges]);

  const isPast = isBefore(startOfDay(date), startOfDay(new Date()));
  const isBlocked = !!blockReason || isPast;

  const getDayStyles = () => {
    if (isPast) return 'text-gray-300 cursor-not-allowed bg-gray-50 opacity-50';
    if (blockReason === 'BOOKING') return 'bg-orange-500 text-white cursor-not-allowed border-orange-600 shadow-inner opacity-90';
    if (blockReason === 'MANUAL') return 'bg-rose-600 text-white cursor-not-allowed border-rose-700 shadow-inner opacity-90';

    if (modifiers.selected) {
      if (modifiers.range_start || modifiers.range_end) {
        return 'bg-red-600 text-white font-bold ring-2 ring-red-600/20 z-10';
      }
      return 'bg-red-600/10 text-red-600 font-semibold';
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
    <div className="relative group flex items-center justify-center">
      <button
        {...buttonProps}
        type="button"
        disabled={isBlocked || disabled}
        aria-label={`${format(date, 'PPPP')}${tooltip ? `. ${tooltip}` : ''}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          w-10 h-10 md:w-11 md:h-11 flex items-center justify-center text-sm rounded-xl transition-all relative
          ${getDayStyles()}
          ${isBlocked ? 'pointer-events-auto' : ''}
          ${modifiers.range_middle ? 'rounded-none' : ''}
          ${modifiers.range_start ? 'rounded-r-none' : ''}
          ${modifiers.range_end ? 'rounded-l-none' : ''}
          ${buttonProps.className || ''}
        `}
      >
        {format(date, 'd')}

        {/* Visual indicators for blocked states */}
        {blockReason === 'BOOKING' && (
          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
        )}
        {blockReason === 'MANUAL' && (
          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
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

  // Function to check if a range overlaps with any blocked dates
  const isRangeInvalid = (range: DateRange | undefined) => {
    if (!range?.from || !range?.to) return false;
    
    return blockedRanges.some(blocked => {
      const blockedStart = startOfDay(new Date(blocked.startDate));
      const blockedEnd = startOfDay(new Date(blocked.endDate));
      
      // Check if any date in the selected range (from -> to) overlaps with this blocked range
      return (
        isWithinInterval(blockedStart, { start: range.from!, end: range.to! }) ||
        isWithinInterval(blockedEnd, { start: range.from!, end: range.to! }) ||
        isWithinInterval(range.from!, { start: blockedStart, end: blockedEnd })
      );
    });
  };

  const handleSelect = (range: DateRange | undefined) => {
    if (isRangeInvalid(range)) {
      // If invalid, we reset or ignore. 
      // For better UX, we could just select the 'from' date again.
      if (range?.from) {
        onSelect({ from: range.from, to: undefined });
      }
      return;
    }
    onSelect(range);
  };

  return (
    <div className="booking-calendar-wrapper w-full max-w-sm mx-auto">
      <div className="flex flex-col gap-6">
        {/* Legend */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 py-3 px-4 bg-gray-50/50 rounded-2xl border border-border text-[10px] font-bold uppercase tracking-wider text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-card border border-gray-200" />
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
            <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <span>Selection</span>
          </div>
        </div>

        <div className="flex justify-center p-2 rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
          <DayPicker
            mode="range"
            selected={selectedRange}
            onSelect={handleSelect}
            disabled={[
              { before: startOfDay(new Date()) },
              ...blockedRanges.map(r => ({ from: new Date(r.startDate), to: new Date(r.endDate) }))
            ]}
            components={{
              DayButton: (props) => <CustomDayButton {...props} blockedRanges={blockedRanges} disabled={disabled} />
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
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
            <Info className="w-4 h-4 text-red-600" />
            <p className="text-xs text-red-900 font-medium">Select your intended return date</p>
          </div>
        )}
      </div>
    </div>
  );
}
