'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '../ui/Button';
import { Search, Menu, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { user, isOwner, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#fff8f6]/80 backdrop-blur-xl border-b border-[#251913]/5 shadow-ambient transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-12">
            <Link href="/" className="text-2xl font-display font-black bg-gradient-to-br from-[#f97316] to-[#9d4300] bg-clip-text text-transparent tracking-tighter">
              GoRentals
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href="/search" className="text-sm font-bold text-[#251913] hover:text-[#f97316] transition-colors">
                Browse
              </Link>
              <Link href="/categories" className="text-sm font-bold text-[#251913] hover:text-[#f97316] transition-colors">
                Collections
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/search">
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full text-[#251913] hover:text-[#f97316] hover:bg-[#ffeae0]">
                <Search className="h-5 w-5" />
              </Button>
            </Link>

            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-4">
                    {isOwner && (
                      <Link href="/owner/dashboard">
                        <Button variant="outline" size="sm" className="hidden lg:flex border-[#f97316]/20 text-[#9d4300] hover:bg-[#f97316]/5 rounded-xl font-bold">
                          Manage Hub
                        </Button>
                      </Link>
                    )}
                    <Link href="/dashboard">
                      <Button variant="ghost" size="sm" className="text-[#251913] hover:bg-[#ffeae0] font-bold rounded-xl">Account</Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[#8c7164] hover:text-[#251913] hover:bg-red-50 font-medium rounded-xl">
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Link href="/login">
                      <Button variant="ghost" size="sm" className="text-[#251913] hover:text-[#f97316] font-bold rounded-xl">Sign In</Button>
                    </Link>
                    <Link href="/signup">
                      <Button size="sm" className="gradient-signature text-white shadow-ambient rounded-xl font-bold px-6">Join Now</Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-[#251913] hover:bg-orange-50">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
