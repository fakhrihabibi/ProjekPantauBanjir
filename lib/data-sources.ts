export type DashboardDataSource = {
  key: string;
  label: string;
  origin: string;
  note: string;
};

export const dashboardDataSources: DashboardDataSource[] = [
  {
    key: 'table-data',
    label: 'Tabel titik rawan',
    origin: 'Data contoh internal aplikasi',
    note: 'Saat ini diisi dari array sampleData pada halaman data.',
  },
  {
    key: 'monthly-rainfall',
    label: 'Curah hujan bulanan',
    origin: 'Data simulasi internal',
    note: 'Masih memakai dataset hardcoded di komponen grafik.',
  },
  {
    key: 'yearly-frequency',
    label: 'Frekuensi banjir tahunan',
    origin: 'Data simulasi internal',
    note: 'Masih memakai dataset hardcoded di komponen grafik.',
  },
  {
    key: 'water-gauge',
    label: 'Indikator tinggi air',
    origin: 'Simulasi tampilan',
    note: 'Gauge saat ini hanya ilustrasi nilai, belum terhubung sensor atau API eksternal.',
  },
];
