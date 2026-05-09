import type { Metadata } from 'next';
import { AdminLoginForm } from './AdminLoginForm';

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

  return '/admin/dashboard';
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = resolveNextPath(resolvedSearchParams?.next);

  return <AdminLoginForm nextPath={nextPath} />;
}