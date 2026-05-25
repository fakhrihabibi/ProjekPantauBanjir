const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const hotspots = [
  {
    nama: 'Kampung Cijagra',
    deskripsi: '[Sumber: BNPB InaRISK] Wilayah masuk Zona Merah Bahaya Tinggi Nasional. Titik pertemuan sungai yang sering menyebabkan akses terputus total.',
    tingkatRisiko: 'Tinggi',
    lat: -6.985,
    lng: 107.632,
  },
  {
    nama: 'Kampung Cigebar',
    deskripsi: '[Sumber: BPBD Kab. Bandung] Lokasi langganan luapan Sungai Citarum. Ketinggian banjir historis mencapai 180cm.',
    tingkatRisiko: 'Tinggi',
    lat: -6.981,
    lng: 107.638,
  },
  {
    nama: 'Desa Tegalluar (Sapan)',
    deskripsi: '[Sumber: BPBD Kab. Bandung] Area pemukiman padat dan pergudangan yang rawan banjir akibat luapan Sungai Cikeruh.',
    tingkatRisiko: 'Tinggi',
    lat: -6.965,
    lng: 107.655,
  },
  {
    nama: 'Terusan Bojongsoang',
    deskripsi: '[Sumber: GIS Analysis] Area cekungan jalan yang sering tergenang air limpasan (run-off) setinggi 40cm saat hujan intensitas tinggi.',
    tingkatRisiko: 'Sedang',
    lat: -6.974,
    lng: 107.630,
  },
  {
    nama: 'Griya Bandung Asri (GBA)',
    deskripsi: '[Sumber: Data Lokal] Titik rawan genangan akibat penurunan fungsi drainase primer dan luapan anak sungai kecil.',
    tingkatRisiko: 'Sedang',
    lat: -6.970,
    lng: 107.640,
  },
];

async function main() {
  console.log('--- Memulai Seeding Data Institusi (Bojongsoang) ---');

  for (const hotspot of hotspots) {
    try {
      // Check if already exists to avoid duplicates
      const existing = await prisma.titikRawan.findFirst({
        where: { nama: hotspot.nama }
      });

      if (existing) {
        console.log(`Skipping: ${hotspot.nama} (Sudah terdaftar)`);
        continue;
      }

      // Insert using Raw SQL for PostGIS geometry
      await prisma.$executeRawUnsafe(`
        INSERT INTO "titik_rawan" (id, nama, deskripsi, "tingkatRisiko", "radiusMeter", koordinat, "createdAt", "updatedAt")
        VALUES (
          'inst_' || gen_random_uuid(),
          '${hotspot.nama}',
          '${hotspot.deskripsi}',
          '${hotspot.tingkatRisiko}',
          100,
          ST_SetSRID(ST_MakePoint(${hotspot.lng}, ${hotspot.lat}), 4326),
          NOW(),
          NOW()
        )
      `);

      console.log(`Success: Menambahkan ${hotspot.nama}`);
    } catch (error) {
      console.error(`Error pada ${hotspot.nama}:`, error.message);
    }
  }

  console.log('--- Seeding Selesai ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
