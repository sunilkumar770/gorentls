import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import DashboardNav from '@/app/(dashboard)/components/DashboardNav';
import { Footer } from '@/components/layout/Footer';

/**
 * Layout for all protected routes (dashboard, bookings, profile, etc.).
 *
 * Wraps the entire protected tree in an ErrorBoundary so a crash in one
 * child route shows a branded recovery screen instead of a blank page.
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DashboardNav />
      <ErrorBoundary>
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </ErrorBoundary>
      <Footer />
    </div>
  );
}

