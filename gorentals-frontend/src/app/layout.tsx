import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });

export const metadata: Metadata = {
  title: 'GoRentals — Rent Anything, Anywhere',
  description: 'Skip the purchase. Rent high-quality gear, electronics, and tools from verified locals in your city.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${manrope.variable} font-sans min-h-screen flex flex-col bg-[#fff8f6] text-[#251913] antialiased`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1 pt-16 flex flex-col">
            {children}
          </main>
          <Footer />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
