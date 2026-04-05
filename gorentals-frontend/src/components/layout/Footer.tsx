import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              GoRentals
            </h3>
            <p className="text-sm text-slate-400">
              Rent anything, anywhere. The secure peer-to-peer rental marketplace.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Discover</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/search" className="hover:text-orange-400 transition-colors">Browse all items</Link></li>
              <li><Link href="/categories" className="hover:text-orange-400 transition-colors">Categories</Link></li>
              <li><Link href="/cities" className="hover:text-orange-400 transition-colors">Cities</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Earn to rent</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/earn" className="hover:text-orange-400 transition-colors">List your item</Link></li>
              <li><Link href="/insurance" className="hover:text-orange-400 transition-colors">Owner protection</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/help" className="hover:text-orange-400 transition-colors">Help Center</Link></li>
              <li><Link href="/terms" className="hover:text-orange-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-orange-400 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} GoRentals. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
