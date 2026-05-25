import { WeatherWidget } from '@/components/weather/WeatherWidget';
import Link from 'next/link';
import { MapPin, BookOpen, Database, AlertCircle, ArrowRight } from 'lucide-react';

export default function Home() {
  const features = [
    {
      title: 'Peta Interaktif',
      description: 'Lihat titik rawan banjir di Bojongsoang secara real-time.',
      href: '/peta',
      icon: MapPin,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Edukasi Banjir',
      description: 'Pelajari tips dan panduan menghadapi situasi darurat banjir.',
      href: '/edukasi',
      icon: BookOpen,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Dashboard Data',
      description: 'Akses statistik dan data historis banjir wilayah Bojongsoang.',
      href: '/data',
      icon: Database,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Laporan Warga',
      description: 'Laporkan kejadian banjir untuk membantu pemetaan publik.',
      href: '/laporan',
      icon: AlertCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  ];

  return (
    <div className="page-shell space-y-8 sm:space-y-10 py-6 sm:py-8">
      <section className="page-header">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div className="space-y-1 sm:space-y-2">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-brand-600">Sistem Informasi Geografis</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950">
              Selamat Datang
            </h1>
            <p className="text-base sm:text-xl font-medium text-slate-500 max-w-2xl leading-relaxed">
              Monitoring, Pemetaan, dan Mitigasi Resiko Banjir Terintegrasi untuk Masyarakat Bojongsoang.
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="flex -space-x-3 overflow-hidden p-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-white bg-slate-200" />
              ))}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white ring-2 ring-white">
                +99
              </div>
            </div>
            <p className="mt-2 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Pengguna Aktif</p>
          </div>
        </div>
      </section>
      
      <div className="max-w-4xl">
        <WeatherWidget />
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link 
              key={feature.href} 
              href={feature.href}
              className="group surface-card p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-200/50 hover:border-brand-300"
            >
              <div>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${feature.bg} ${feature.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <Icon className="w-5 sm:w-6 h-5 sm:h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1.5 sm:mb-2">{feature.title}</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-500">
                  {feature.description}
                </p>
              </div>
              <div className="mt-6 sm:mt-8 flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-600 group-hover:text-brand-700">
                Buka Layanan
                <ArrowRight className="w-3 sm:w-3.5 h-3 sm:h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </section>

      <section className="surface-card overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] border-none bg-slate-900 text-white shadow-2xl">
        <div className="grid lg:grid-cols-2 gap-0">
          <div className="p-6 sm:p-12 lg:p-16 flex flex-col justify-center space-y-4 sm:space-y-6">
            <div className="inline-flex w-fit rounded-full bg-brand-500/20 px-3 sm:px-4 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">
              Tentang Sistem
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight">
              Teknologi Cerdas untuk Keselamatan
            </h2>
            <p className="text-slate-400 leading-relaxed text-sm sm:text-lg">
              Sistem identifikasi dan pemantauan area rentan banjir dengan pemetaan geografis terkini untuk meningkatkan kesiapsiagaan masyarakat.
            </p>
            <div className="pt-2 sm:pt-4 grid grid-cols-2 gap-4 sm:gap-8">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-brand-400">100%</p>
                <p className="text-[9px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">Gratis</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-brand-400">Real-time</p>
                <p className="text-[9px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">Update</p>
              </div>
            </div>
          </div>
          <div className="relative hidden lg:block bg-gradient-to-br from-brand-600 to-brand-800">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            {/* Visual element placeholder */}
            <div className="absolute inset-0 flex items-center justify-center p-12">
               <div className="w-full aspect-square rounded-full border-[20px] border-white/10 flex items-center justify-center relative">
                  <div className="w-3/4 aspect-square rounded-full border-[10px] border-white/5 animate-pulse" />
                  <MapPin className="w-24 h-24 text-white absolute" />
               </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
