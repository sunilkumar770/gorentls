import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

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
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
