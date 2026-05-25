import { NextResponse } from 'next/server';
import { dashboardDataSources } from '@/lib/data-sources';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    source: 'internal-dashboard-config',
    data: dashboardDataSources,
    message:
      'Dashboard saat ini masih memakai data internal aplikasi. Endpoint ini disiapkan agar nanti mudah diganti ke BMKG atau database nyata.',
  });
}