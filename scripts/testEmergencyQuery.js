// scripts/testEmergencyQuery.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const centerLng = parseFloat(process.env.CENTER_LNG || '107.6303');
const centerLat = parseFloat(process.env.CENTER_LAT || '-6.9740');
const radius = parseFloat(process.env.RADIUS || '1000');
const hours = parseInt(process.env.HOURS || '24', 10);

(async () => {
  try {
    console.log('Running emergency-query test with:');
    console.log({ centerLng, centerLat, radius, hours });

    const totalSql = `
      SELECT COUNT(*)::int AS count
      FROM "laporan_warga" lw
      WHERE lw.status = 'Terverifikasi'
        AND lw."createdAt" >= NOW() - INTERVAL '${hours} hours'
    `;
    const total = await prisma.$queryRawUnsafe(totalSql);
    console.log('total verified:', total?.[0]?.count ?? 0);

    const nearbySql = `
      SELECT COUNT(*)::int AS count
      FROM "laporan_warga" lw
      WHERE lw.status = 'Terverifikasi'
        AND lw.koordinat IS NOT NULL
        AND ST_DWithin(lw.koordinat::geography, ST_SetSRID(ST_Point(${centerLng}, ${centerLat}),4326)::geography, ${radius})
        AND lw."createdAt" >= NOW() - INTERVAL '${hours} hours'
    `;
    const nearby = await prisma.$queryRawUnsafe(nearbySql);
    console.log('nearby verified (raw query):', nearby?.[0]?.count ?? 0);

    const reportsSql = `
      SELECT lw.id, lw.status, lw."createdAt", lw."tingkatRisiko" AS severity,
             ST_Y(lw.koordinat::geometry) AS latitude, ST_X(lw.koordinat::geometry) AS longitude, lw."fotoUrl"
      FROM "laporan_warga" lw
      WHERE lw.status = 'Terverifikasi'
        AND lw.koordinat IS NOT NULL
        AND ST_DWithin(lw.koordinat::geography, ST_SetSRID(ST_Point(${centerLng}, ${centerLat}),4326)::geography, ${radius})
        AND lw."createdAt" >= NOW() - INTERVAL '${hours} hours'
      ORDER BY lw."createdAt" DESC
      LIMIT 10
    `;
    const reports = await prisma.$queryRawUnsafe(reportsSql);
    console.log('reports (raw query):', reports);
  } catch (err) {
    console.error('Error running emergency test queries:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
