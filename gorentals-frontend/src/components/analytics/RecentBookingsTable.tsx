import { format } from 'date-fns';
import Link from 'next/link';

export interface RecentBooking {
  id: string;
  listingTitle: string;
  renterName: string;
  amount: number;
  status: string;
  createdAt: string;
}

export function RecentBookingsTable({ bookings }: { bookings: RecentBooking[] }) {
  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden h-full">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Recent Activities</h3>
        <Link href="/owner/bookings" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
          View All
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-6 py-3 font-medium">Listing</th>
              <th className="px-6 py-3 font-medium">Renter</th>
              <th className="px-6 py-3 font-medium">Amount</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                  No recent bookings found
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white truncate max-w-[150px]">
                      {booking.listingTitle}
                    </div>
                    <div className="text-xs text-slate-500">
                      {format(new Date(booking.createdAt), 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{booking.renterName}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-white">₹{booking.amount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${getStatusStyles(booking.status)}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getStatusStyles(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-500/10 text-emerald-400';
    case 'CONFIRMED':
    case 'IN_USE':
      return 'bg-blue-500/10 text-blue-400';
    case 'PENDING_PAYMENT':
      return 'bg-amber-500/10 text-amber-400';
    case 'CANCELLED':
    case 'NO_SHOW':
      return 'bg-rose-500/10 text-rose-400';
    default:
      return 'bg-slate-500/10 text-slate-400';
  }
}
