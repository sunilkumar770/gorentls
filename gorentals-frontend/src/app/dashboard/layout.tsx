'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  MessageSquare, 
  User, 
  Settings, 
  BarChart3, 
  Bell, 
  Menu, 
  X,
  Search,
  LogOut,
  ChevronRight
} from 'lucide-react';

const RENTER_NAV = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'My Bookings', icon: Package, href: '/dashboard/bookings' },
  { name: 'Messages', icon: MessageSquare, href: '/dashboard/messages' },
  { name: 'Profile', icon: User, href: '/dashboard/profile' },
  { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

const OWNER_NAV = [
  { name: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
  { name: 'My Listings', icon: Package, href: '/dashboard/listings' },
  { name: 'Bookings', icon: LayoutDashboard, href: '/owner/bookings' },
  { name: 'Messages', icon: MessageSquare, href: '/dashboard/messages' },
  { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userRole] = useState<'RENTER' | 'OWNER'>('RENTER'); // MOCK role
  const pathname = usePathname();
  
  const navItems = userRole === 'OWNER' ? OWNER_NAV : RENTER_NAV;

  return (
    <div className="min-h-screen bg-subtle flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 bg-card flex-col sticky top-0 h-screen shadow-sm shadow-slate-100/50">
        <div className="p-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#4F46E5] rounded-xl flex items-center justify-center">
              <div className="w-4 h-4 bg-card rounded-full" />
            </div>
            <span className="text-xl font-bold text-text tracking-tight">GoRentals</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all group ${
                  isActive 
                    ? 'bg-indigo-50 text-[#4F46E5]' 
                    : 'text-muted hover:bg-subtle hover:text-text'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-[#4F46E5]' : 'text-faint group-hover:text-muted'}`} />
                {item.name}
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-[#4F46E5] rounded-full" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className="p-4 bg-subtle rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#4F46E5] rounded-2xl flex items-center justify-center text-white font-bold">JD</div>
              <div>
                <p className="text-sm font-bold text-text">John Doe</p>
                <p className="text-xs text-faint">Premium Renter</p>
              </div>
            </div>
            <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-card border-2 border-border/50 text-muted rounded-xl text-xs font-bold hover:bg-subtle transition-colors">
              <LogOut className="w-3.5 h-3.5" />Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed top-0 bottom-0 left-0 w-80 bg-card z-[101] transition-transform duration-300 lg:hidden ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#4F46E5] rounded-xl flex items-center justify-center">
              <div className="w-4 h-4 bg-card rounded-full" />
            </div>
            <span className="text-xl font-bold text-text tracking-tight">GoRentals</span>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-subtle rounded-xl">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>
        <nav className="px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-semibold ${
                pathname === item.href ? 'bg-indigo-50 text-[#4F46E5]' : 'text-muted'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-card px-4 lg:px-10 flex items-center justify-between sticky top-0 z-40 shadow-sm shadow-slate-100/50">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 bg-subtle rounded-xl mr-4"
          >
            <Menu className="w-6 h-6 text-muted" />
          </button>

          <div className="hidden md:flex items-center gap-3 flex-1 max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
            <input 
              placeholder="Search bookings, items, or help..."
              className="w-full h-11 pl-11 pr-4 bg-subtle rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative w-11 h-11 bg-subtle rounded-2xl flex items-center justify-center text-muted hover:bg-subtle transition-colors">
              <Bell className="w-5 h-5" />
              <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />
            </button>
            <div className="h-8 w-px bg-subtle mx-1 hidden sm:block" />
            <div className="flex items-center gap-3 pl-1">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-text leading-tight">John Doe</p>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Premium</p>
              </div>
              <div className="w-11 h-11 bg-indigo-100 rounded-2xl flex items-center justify-center text-[#4F46E5] font-bold">JD</div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
