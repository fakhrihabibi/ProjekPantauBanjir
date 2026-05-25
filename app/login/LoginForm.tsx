'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type LoginFormProps = {
  nextPath: string;
  initialRole?: LoginRole;
};

type LoginRole = 'USER' | 'ADMIN';

export function LoginForm({ nextPath, initialRole = 'USER' }: LoginFormProps) {
  const router = useRouter();
  const [role, setRole] = useState<LoginRole>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = role === 'ADMIN' ? '/api/admin/login' : '/api/auth/login';
    const redirectPath = role === 'ADMIN' ? '/laporan?from=admin' : nextPath;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? 'Login gagal.');
        return;
      }

      router.replace(redirectPath);
      router.refresh();
    } catch {
      setError('Tidak bisa menghubungi server. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-2rem)] overflow-hidden px-4 py-8 md:px-8 md:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(6,182,212,0.14),_transparent_28%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80 backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
          <section className="flex items-center bg-gradient-to-br from-slate-900 via-sky-800 to-cyan-700 p-8 text-white md:p-12 lg:p-14">
            <div className="max-w-md space-y-5">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85">
                Unified Login
              </div>
              <h1 className="text-3xl font-bold leading-tight md:text-4xl lg:text-[2.75rem]">
                Masuk satu pintu untuk user dan admin
              </h1>
              <p className="text-sm leading-7 text-white/90 md:text-base">
                Pilih peran login terlebih dahulu, lalu lanjutkan dengan email dan password sesuai akun Anda.
              </p>
            </div>
          </section>

          <section className="flex items-center bg-white p-8 md:p-12 lg:p-14">
            <form onSubmit={handleSubmit} className="w-full space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">
                  Welcome Back
                </p>
                <h2 className="text-2xl font-bold text-slate-900 md:text-[1.75rem]">Login</h2>
                <p className="text-sm leading-6 text-slate-600">
                  Gunakan akun sesuai peran yang dipilih.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setRole('USER');
                    setError('');
                  }}
                  className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    role === 'USER'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole('ADMIN');
                    setError('');
                  }}
                  className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    role === 'ADMIN'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Admin
                </button>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="nama@email.com"
                  autoComplete="email"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder={role === 'ADMIN' ? 'Masukkan password admin' : 'Masukkan password'}
                  autoComplete="current-password"
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {role === 'ADMIN'
                    ? 'Mode admin aktif. Gunakan akun admin yang sudah terdaftar.'
                    : 'Belum punya akun? Daftar terlebih dahulu.'}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-sky-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-sky-500/35 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Memproses...' : role === 'ADMIN' ? 'Masuk sebagai Admin' : 'Masuk sebagai User'}
              </button>

              <div className="flex items-center justify-between text-sm text-slate-500">
                {role === 'USER' ? (
                  <Link href="/register" className="transition hover:text-sky-700">
                    Buat akun
                  </Link>
                ) : (
                  <span>Area khusus admin</span>
                )}
                <span>{role === 'ADMIN' ? 'Redirect ke Kelola Laporan' : 'Akun pengguna umum'}</span>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
