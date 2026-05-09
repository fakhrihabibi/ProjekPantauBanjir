'use client';

import { useState } from 'react';
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
} from 'lucide-react';

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

export function Navigation() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname() ?? '';

  if (!pathname || pathname.startsWith('/admin')) {
    return null;
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="Logo PantauBanjir"
              width={140}
              height={36}
              className="h-9 w-auto"
              priority
            />
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
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
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out z-40 lg:sticky lg:top-0 lg:h-screen ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 hidden lg:block">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/images/logo.png"
              alt="Logo PantauBanjir"
              width={170}
              height={44}
              className="h-11 w-auto"
              priority
            />
          </Link>
          <p className="text-xs text-gray-600 mt-1">
            Pemetaan Titik Rawan Banjir
          </p>
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
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
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
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            PantauBanjir © 2025
          </p>
        </div>
      </aside>
    </>
  );
}
