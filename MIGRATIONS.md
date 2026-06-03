Migrasi Database — Panduan Cepat

Masalah:
- Aplikasi mengharapkan kolom `tinggiGenanganCm` pada tabel `laporan_warga`. Jika kolom belum ada, permintaan INSERT/PATCH akan gagal.

Solusi singkat:
1) Jalankan migrasi Prisma (direkomendasikan):

   - Pastikan `DATABASE_URL` pada environment Anda mengarah ke database yang benar.
   - Jalankan (bash):

     ```bash
     npx prisma migrate dev --name add-tinggiGenanganCm
     npx prisma generate
     ```

   - Untuk produksi / CI, gunakan:

     ```bash
     npx prisma migrate deploy
     npx prisma generate
     ```

2) Jika Anda tidak bisa menjalankan Prisma, jalankan SQL berikut pada DB Anda (psql/Supabase SQL editor):

   ```sql
   ALTER TABLE "laporan_warga" ADD COLUMN IF NOT EXISTS "tinggiGenanganCm" INTEGER;
   ```

3) Setelah migrasi dijalankan, restart aplikasi / rebuild jika diperlukan.

Skrip bantuan:
- `run-migration.sh` — script bash yang menjalankan `prisma migrate deploy` lalu `prisma generate`.
- `run-migration.ps1` — versi PowerShell.

Catatan keamanan:
- Selalu backup database sebelum menjalankan migrasi di lingkungan produksi.
- Pastikan user DB yang digunakan memiliki hak yang cukup untuk menjalankan ALTER TABLE.

Jika Anda mau, saya dapat membantu menjalankan langkah ini bersama (Anda jalankan perintah di mesin Anda, saya bantu membaca output dan menyelesaikan langkah berikutnya).