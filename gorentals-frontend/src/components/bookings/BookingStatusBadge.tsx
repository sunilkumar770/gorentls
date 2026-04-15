'use client';

import type { BookingStatus } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:     { label: 'Pending',     color: 'bg-amber-100 text-amber-800'   },
  ACCEPTED:    { label: 'Accepted',    color: 'bg-blue-100 text-blue-800'     },
  CONFIRMED:   { label: 'Confirmed',   color: 'bg-emerald-100 text-emerald-800' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
  COMPLETED:   { label: 'Completed',   color: 'bg-gray-100 text-gray-600'     },
  RETURNED:    { label: 'Returned',    color: 'bg-gray-100 text-gray-600'     },
  CANCELLED:   { label: 'Cancelled',   color: 'bg-red-100 text-red-700'       },
  REJECTED:    { label: 'Rejected',    color: 'bg-red-100 text-red-700'       },
};

interface BookingStatusBadgeProps {
  status: BookingStatus | string;
  className?: string;
}

export function BookingStatusBadge({ status, className = '' }: BookingStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-gray-100 text-gray-600' };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                  ${cfg.color} ${className}`}
    >
      {cfg.label}
    </span>
  );
}
