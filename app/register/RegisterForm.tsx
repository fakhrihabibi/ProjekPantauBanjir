'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type RegisterFormProps = {
  nextPath: string;
};

export function RegisterForm({ nextPath }: RegisterFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? 'Registrasi gagal.');
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.12),_transparent_25%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.16),_transparent_28%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80 backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
          <section className="flex items-center bg-gradient-to-br from-amber-500 via-orange-500 to-sky-600 p-8 text-white md:p-12 lg:p-14">
            <div className="max-w-md space-y-5">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85">
                Buat Akun
              </div>
              <h1 className="text-3xl font-bold leading-tight md:text-4xl lg:text-[2.75rem]">
                Daftar untuk memantau laporan banjir secara personal
              </h1>
              <p className="text-sm leading-7 text-white/90 md:text-base">
                Akun pengguna menyimpan ownership laporan, memudahkan pelacakan status, dan memberi pengalaman yang lebih terstruktur.
              </p>
            </div>
          </section>

          <section className="flex items-center bg-white p-8 md:p-12 lg:p-14">
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">
                  Create Account
                </p>
                <h2 className="text-2xl font-bold text-slate-900 md:text-[1.75rem]">Register Pengguna</h2>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Nama</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="Nama lengkap"
                  autoComplete="name"
                />
              </label>

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
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Konfirmasi Password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="Ulangi password"
                  autoComplete="new-password"
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Setelah register, Anda akan langsung masuk ke akun.
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-sky-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-sky-500/35 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Memproses...' : 'Daftar'}
              </button>

              <div className="flex items-center justify-between text-sm text-slate-500">
                <Link href="/login" className="transition hover:text-sky-700">
                  Sudah punya akun?
                </Link>
                <Link href="/" className="transition hover:text-sky-700">
                  Kembali
                </Link>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
