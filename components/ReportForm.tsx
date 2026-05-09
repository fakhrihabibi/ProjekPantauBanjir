'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reportFormSchema, ReportFormData } from '@/lib/schemas';
import { submitFloodReport } from '@/app/actions';
import { toast } from 'sonner';
import { Upload, X, AlertCircle, CheckCircle, MapPin, Search, Loader2 } from 'lucide-react';

function getLocalDateTimeValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export function ReportForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    watch,
    setValue,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    mode: 'onChange',
    defaultValues: {
      namaPelapor: '',
      nomorTelepon: '',
      lokasi: '',
      deskripsi: '',
      tingkatKeparahan: undefined,
      tanggalWaktu: getLocalDateTimeValue(),
      fotoDeskripsi: '',
      latitude: undefined,
      longitude: undefined,
    },
  });

  const tingkatKeparahan = watch('tingkatKeparahan');

  // Initialize Leaflet map for location picking
  useEffect(() => {
    if (!showMap) return;

    let map: any = null;

    const initMap = async () => {
      const L = await import('leaflet');

      // Fix default icon paths
      const iconProto = L.Icon.Default.prototype as any;
      delete iconProto._getIconUrl;
      
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const container = document.getElementById('laporan-map');
      if (!container) return;

      map = L.map('laporan-map').setView([-6.974, 107.6303], 15);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      let marker: any = null;

      // Restore existing marker if any
      if (markerPos) {
        marker = L.marker([markerPos.lat, markerPos.lng]).addTo(map);
        marker.bindPopup('Lokasi laporan').openPopup();
        markerRef.current = marker;
        map.setView([markerPos.lat, markerPos.lng], 16);
      }

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        if (marker) marker.remove();
        marker = L.marker([lat, lng]).addTo(map!);
        marker.bindPopup('Lokasi laporan').openPopup();
        markerRef.current = marker;
        setMarkerPos({ lat, lng });
        setValue('latitude', lat);
        setValue('longitude', lng);
      });
    };

    const timeout = setTimeout(initMap, 100);

    return () => {
      clearTimeout(timeout);
      if (map) {
        map.remove();
        map = null;
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap]);

  // Function to search address and get coordinates (Geocoding)
  const cariLokasi = async () => {
    const alamat = watch('lokasi');
    if (!alamat || alamat.length < 5) {
      toast.error('Masukkan alamat yang lebih spesifik');
      return;
    }

    try {
      setIsGeocoding(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(alamat)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);

        setMarkerPos({ lat: newLat, lng: newLng });
        setValue('latitude', newLat);
        setValue('longitude', newLng);
        setShowMap(true);

        // Move map if already initialized
        if (mapRef.current) {
          mapRef.current.setView([newLat, newLng], 16);
          
          const L = await import('leaflet');
          if (markerRef.current) {
            markerRef.current.remove();
          }
          
          const newMarker = L.marker([newLat, newLng]).addTo(mapRef.current);
          newMarker.bindPopup('Lokasi ditemukan').openPopup();
          markerRef.current = newMarker;
        }
        
        toast.success('Lokasi ditemukan!');
      } else {
        toast.error('Alamat tidak ditemukan di peta');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Gagal mencari lokasi');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Hanya file gambar yang diperbolehkan');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 5MB');
      return;
    }

    setUploadedFile(file);
    setUploadError(null);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadError(null);
  };

  const onSubmit = async (data: ReportFormData) => {
    try {
      setIsSubmitting(true);

      // Upload foto first if there is a file
      let fotoUrl: string | undefined;
      if (uploadedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', uploadedFile);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok || !uploadResult.success) {
          toast.error('❌ Gagal Upload Foto', {
            description: uploadResult.error ?? 'Coba lagi nanti',
            duration: 4000,
          });
          setIsSubmitting(false);
          return;
        }
        fotoUrl = uploadResult.url as string;
      }

      // Submit the form with fotoUrl
      const response = await submitFloodReport({ ...data, fotoUrl });

      if (response.success) {
        toast.success('✅ Laporan Berhasil Dikirim!', {
          description: `ID Laporan: ${response.reportId}`,
          duration: 5000,
        });

        // Reset form
        reset();
        setUploadedFile(null);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast.error('❌ Gagal Mengirim Laporan', {
          description: response.error || response.message,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('❌ Terjadi Kesalahan', {
        description: 'Silakan coba lagi nanti',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityColor = (severity: string | undefined) => {
    switch (severity) {
      case 'Rendah':
        return 'border-green-500 bg-green-50';
      case 'Sedang':
        return 'border-yellow-500 bg-yellow-50';
      case 'Parah':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Nama Pelapor */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Nama Pelapor <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Masukkan nama lengkap Anda"
          {...register('namaPelapor')}
          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition ${
            errors.namaPelapor
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-white'
          }`}
        />
        {errors.namaPelapor && (
          <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.namaPelapor.message}
          </p>
        )}
      </div>

      {/* Grid Row: Nomor Telepon + Tanggal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nomor Telepon */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Nomor Telepon <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            placeholder="08xx-xxxx-xxxx"
            {...register('nomorTelepon')}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition ${
              errors.nomorTelepon
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 bg-white'
            }`}
          />
          {errors.nomorTelepon && (
            <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.nomorTelepon.message}
            </p>
          )}
        </div>

        {/* Tanggal dan Waktu */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Tanggal dan Waktu
          </label>
          <input
            type="datetime-local"
            {...register('tanggalWaktu')}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition bg-white"
          />
        </div>
      </div>

      {/* Lokasi */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Lokasi Banjir <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Contoh: Jl. Raya Bojongsoang, dekat Simpang Tiga"
            {...register('lokasi')}
            className={`flex-1 px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition ${
              errors.lokasi
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 bg-white'
            }`}
          />
          <button
            type="button"
            onClick={cariLokasi}
            disabled={isGeocoding}
            className="px-4 py-2 bg-blue-50 text-blue-600 border-2 border-blue-200 rounded-lg font-medium hover:bg-blue-100 transition flex items-center gap-2 whitespace-nowrap"
            title="Cari koordinat berdasarkan alamat"
          >
            {isGeocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Cari di Peta
          </button>
        </div>
        {errors.lokasi && (
          <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.lokasi.message}
          </p>
        )}
      </div>

      {/* Tingkat Keparahan */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Tingkat Keparahan <span className="text-red-500">*</span>
        </label>
        <div
          className={`border-2 rounded-lg overflow-hidden transition ${getSeverityColor(
            tingkatKeparahan
          )}`}
        >
          <select
            {...register('tingkatKeparahan')}
            className={`w-full px-4 py-3 bg-transparent focus:outline-none cursor-pointer font-medium ${
              tingkatKeparahan === 'Rendah'
                ? 'text-green-700'
                : tingkatKeparahan === 'Sedang'
                  ? 'text-yellow-700'
                  : tingkatKeparahan === 'Parah'
                    ? 'text-red-700'
                    : 'text-gray-700'
            }`}
          >
            <option value="">Pilih tingkat keparahan...</option>
            <option value="Rendah">Rendah - Genangan air, tidak mengganggu aktivitas</option>
            <option value="Sedang">Sedang - Genangan sedang, hambatan aktivitas</option>
            <option value="Parah">Parah - Genangan tinggi, berbahaya bagi jiwa</option>
          </select>
        </div>
        {errors.tingkatKeparahan && (
          <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.tingkatKeparahan.message}
          </p>
        )}
      </div>

      {/* Deskripsi Kejadian */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Deskripsi Kejadian <span className="text-red-500">*</span>
        </label>
        <textarea
          placeholder="Jelaskan kondisi banjir, dampak, dan kerusakan yang terjadi... (minimal 20 karakter)"
          rows={5}
          {...register('deskripsi')}
          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition resize-none ${
            errors.deskripsi
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-white'
          }`}
        />
        {errors.deskripsi && (
          <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.deskripsi.message}
          </p>
        )}
      </div>

      {/* File Upload - Foto Kejadian */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Foto Kejadian (Opsional)
        </label>

        {!uploadedFile ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary hover:bg-blue-50 transition cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">
                Klik atau seret foto ke sini
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Hanya gambar, max 5MB
              </p>
            </label>
          </div>
        ) : (
          <div className="border-2 border-green-300 bg-green-50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-gray-600">
                  {(uploadedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="text-red-600 hover:text-red-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {uploadError && (
          <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {uploadError}
          </p>
        )}

        {uploadedFile && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mt-3 mb-2">
              Deskripsi Foto (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Banjir di depan rumah warga"
              {...register('fotoDeskripsi')}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
          </div>
        )}
      </div>

      {/* Tandai Lokasi di Peta */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Tandai Lokasi di Peta (Opsional)
        </label>
        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-blue-300 text-blue-700 text-sm font-medium hover:border-blue-500 hover:bg-blue-50 transition mb-3"
        >
          <MapPin className="w-4 h-4" />
          {showMap ? 'Tutup Peta' : 'Buka Peta untuk Tandai Lokasi'}
        </button>

        {markerPos && (
          <p className="text-xs text-green-700 font-medium mb-2 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Lokasi ditandai: {markerPos.lat.toFixed(6)}, {markerPos.lng.toFixed(6)}
            <button
              type="button"
              onClick={() => {
                setMarkerPos(null);
                setValue('latitude', undefined);
                setValue('longitude', undefined);
              }}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              <X className="w-3 h-3" />
            </button>
          </p>
        )}

        {showMap && (
          <div
            id="laporan-map"
            className="w-full rounded-xl border-2 border-blue-200 overflow-hidden cursor-crosshair"
            style={{ height: '280px' }}
          />
        )}
        {showMap && (
          <p className="text-xs text-gray-500 mt-1">Klik di peta untuk menandai lokasi banjir</p>
        )}
        <input type="hidden" {...register('latitude')} />
        <input type="hidden" {...register('longitude')} />
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 pt-6">
        <button
          type="submit"
          disabled={isSubmitting || !isDirty || !isValid}
          className={`flex-1 px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
            isSubmitting || !isDirty || !isValid
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-success text-white hover:bg-green-600 active:scale-95'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Mengirim...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Kirim Laporan
            </>
          )}
        </button>
        <button
          type="reset"
          onClick={() => {
            reset();
            setUploadedFile(null);
            setUploadError(null);
            setMarkerPos(null);
            setShowMap(false);
          }}
          disabled={!isDirty || isSubmitting}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            !isDirty || isSubmitting
              ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
              : 'bg-gray-300 text-gray-900 hover:bg-gray-400 active:scale-95'
          }`}
        >
          Reset
        </button>
      </div>

      {/* Form Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <h4 className="font-semibold text-gray-900 mb-2">ℹ️ Informasi Penting</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>✓ Semua riwayat laporan dapat ditinjau oleh koordinator banjir setempat</li>
          <li>✓ Verifikasi laporan dilakukan dalam 24 jam kerja</li>
          <li>✓ Laporan valid akan ditampilkan di halaman data dan peta</li>
          <li>✓ Terima kasih atas kontribusi Anda dalam sistem peringatan dini ini</li>
        </ul>
      </div>
    </form>
  );
}
