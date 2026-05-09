import type { Metadata } from 'next';
import { RegisterForm } from './RegisterForm';

export const metadata: Metadata = {
  title: 'Register | PantauBanjir',
  description: 'Buat akun PantauBanjir',
};

type RegisterPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
  }>;
};

function resolveNextPath(nextValue: string | string[] | undefined) {
  const rawValue = Array.isArray(nextValue) ? nextValue[0] : nextValue;

  if (rawValue && rawValue.startsWith('/')) {
    return rawValue;
  }

  return '/';
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = resolveNextPath(resolvedSearchParams?.next);

  return <RegisterForm nextPath={nextPath} />;
}
