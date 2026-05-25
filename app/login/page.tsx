import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Login | PantauBanjir',
  description: 'Masuk ke akun PantauBanjir',
};

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
    role?: string | string[];
  }>;
};

function resolveNextPath(nextValue: string | string[] | undefined) {
  const rawValue = Array.isArray(nextValue) ? nextValue[0] : nextValue;

  if (rawValue && rawValue.startsWith('/')) {
    return rawValue;
  }

  return '/';
}

function resolveRole(roleValue: string | string[] | undefined) {
  const rawValue = Array.isArray(roleValue) ? roleValue[0] : roleValue;
  return rawValue?.toLowerCase() === 'admin' ? 'ADMIN' : 'USER';
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = resolveNextPath(resolvedSearchParams?.next);
  const initialRole = resolveRole(resolvedSearchParams?.role);

  return <LoginForm nextPath={nextPath} initialRole={initialRole} />;
}
