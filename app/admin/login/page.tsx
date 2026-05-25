import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Login Admin | PantauBanjir',
  description: 'Halaman login admin PantauBanjir',
};

type AdminLoginPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
  }>;
};

function resolveNextPath(nextValue: string | string[] | undefined) {
  const rawValue = Array.isArray(nextValue) ? nextValue[0] : nextValue;

  if (rawValue && rawValue.startsWith('/')) {
    return rawValue;
  }

  return '/laporan';
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = resolveNextPath(resolvedSearchParams?.next);
  redirect(`/login?from=admin&role=admin&next=${encodeURIComponent(nextPath)}`);
}