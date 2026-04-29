'use client';

import { useState, useMemo } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { BlockedRange } from '@/types';
import 'react-day-picker/dist/style.css';

interface BookingCalendarProps {
  /** Array of blocked date ranges with reasons */
  blockedRanges: BlockedRange[];
  /** Currently selected date range */
  selectedRange?: DateRange;
  /** Callback when date range is selected */
  onSelect: (range: DateRange | undefined) => void;
  /** Disabled state (e.g., while booking in progress) */
  disabled?: boolean;
}

/**
 * Production-Grade Booking Calendar Component
 * 
 * Features:
 * - Clear visual distinction between available, booked, and owner-blocked dates
 * - Prevents invalid date selections
 * - Shows interactive legend
 * - Mobile-friendly with touch support
 * - Accessible with ARIA labels and keyboard navigation
 * - Performance optimized with useMemo
 */
export default function BookingCalendar({
  blockedRanges,
  selectedRange,
  onSelect,
  disabled = false,
}: BookingCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);

  // Separate blocked ranges by reason for different visual treatment
  const { bookedDates, ownerBlockedDates } = useMemo(() => {
    const booked: Array<{ from: Date; to: Date }> = [];
    const ownerBlocked: Array<{ from: Date; to: Date }> = [];

    blockedRanges.forEach((range) => {
      const dateRange = {
        from: new Date(range.startDate),
        to: new Date(range.endDate),
      };
      
      if (range.reason === 'BOOKING') {
        booked.push(dateRange);
      } else if (range.reason === 'MANUAL') {
        ownerBlocked.push(dateRange);
      }
    });

    return { bookedDates: booked, ownerBlockedDates: ownerBlocked };
  }, [blockedRanges]);

  // All disabled dates (both booked and owner-blocked)
  const allDisabledDates = useMemo(
    () => [...bookedDates, ...ownerBlockedDates],
    [bookedDates, ownerBlockedDates]
  );

  // Get tooltip text for hovered date
  const getTooltipText = (day: Date): string | null => {
    const dayStr = format(day, 'yyyy-MM-dd');
    
    for (const range of blockedRanges) {
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      
      if (day >= start && day <= end) {
        return range.reason === 'BOOKING' 
          ? 'Already booked by another renter'
          : 'Unavailable (Owner blocked)';
      }
    }
    
    return null;
  };

  const tooltipText = hoveredDay ? getTooltipText(hoveredDay) : null;

  return (
    <div className="booking-calendar-container">
      {/* Legend - Always visible for clarity */}
      <div className="flex items-center gap-4 mb-4 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-gray-200 bg-white" />
          <span className="text-gray-700">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-400" />
          <span className="text-gray-700">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-gray-700">Owner Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-teal-600" />
          <span className="text-gray-700">Your Selection</span>
        </div>
      </div>

      {/* Tooltip for hovered disabled dates */}
      {tooltipText && (
        <div 
          className="mb-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700 animate-fade-in"
          role="status"
          aria-live="polite"
        >
          {tooltipText}
        </div>
      )}

      {/* Calendar */}
      <div className="booking-calendar-wrapper">
        <DayPicker
          mode="range"
          selected={selectedRange}
          onSelect={onSelect}
          disabled={[
            { before: new Date() }, // Past dates
            ...allDisabledDates, // Blocked ranges
          ]}
          modifiers={{
            booked: bookedDates,
            ownerBlocked: ownerBlockedDates,
          }}
          modifiersStyles={{
            booked: {
              backgroundColor: '#fb923c', // orange-400
              color: 'white',
              cursor: 'not-allowed',
              opacity: 0.9,
            },
            ownerBlocked: {
              backgroundColor: '#ef4444', // red-500
              color: 'white',
              cursor: 'not-allowed',
              opacity: 0.9,
            },
            selected: {
              backgroundColor: 'var(--primary, #0d9488)', // teal-600
              color: 'white',
              fontWeight: '600',
            },
          }}
          styles={{
            caption: {
              color: 'var(--text, #111827)',
              fontFamily: 'Satoshi, system-ui, sans-serif',
              fontWeight: '700',
              fontSize: '1rem',
            },
            head_cell: {
              color: '#6b7280', // gray-500
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
            },
            day: {
              fontWeight: '500',
              color: '#111827',
              cursor: 'pointer',
            },
          }}
          onDayMouseEnter={(day) => setHoveredDay(day)}
          onDayMouseLeave={() => setHoveredDay(null)}
          // Accessibility
          aria-label="Booking calendar - select your rental dates"
          />
      </div>

      <style jsx global>{`
        /* Custom calendar styles for production polish */
        .booking-calendar-wrapper .rdp {
          --rdp-cell-size: 44px;
          --rdp-accent-color: var(--primary, #0d9488);
          font-family: 'Satoshi', system-ui, sans-serif;
        }

        .booking-calendar-wrapper .rdp-day {
          border-radius: 6px;
          transition: all 0.15s ease;
        }

        .booking-calendar-wrapper .rdp-day:not(.rdp-day_disabled):hover {
          background-color: #f3f4f6;
          transform: scale(1.05);
        }

        .booking-calendar-wrapper .rdp-day_selected {
          border-radius: 6px;
        }

        .booking-calendar-wrapper .rdp-day_disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        .booking-calendar-wrapper .rdp-day_today {
          font-weight: 700;
          color: var(--primary, #0d9488);
        }

        /* Improved range selection visual */
        .booking-calendar-wrapper .rdp-day_range_middle {
          background-color: rgba(13, 148, 136, 0.1) !important;
          color: #111827;
        }

        .booking-calendar-wrapper .rdp-day_range_start,
        .booking-calendar-wrapper .rdp-day_range_end {
          background-color: var(--primary, #0d9488) !important;
          color: white;
          font-weight: 600;
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .booking-calendar-wrapper .rdp {
            --rdp-cell-size: 38px;
            font-size: 0.875rem;
          }
        }

        /* Animation for tooltip */
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        /* Accessibility improvements */
        .booking-calendar-wrapper .rdp-day:focus-visible {
          outline: 2px solid var(--primary, #0d9488);
          outline-offset: 2px;
          z-index: 10;
        }

        /* Better visual feedback for disabled dates */
        .booking-calendar-wrapper .rdp-day_disabled::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 10%;
          right: 10%;
          height: 2px;
          background: rgba(255, 255, 255, 0.5);
          transform: translateY(-50%) rotate(-45deg);
        }
      `}</style>
    </div>
  );
}
