import { z } from 'zod';

export const reportFormSchema = z.object({
  namaPelapor: z
    .string()
    .min(3, 'Nama harus minimal 3 karakter')
    .max(100, 'Nama terlalu panjang'),
  nomorTelepon: z
    .string()
    .regex(/^[0-9\+\-\s]+$/, 'Nomor telepon tidak valid')
    .min(10, 'Nomor telepon harus minimal 10 digit'),
  lokasi: z
    .string()
    .min(5, 'Lokasi harus minimal 5 karakter')
    .max(200, 'Lokasi terlalu panjang'),
  deskripsi: z
    .string()
    .min(20, 'Deskripsi harus minimal 20 karakter')
    .max(2000, 'Deskripsi terlalu panjang'),
  tingkatKeparahan: z.enum(['Rendah', 'Sedang', 'Parah'], {
    message: 'Pilih tingkat keparahan yang valid',
  }),
  tanggalWaktu: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || !Number.isNaN(Date.parse(value)),
      'Tanggal dan waktu tidak valid'
    ),
  fotoDeskripsi: z
    .string()
    .max(100, 'Deskripsi foto terlalu panjang')
    .optional(),
  fotoUrl: z
    .string()
    .url('URL foto tidak valid')
    .optional()
    .or(z.literal('')),
  coordinateSource: z
    .enum(['manual_pin', 'geocoded_hint', 'admin_adjusted'])
    .optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type ReportFormData = z.infer<typeof reportFormSchema>;

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

export const registerSchema = loginSchema
  .extend({
    name: z.string().trim().min(3, 'Nama minimal 3 karakter').max(100, 'Nama terlalu panjang'),
    confirmPassword: z.string().min(8, 'Konfirmasi password minimal 8 karakter'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  });
