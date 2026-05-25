// scripts/checkReports.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const centerLng = parseFloat(process.env.CENTER_LNG || '107.6303');
const centerLat = parseFloat(process.env.CENTER_LAT || '-6.9740');
const hours = parseInt(process.env.HOURS || '24', 10);

(async () => {
  try {
    console.log('Checking laporan_warga (status=Terverifikasi)');

    const totalSql = `
      SELECT COUNT(*)::int AS count
      FROM laporan_warga lw
      WHERE lw.status = 'Terverifikasi'
        AND lw."createdAt" >= NOW() - INTERVAL '${hours} hours'
    `;
    const total = await prisma.$queryRawUnsafe(totalSql);
    console.log('total verified (last', hours, 'hours):', total?.[0]?.count ?? 0);

    const rowsSql = `
      SELECT lw.id, lw.status, lw."createdAt",
             ST_AsText(lw.koordinat::geometry) AS geom_wkt,
             ST_SRID(lw.koordinat::geometry) AS srid,
             ST_X(lw.koordinat::geometry) AS lng,
             ST_Y(lw.koordinat::geometry) AS lat,
             ST_Distance(lw.koordinat::geography, ST_SetSRID(ST_Point(${centerLng}, ${centerLat}),4326)::geography) AS meters_to_center
      FROM laporan_warga lw
      WHERE lw.status = 'Terverifikasi'
        AND lw.koordinat IS NOT NULL
        AND lw."createdAt" >= NOW() - INTERVAL '${hours} hours'
      ORDER BY lw."createdAt" DESC
      LIMIT 50
    `;
    const rows = await prisma.$queryRawUnsafe(rowsSql);

    console.log('sample rows (up to 50):');
    console.table(rows.map(r => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      geom_wkt: r.geom_wkt,
      srid: r.srid,
      lng: r.lng,
      lat: r.lat,
      meters_to_center: r.meters_to_center
    })));
  } catch (err) {
    console.error('Error running DB checks:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
