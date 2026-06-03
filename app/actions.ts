'use server';

import { cookies } from 'next/headers';
import { reportFormSchema, ReportFormData } from '@/lib/schemas';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import { isWithinBojongsoangBounds } from '@/lib/map-config';
import { classifyFloodSeverityByHeight } from '@/lib/flood-severity';

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
    const tingkatKeparahan = classifyFloodSeverityByHeight(validatedData.tinggiGenanganCm);

    if (!validatedData.fotoUrl?.trim()) {
      return {
        success: false,
        message: 'Validasi data gagal',
        error: 'Foto kejadian wajib diunggah.',
      };
    }

    if (validatedData.latitude === undefined || validatedData.longitude === undefined) {
      return {
        success: false,
        message: 'Validasi data gagal',
        error: 'Titik koordinat lokasi wajib ditandai di peta.',
      };
    }

    const hasKoordinat =
      validatedData.latitude !== undefined && validatedData.longitude !== undefined;

    if (
      hasKoordinat &&
      !isWithinBojongsoangBounds(validatedData.latitude!, validatedData.longitude!)
    ) {
      return {
        success: false,
        message: 'Koordinat berada di luar area Bojongsoang',
        error: 'Titik lokasi harus berada di dalam area Bojongsoang.',
      };
    }

    const session = await getCurrentSession();

    // Generate a unique ID
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;

    // Insert into database using raw SQL (required because koordinat uses Unsupported PostGIS type)
    if (hasKoordinat) {
      await prisma.$executeRaw`
        INSERT INTO "laporan_warga" (
          id,
          "namaPelapor",
          "nomorTelepon",
          lokasi,
          "tingkatKeparahan",
          "tinggiGenanganCm",
          "deskripsiKejadian",
          "fotoUrl",
          "coordinateSource",
          koordinat,
          status,
          "userId",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${id},
          ${validatedData.namaPelapor},
          ${validatedData.nomorTelepon ?? null},
          ${validatedData.lokasi},
          ${tingkatKeparahan},
          ${validatedData.tinggiGenanganCm},
          ${validatedData.deskripsi},
          ${validatedData.fotoUrl ?? null},
          ${validatedData.coordinateSource ?? 'manual_pin'},
          ST_SetSRID(ST_Point(${validatedData.longitude}, ${validatedData.latitude}), 4326),
          'Menunggu Verifikasi',
          ${session?.role === 'USER' ? session.userId : null},
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
          "tinggiGenanganCm",
          "deskripsiKejadian",
          "fotoUrl",
          "coordinateSource",
          status,
          "userId",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${id},
          ${validatedData.namaPelapor},
          ${validatedData.nomorTelepon ?? null},
          ${validatedData.lokasi},
          ${tingkatKeparahan},
          ${validatedData.tinggiGenanganCm},
          ${validatedData.deskripsi},
          ${validatedData.fotoUrl ?? null},
          ${validatedData.coordinateSource ?? null},
          'Menunggu Verifikasi',
          ${session?.role === 'USER' ? session.userId : null},
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
