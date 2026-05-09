'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  MapPin,
  BookOpen,
  Database,
  AlertCircle,
  Menu,
  X,
  User,
  Shield,
  LogOut,
  LogIn,
  UserPlus,
} from 'lucide-react';
import type { SessionUser } from '@/lib/session';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Peta',
    href: '/peta',
    icon: <MapPin className="w-5 h-5" />,
  },
  {
    label: 'Edukasi',
    href: '/edukasi',
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    label: 'Data',
    href: '/data',
    icon: <Database className="w-5 h-5" />,
  },
  {
    label: 'Laporan',
    href: '/laporan',
    icon: <AlertCircle className="w-5 h-5" />,
  },
];

type NavigationProps = {
  initialUser: SessionUser | null;
};

export function Navigation({ initialUser }: NavigationProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(initialUser);
  const pathname = usePathname() ?? '';

  if (!pathname || pathname.startsWith('/admin')) {
    return null;
  }

  useEffect(() => {
    setCurrentUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          cache: 'no-store',
        });

        if (!response.ok) {
          return;
        }

        const result = await response.json();

        if (!active) {
          return;
        }

        setCurrentUser(result.user ?? null);
      } catch {
        if (active) {
          setCurrentUser(null);
        }
      }
    };

    loadSession();

    return () => {
      active = false;
    };
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const brand = (
    <Link href="/" className="group flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-brand-200/70">
        <Image
          src="/images/logo.png"
          alt="Logo PantauBanjir"
          width={36}
          height={36}
          className="h-9 w-9 object-contain"
          priority
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-900">PantauBanjir</p>
        <p className="text-xs text-brand-800/80">Pemetaan Titik Rawan Banjir</p>
      </div>
    </Link>
  );

  const authLinks = currentUser ? (
    <div className="space-y-2">
      <div className="rounded-2xl border border-brand-200 bg-white px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {currentUser.role === 'ADMIN' ? 'Admin Aktif' : 'Akun Saya'}
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-brand-950">{currentUser.name}</p>
        <p className="truncate text-xs text-brand-700">{currentUser.email}</p>
      </div>
      {currentUser.role === 'USER' ? (
        <Link
          href="/riwayat-laporan"
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
            isActive('/riwayat-laporan')
              ? 'bg-brand-700 text-brand-100'
              : 'bg-white text-brand-900 hover:bg-brand-50'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Riwayat Laporan</span>
        </Link>
      ) : (
        <Link
          href="/admin/dashboard"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-medium text-brand-900 transition-colors hover:bg-brand-50"
        >
          <Shield className="h-4 w-4" />
          <span>Admin Dashboard</span>
        </Link>
      )}
      <form action="/api/auth/logout" method="post">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl border border-brand-200 bg-brand-100 px-4 py-3 text-sm font-medium text-brand-900 transition-colors hover:bg-brand-200"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </form>
    </div>
  ) : (
    <div className="space-y-2">
      <Link
        href="/login"
        onClick={() => setSidebarOpen(false)}
        className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-medium text-brand-900 transition-colors hover:bg-brand-50"
      >
        <LogIn className="h-4 w-4" />
        <span>Masuk</span>
      </Link>
      <Link
        href="/register"
        onClick={() => setSidebarOpen(false)}
        className="flex items-center gap-3 rounded-xl bg-brand-700 px-4 py-3 text-sm font-medium text-brand-100 transition-colors hover:bg-brand-800"
      >
        <UserPlus className="h-4 w-4" />
        <span>Daftar</span>
      </Link>
      <Link
        href="/admin/login"
        onClick={() => setSidebarOpen(false)}
        className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-100 px-4 py-3 text-sm font-medium text-brand-900 transition-colors hover:bg-brand-200"
      >
        <Shield className="h-4 w-4" />
        <span>Login Admin</span>
      </Link>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden bg-brand-500 border-b border-brand-700 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-4">
          {brand}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-brand-600/80 rounded-lg"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-brand-100 border-r border-brand-200 transition-transform duration-300 ease-in-out z-40 lg:sticky lg:top-0 lg:h-screen ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-brand-200 hidden lg:block">
          {brand}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-4">
          <ul className="space-y-2">
            <li>
              <Link
                href="/"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  pathname === '/'
                    ? 'bg-brand-700 text-brand-100'
                    : 'text-brand-900 hover:bg-brand-100'
                }`}
              >
                <span>Beranda</span>
              </Link>
            </li>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-brand-700 text-brand-100'
                      : 'text-brand-900 hover:bg-brand-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-4 pb-4">
          {authLinks}
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-brand-200">
          <p className="text-xs text-brand-700 text-center">
            PantauBanjir © 2025
          </p>
        </div>
      </aside>
    </>
  );
}
