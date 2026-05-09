'use server';

import { reportFormSchema, ReportFormData } from '@/lib/schemas';
import { prisma } from '@/lib/prisma';

export interface SubmitReportResponse {
  success: boolean;
  message: string;
  reportId?: string;
  error?: string;
}

export async function submitFloodReport(
  data: ReportFormData
): Promise<SubmitReportResponse> {
  try {
    // Validate data using zod schema
    const validatedData = reportFormSchema.parse(data);

    // Generate a unique ID
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;

    // Insert into database using raw SQL (required because koordinat uses Unsupported PostGIS type)
    const hasKoordinat =
      validatedData.latitude !== undefined && validatedData.longitude !== undefined;

    if (hasKoordinat) {
      await prisma.$executeRaw`
        INSERT INTO "laporan_warga" (
          id,
          "namaPelapor",
          "nomorTelepon",
          lokasi,
          "tingkatKeparahan",
          "deskripsiKejadian",
          "fotoUrl",
          koordinat,
          status,
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${id},
          ${validatedData.namaPelapor},
          ${validatedData.nomorTelepon ?? null},
          ${validatedData.lokasi},
          ${validatedData.tingkatKeparahan},
          ${validatedData.deskripsi},
          ${validatedData.fotoUrl ?? null},
          ST_SetSRID(ST_Point(${validatedData.longitude}, ${validatedData.latitude}), 4326),
          'Menunggu Verifikasi',
          NOW(),
          NOW()
        )
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO "laporan_warga" (
          id,
          "namaPelapor",
          "nomorTelepon",
          lokasi,
          "tingkatKeparahan",
          "deskripsiKejadian",
          "fotoUrl",
          status,
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${id},
          ${validatedData.namaPelapor},
          ${validatedData.nomorTelepon ?? null},
          ${validatedData.lokasi},
          ${validatedData.tingkatKeparahan},
          ${validatedData.deskripsi},
          ${validatedData.fotoUrl ?? null},
          'Menunggu Verifikasi',
          NOW(),
          NOW()
        )
      `;
    }

    return {
      success: true,
      message: `Laporan berhasil dikirim! ID Laporan: ${id}`,
      reportId: id,
    };
  } catch (error) {
    console.error('Error submitting report:', error);

    // Handle Zod validation errors
    if (error instanceof Error) {
      return {
        success: false,
        message: 'Validasi data gagal',
        error: error.message,
      };
    }

    return {
      success: false,
      message: 'Gagal mengirim laporan. Silakan coba lagi.',
      error: 'Unknown error',
    };
  }
}
