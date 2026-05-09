export default function Home() {
  return (
    <div className="page-shell">
      <section className="page-header">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Selamat Datang
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          PantauBanjir
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="surface-card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <h3 className="text-lg font-semibold text-primary mb-2">Peta</h3>
            <p className="text-gray-600">
              Lihat peta interaktif titik rawan banjir di Bojongsoang
            </p>
          </div>
          <div className="surface-card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <h3 className="text-lg font-semibold text-primary mb-2">Edukasi</h3>
            <p className="text-gray-600">
              Pelajari informasi dan tips penting tentang banjir
            </p>
          </div>
          <div className="surface-card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <h3 className="text-lg font-semibold text-primary mb-2">Data</h3>
            <p className="text-gray-600">
              Akses data historis dan statistik banjir
            </p>
          </div>
          <div className="surface-card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <h3 className="text-lg font-semibold text-primary mb-2">Laporan</h3>
            <p className="text-gray-600">
              Buat dan lihat laporan kejadian banjir real-time
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Tentang Sistem Ini
        </h2>
        <p className="text-gray-600 leading-relaxed">
          Sistem ini dirancang untuk membantu masyarakat Bojongsoang dalam
          mengidentifikasi dan memantau area yang rentan terhadap banjir. Dengan
          teknologi pemetaan geografis terkini, kami menyediakan informasi real-time
          dan data historis untuk meningkatkan kesiapsiagaan dan mitigasi risiko banjir.
        </p>
      </section>
    </div>
  );
}
