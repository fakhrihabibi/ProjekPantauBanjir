import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation';
import { ToastProvider } from '@/components/ToastProvider';
import { getCurrentUser } from '@/lib/auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'PantauBanjir',
  description: 'PantauBanjir - Platform pemetaan dan monitoring titik rawan banjir di Bojongsoang',
  icons: {
    icon: '/icons/favicon.png',
    shortcut: '/icons/favicon.png',
    apple: '/icons/favicon.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialUser = await getCurrentUser();

  return (
    <html lang="id">
      <body className="bg-brand-100 text-brand-900">
        <ToastProvider />
        <div className="flex min-h-screen">
          <Navigation initialUser={initialUser} />
          <main className="flex-1 overflow-x-hidden">
            <div className="mx-auto w-full max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
