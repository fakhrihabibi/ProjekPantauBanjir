'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type AdminLoginFormProps = {
  nextPath: string;
};

export function AdminLoginForm({ nextPath }: AdminLoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? 'Login gagal.');
        return;
      }

      router.replace(nextPath);
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
      <div className="pointer-events-none absolute left-8 top-10 h-44 w-44 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-8 right-8 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80 backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
          <section className="flex items-center bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-500 p-8 text-white md:p-12 lg:p-14">
            <div className="max-w-md space-y-6">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85">
                Admin Access
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold leading-tight md:text-4xl lg:text-[2.75rem]">
                  Masuk ke dashboard admin PantauBanjir
                </h1>
                <p className="max-w-[34rem] text-sm leading-7 text-white/90 md:text-base">
                  Area ini dipakai untuk verifikasi laporan, pengelolaan data titik rawan, dan pembaruan informasi operasional.
                </p>
              </div>

              <div className="grid gap-3 text-sm text-white/90 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-sm">
                  Verifikasi laporan warga
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-sm">
                  Kelola titik rawan
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-sm">
                  Update data peta
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-sm">
                  Akses khusus admin
                </div>
              </div>
            </div>
          </section>

          <section className="flex items-center bg-white p-8 md:p-12 lg:p-14">
            <form onSubmit={handleSubmit} className="w-full space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">
                  Secure Login
                </p>
                <h2 className="text-2xl font-bold text-slate-900 md:text-[1.75rem]">Login Admin</h2>
                <p className="text-sm leading-6 text-slate-600">
                  Gunakan kredensial admin yang sudah diset di environment.
                </p>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Username</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="admin"
                  autoComplete="username"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="Masukkan password admin"
                  autoComplete="current-password"
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Login ini hanya untuk admin yang sudah terdaftar.
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-sky-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-sky-500/35 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Memproses...' : 'Masuk ke Dashboard'}
              </button>

              <div className="flex items-center justify-between text-sm text-slate-500">
                <Link href="/" className="transition hover:text-sky-700">
                  Kembali ke beranda
                </Link>
                <span>Hanya untuk admin</span>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}