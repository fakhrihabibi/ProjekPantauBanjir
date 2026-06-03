'use server';

import { z } from 'zod';
import { classifyFloodSeverityByHeight } from '@/lib/flood-severity';

const laporanWargaSchema = z.object({
  namaPelapor: z.string().min(3, 'Nama pelapor minimal 3 karakter').max(100),
  tinggiGenanganCm: z.number().int().min(1, 'Tinggi genangan minimal 1 cm').max(1000),
  tingkatKeparahan: z.enum(['Rendah', 'Sedang', 'Tinggi']),
  deskripsiKejadian: z
    .string()
    .min(20, 'Deskripsi kejadian minimal 20 karakter')
    .max(2000, 'Deskripsi kejadian terlalu panjang'),
  fotoUrl: z.string().url('Foto URL harus valid').optional().nullable(),
  titikRawanId: z.string().optional().nullable(),
});

export type LaporanWargaInput = z.infer<typeof laporanWargaSchema>;

export type SubmitLaporanWargaResult = {
  success: boolean;
  message: string;
  data?: LaporanWargaInput;
};

export async function submitLaporanWarga(input: LaporanWargaInput): Promise<SubmitLaporanWargaResult> {
  const validated = laporanWargaSchema.parse(input);
  const tingkatKeparahan = classifyFloodSeverityByHeight(validated.tinggiGenanganCm);

  const prismaReadyPayload = {
    namaPelapor: validated.namaPelapor,
    tinggiGenanganCm: validated.tinggiGenanganCm,
    tingkatKeparahan,
    deskripsiKejadian: validated.deskripsiKejadian,
    fotoUrl: validated.fotoUrl ?? null,
    titikRawanId: validated.titikRawanId ?? null,
  };

  console.log('Validated LaporanWarga payload:', prismaReadyPayload);

  // Ready for Prisma insertion, for example:
  // await prisma.laporanWarga.create({ data: prismaReadyPayload })

  return {
    success: true,
    message: 'Laporan warga tervalidasi dan siap diproses',
    data: prismaReadyPayload,
  };
}
