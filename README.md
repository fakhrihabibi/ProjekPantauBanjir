# Sistem Informasi Pemetaan Titik Rawan Banjir Bojongsoang

Platform web responsif untuk pemetaan, monitoring, dan edukasi tentang titik-titik rawan banjir di Bojongsoang.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS 3
- **UI Components**: shadcn/ui (siap diintegrasikan)
- **Icons**: Lucide-React
- **Language**: TypeScript
- **Database**: PostgreSQL + PostGIS (untuk fase production)
- **Mapping**: Leaflet.js + react-leaflet (akan diintegrasikan di halaman Peta)

## 📋 Fitur Utama

1. **Peta (Peta Interaktif)**
   - Visualisasi titik-titik rawan banjir menggunakan Leaflet
   - Status real-time setiap lokasi
   - Informasi detail per titik

2. **Edukasi**
   - Panduan penanganan banjir
   - Tips persiapan dan evakuasi
   - Sumber informasi penting

3. **Data**
   - Statistik historis banjir
   - Tabel data lokasi rawan
   - Analisis tingkat risiko

4. **Laporan**
   - Form pengajuan laporan banjir
   - Daftar laporan terverifikasi
   - Status real-time kejadian

## 📁 Struktur Proyek

```
├── app/
│   ├── layout.tsx              # Root layout dengan Navigation
│   ├── page.tsx                # Halaman home
│   ├── globals.css             # Global styles
│   ├── peta/
│   │   └── page.tsx            # Halaman peta
│   ├── edukasi/
│   │   └── page.tsx            # Halaman edukasi
│   ├── data/
│   │   └── page.tsx            # Halaman data
│   └── laporan/
│       └── page.tsx            # Halaman laporan
├── components/
│   └── Navigation.tsx          # Sidebar/Top nav (responsive)
├── public/                     # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── postcss.config.js
```

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser.

3. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## 🤖 Konfigurasi Tanya AI

Tambahkan environment variable berikut agar tombol Tanya AI mengambil jawaban real-time:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
```

`GEMINI_MODEL` opsional. Jika tidak diisi, default `gemini-1.5-flash`.

Opsional fallback provider kedua:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

Prioritas provider di route API:
1. Gemini (`GEMINI_API_KEY`)
2. OpenAI (`OPENAI_API_KEY`)

## 🔐 Konfigurasi Admin

Tambahkan environment variable berikut agar login admin aktif:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=rahasia_admin
ADMIN_SESSION_SECRET=isi_secret_panjang_yang_acak
```

Keterangan:
- `ADMIN_USERNAME` opsional, default `admin`
- `ADMIN_PASSWORD` wajib diisi
- `ADMIN_SESSION_SECRET` wajib diisi untuk menandatangani session cookie admin

Rute admin:
- `/admin/login`
- `/admin/dashboard`

## 📱 Responsive Design

- **Mobile**: Hamburger menu dengan sidebar yang dapat dikontrol
- **Tablet**: Sidebar responsif dengan layout adaptif
- **Desktop**: Sidebar tetap dengan konten penuh

## 🔧 Konfigurasi Tailwind

Warna custom sudah dikonfigurasi di `tailwind.config.ts`:
- `primary`: #0ea5e9 (Biru utama)
- `secondary`: #06b6d4 (Biru muda)
- `danger`: #ef4444 (Merah)
- `warning`: #f59e0b (Kuning/Orange)
- `success`: #10b981 (Hijau)

## 🗺️ Integrasi Leaflet (TODO)

Untuk menambahkan peta interaktif di halaman Peta:

1. Install packages:
   ```bash
   npm install leaflet react-leaflet
   npm install -D @types/leaflet
   ```

2. Buat komponen `Map.tsx`:
   ```typescript
   // app/components/Map.tsx
   'use client';

   import dynamic from 'next/dynamic';
   const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
   // ... rest of map setup
   ```

3. Gunakan di halaman peta dengan dynamic import dan `ssr: false`

## 🔒 Security Best Practices

- Input validation pada semua form
- CSRF protection untuk form submission
- Environment variables untuk sensitive data
- Parameterized queries untuk database
- Rate limiting untuk API (akan ditambahkan)

## 📊 Database (PostgreSQL + PostGIS)

Setup struktur akan ditambahkan nanti dengan:
- Spatial data untuk lokasi banjir
- PostGIS functions untuk query geografis
- Migration scripts

## 🤝 Kontribusi

Pastikan mengikuti standar:
- TypeScript strict mode
- Tailwind CSS untuk styling
- Functional components dengan hooks
- Component modularitas

## 📝 License

MIT License - 2024 Bojongsoang Flood Alert System
