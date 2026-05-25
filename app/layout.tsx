import type { Metadata } from 'next';
import { Navigation } from '@/components/ui/Navigation';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { getCurrentUser } from '@/lib/auth';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'PantauBanjir - Monitoring Banjir Bojongsoang',
    template: '%s | PantauBanjir',
  },
  description: 'Platform pemetaan, monitoring real-time, dan mitigasi risiko banjir terintegrasi untuk masyarakat Bojongsoang, Bandung.',
  keywords: ['banjir', 'bojongsoang', 'monitoring banjir', 'peta banjir', 'bmkg', 'cuaca bandung'],
  authors: [{ name: 'PantauBanjir Team' }],
  creator: 'PantauBanjir Team',
  metadataBase: new URL('https://pantaubanjir-bojongsoang.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://pantaubanjir-bojongsoang.vercel.app',
    title: 'PantauBanjir - Monitoring Banjir Bojongsoang',
    description: 'Pantau kondisi banjir dan cuaca real-time di wilayah Bojongsoang.',
    siteName: 'PantauBanjir',
    images: [
      {
        url: '/images/logo.png', // Pastikan logo ada atau buat image OG khusus
        width: 1200,
        height: 630,
        alt: 'PantauBanjir Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PantauBanjir - Monitoring Banjir Bojongsoang',
    description: 'Pantau kondisi banjir dan cuaca real-time di wilayah Bojongsoang.',
    images: ['/images/logo.png'],
  },
  icons: {
    icon: '/icons/favicon.png',
    shortcut: '/icons/favicon.png',
    apple: '/icons/favicon.png',
  },
  manifest: '/manifest.json',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialUser = await getCurrentUser();

  return (
    <html lang="id">
      <body className="overflow-x-hidden bg-brand-100 text-brand-900">
        <ToastProvider />
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Navigation initialUser={initialUser} />
          <main className="min-w-0 flex-1 overflow-x-hidden">
            <div className="mx-auto w-full max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
