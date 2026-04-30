'use client';

import { useState, useEffect, useCallback } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, startOfDay } from 'date-fns';
import { getAvailability, blockDates, unblockDates } from '@/services/availability';
import { BlockedRange } from '@/types';
import { toast } from 'react-hot-toast';
import { Loader2, Calendar as CalendarIcon, X, Plus } from 'lucide-react';

interface CalendarManagerProps {
  listingId: string;
}

export default function CalendarManager({ listingId }: CalendarManagerProps) {
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();

  const loadAvailability = useCallback(async () => {
    try {
      const data = await getAvailability(listingId);
      setBlockedRanges(data.blockedRanges);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const handleBlockDates = async () => {
    if (!selectedRange?.from || !selectedRange?.to) {
      toast.error('Please select a date range');
      return;
    }

    setSubmitting(true);
    try {
      await blockDates(
        listingId,
        format(selectedRange.from, 'yyyy-MM-dd'),
        format(selectedRange.to, 'yyyy-MM-dd')
      );
      toast.success('Dates blocked successfully');
      setSelectedRange(undefined);
      loadAvailability();
    } catch (err: unknown) {
      const message = (err as any).response?.data?.message || 'Failed to block dates';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnblock = async (blockId: string) => {
    try {
      await unblockDates(listingId, blockId);
      toast.success('Dates unblocked');
      loadAvailability();
    } catch {
      toast.error('Failed to unblock dates');
    }
  };

  // Convert blocked ranges to disabled dates for the picker
  const disabledDays = blockedRanges.map(range => ({
    from: new Date(range.startDate),
    to: new Date(range.endDate)
  }));

  const today = startOfDay(new Date());

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="font-bold text-gray-900">Manage Availability</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center border rounded-2xl p-4 bg-gray-50/50">
            <DayPicker
              mode="range"
              selected={selectedRange}
              onSelect={setSelectedRange}
              disabled={[{ before: today }, ...disabledDays]}
              footer={
                <div className="mt-4 pt-4 border-t w-full">
                  {selectedRange?.from && selectedRange?.to ? (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-gray-600">
                        Selected: <span className="text-gray-900 font-bold">{format(selectedRange.from, 'MMM d')} - {format(selectedRange.to, 'MMM d')}</span>
                      </p>
                      <button
                        onClick={handleBlockDates}
                        disabled={submitting}
                        className="w-full py-2.5 gradient-teal text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        Block Selected Dates
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Select a range on the calendar to block dates.</p>
                  )}
                </div>
              }
              styles={{
                caption: { color: '#111827', fontWeight: '700' },
                head_cell: { color: '#6b7280', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' },
              }}
              modifiersStyles={{
                selected: { backgroundColor: '#111827', color: 'white' },
                today: { color: 'var(--primary)', fontWeight: 'bold' }
              }}
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Currently Blocked</h4>
            {blockedRanges.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed">
                <p className="text-xs text-gray-400">No dates are currently blocked.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {blockedRanges.map((range, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {format(new Date(range.startDate), 'MMM d')} - {format(new Date(range.endDate), 'MMM d, yyyy')}
                      </p>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${range.reason === 'BOOKING' ? 'text-blue-600' : 'text-amber-600'}`}>
                        {range.reason}
                      </span>
                    </div>
                    {range.reason === 'MANUAL' && range.id && (
                      <button
                        onClick={() => handleUnblock(range.id!)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
