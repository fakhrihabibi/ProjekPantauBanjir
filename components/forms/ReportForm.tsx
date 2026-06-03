'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reportFormSchema, ReportFormData } from '@/lib/schemas';
import { submitFloodReport } from '@/app/actions';
import { toast } from 'sonner';
import { Upload, X, AlertCircle, CheckCircle, MapPin, Search, Loader2 } from 'lucide-react';
import { classifyFloodSeverityByHeight, getFloodSeverityLabel } from '@/lib/flood-severity';

const floodHeightOptions = {
  Rendah: [10, 15, 20, 25, 30],
  Sedang: [35, 40, 45, 50, 55, 60, 65, 70],
  Tinggi: [75, 80, 85, 90, 95, 100, 110, 120],
} as const;

function getLocalDateTimeValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function encodeS3Key(key: string) {
  return key.split('/').map((segment) => encodeURIComponent(segment)).join('/');
}

export function ReportForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number } | null>(null);
  const [searchResultPos, setSearchResultPos] = useState<{ lat: number; lng: number } | null>(null);
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
      tinggiGenanganCm: undefined,
      tingkatKeparahan: undefined,
      tanggalWaktu: '',
      fotoDeskripsi: '',
      fotoUrl: '',
      coordinateSource: undefined,
      latitude: undefined,
      longitude: undefined,
    },
  });

  const tinggiGenanganCm = watch('tinggiGenanganCm');
  const tingkatKeparahan =
    typeof tinggiGenanganCm === 'number' && !Number.isNaN(tinggiGenanganCm)
      ? classifyFloodSeverityByHeight(tinggiGenanganCm)
      : undefined;

  useEffect(() => {
    if (tinggiGenanganCm === undefined || Number.isNaN(tinggiGenanganCm)) {
      setValue('tingkatKeparahan', undefined, { shouldDirty: false, shouldValidate: false });
      return;
    }

    setValue('tingkatKeparahan', tingkatKeparahan, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [setValue, tinggiGenanganCm, tingkatKeparahan]);

  useEffect(() => {
    setValue('tanggalWaktu', getLocalDateTimeValue(), {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [setValue]);

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
        setSearchResultPos(null);
        setValue('coordinateSource', 'manual_pin');
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

        setSearchResultPos({ lat: newLat, lng: newLng });
        setValue('coordinateSource', 'geocoded_hint');
        setShowMap(true);

        // Move map if already initialized
        if (mapRef.current) {
          mapRef.current.setView([newLat, newLng], 16);
          
          const L = await import('leaflet');
          if (markerRef.current) {
            markerRef.current.remove();
          }
          
          const newMarker = L.marker([newLat, newLng]).addTo(mapRef.current);
          newMarker.bindPopup('Hasil geocoding, klik peta untuk konfirmasi').openPopup();
          markerRef.current = newMarker;
        }
        
        toast.success('Lokasi ditemukan. Klik peta untuk mengonfirmasi titik final.');
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
    setValue('fotoUrl', '', {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit = async (data: ReportFormData) => {
    try {
      setIsSubmitting(true);

      if (!uploadedFile) {
        toast.error('Foto kejadian wajib diunggah terlebih dahulu');
        return;
      }

      if (markerPos === null) {
        toast.error('Titik koordinat lokasi wajib ditandai di peta');
        return;
      }

      // Upload foto first if there is a file
      let fotoUrl: string | undefined;
      if (uploadedFile) {
        // Use presigned URL flow: request signed URL from server, then PUT file directly to S3
        let presignResp;
        try {
          presignResp = await fetch('/api/upload/presign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: uploadedFile.name, contentType: uploadedFile.type }),
          });
        } catch (fetchError) {
          console.error('Presign request error:', fetchError);
          toast.error('❌ Kesalahan Jaringan', { description: 'Gagal menghubungi server upload. Periksa koneksi internet Anda.', duration: 4000 });
          setIsSubmitting(false);
          return;
        }

        const presignResult = await presignResp.json();
        if (!presignResp.ok || !presignResult.success || !presignResult.url) {
          toast.error('❌ Gagal Mendapatkan URL Upload', { description: presignResult.error ?? 'Coba lagi nanti', duration: 4000 });
          setIsSubmitting(false);
          return;
        }

        // Upload file directly to S3 using PUT
        try {
          const putResp = await fetch(presignResult.url, {
            method: 'PUT',
            headers: { 'Content-Type': uploadedFile.type },
            body: uploadedFile,
          });

          if (!putResp.ok) {
            console.error('S3 PUT failed', putResp.status, await putResp.text());
            toast.error('❌ Gagal Upload Foto ke S3', { duration: 4000 });
            setIsSubmitting(false);
            return;
          }
        } catch (putErr) {
          console.error('Upload to S3 error:', putErr);
          toast.error('❌ Gagal Upload Foto', { duration: 4000 });
          setIsSubmitting(false);
          return;
        }

        // Construct public URL (adjust if you use CloudFront/custom domain or private objects)
        const bucket = process.env.NEXT_PUBLIC_S3_BUCKET || undefined;
        if (bucket) {
          const region = process.env.NEXT_PUBLIC_AWS_REGION || process.env.NEXT_PUBLIC_AWS_DEFAULT_REGION || '';
          const encodedKey = encodeS3Key(presignResult.key);
          const regionPart = region && region !== 'us-east-1' ? `.s3.${region}` : '.s3';
          fotoUrl = `https://${bucket}${regionPart}.amazonaws.com/${encodedKey}`;
        } else {
          // Fallback to public S3 URL using region env from server response if present
          if (presignResult.key && presignResult.bucket && presignResult.region) {
            const r = presignResult.region === 'us-east-1' ? '' : `.${presignResult.region}`;
            fotoUrl = `https://${presignResult.bucket}.s3${r}.amazonaws.com/${encodeS3Key(presignResult.key)}`;
          } else if (presignResult.key) {
            // Best-effort: assume virtual-hosted style without region
            fotoUrl = `/${presignResult.key}`;
          }
        }

        if (fotoUrl) {
          setValue('fotoUrl', fotoUrl, { shouldDirty: true, shouldValidate: true });
        }
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
        setUploadError(null);

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
      {/* Nama Pelapor */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2">
          Nama Pelapor <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Nama lengkap Anda"
          {...register('namaPelapor')}
          className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${
            errors.namaPelapor
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-white'
          }`}
        />
        {errors.namaPelapor && (
          <p className="text-red-600 text-[11px] sm:text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {errors.namaPelapor.message}
          </p>
        )}
      </div>

      {/* Grid Row: Nomor Telepon + Tanggal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Nomor Telepon */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2">
            Nomor Telepon <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            placeholder="08xx-xxxx-xxxx"
            {...register('nomorTelepon')}
            className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${
              errors.nomorTelepon
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 bg-white'
            }`}
          />
          {errors.nomorTelepon && (
            <p className="text-red-600 text-[11px] sm:text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {errors.nomorTelepon.message}
            </p>
          )}
        </div>

        {/* Tanggal dan Waktu */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2">
            Tanggal dan Waktu
          </label>
          <input
            type="datetime-local"
            {...register('tanggalWaktu')}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 text-sm border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 transition bg-white"
          />
        </div>
      </div>

      {/* Lokasi */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2">
          Lokasi Banjir <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Contoh: Jl. Raya Bojongsoang"
            {...register('lokasi')}
            className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${
              errors.lokasi
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 bg-white'
            }`}
          />
          <button
            type="button"
            onClick={cariLokasi}
            disabled={isGeocoding}
            className="px-4 py-2 bg-brand-100 text-brand-700 border-2 border-brand-200 rounded-lg text-xs sm:text-sm font-bold hover:bg-brand-300 transition flex items-center justify-center gap-2 whitespace-nowrap active:scale-95"
            title="Cari koordinat berdasarkan alamat"
          >
            {isGeocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Cari di Peta
          </button>
        </div>
        {errors.lokasi && (
          <p className="text-red-600 text-[11px] sm:text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {errors.lokasi.message}
          </p>
        )}
      </div>

      {/* Tinggi Genangan */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2">
          Tinggi Genangan (cm) <span className="text-red-500">*</span>
        </label>
        <div className={`border-2 rounded-lg overflow-hidden transition ${getSeverityColor(tingkatKeparahan)}`}>
          <input type="hidden" {...register('tingkatKeparahan')} />
          <select
            {...register('tinggiGenanganCm', {
              setValueAs: (value) => (value === '' ? undefined : Number(value)),
            })}
            className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none cursor-pointer font-medium appearance-none ${
              tingkatKeparahan === 'Rendah'
                ? 'text-green-800 bg-green-50'
                : tingkatKeparahan === 'Sedang'
                  ? 'text-amber-800 bg-amber-50'
                  : tingkatKeparahan === 'Tinggi'
                    ? 'text-red-700 bg-red-50'
                    : 'text-gray-700 bg-white'
            }`}
          >
            <option value="">Pilih tinggi genangan...</option>
            <optgroup label="Rendah (10–30 cm)">
              {floodHeightOptions.Rendah.map((value) => (
                <option key={value} value={value}>
                  {value} cm
                </option>
              ))}
            </optgroup>
            <optgroup label="Sedang (35–70 cm)">
              {floodHeightOptions.Sedang.map((value) => (
                <option key={value} value={value}>
                  {value} cm
                </option>
              ))}
            </optgroup>
            <optgroup label="Tinggi (75–120 cm)">
              {floodHeightOptions.Tinggi.map((value) => (
                <option key={value} value={value}>
                  {value} cm
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <p className="mt-1 text-[11px] sm:text-sm text-slate-500">
          Patokan: Rendah 10–30 cm, Sedang 31–70 cm, Tinggi di atas 70 cm.
        </p>
        {tinggiGenanganCm !== undefined && !Number.isNaN(tinggiGenanganCm) && (
          <p className="mt-1 text-[11px] sm:text-sm font-semibold text-slate-700">
            Klasifikasi: {getFloodSeverityLabel(tinggiGenanganCm)}
          </p>
        )}
        {errors.tinggiGenanganCm && (
          <p className="text-red-600 text-[11px] sm:text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {errors.tinggiGenanganCm.message}
          </p>
        )}
      </div>

      {/* Deskripsi Kejadian */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2">
          Deskripsi Kejadian <span className="text-red-500">*</span>
        </label>
        <textarea
          placeholder="Jelaskan kondisi banjir... (minimal 20 karakter)"
          rows={4}
          {...register('deskripsi')}
          className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none ${
            errors.deskripsi
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-white'
          }`}
        />
        {errors.deskripsi && (
          <p className="text-red-600 text-[11px] sm:text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {errors.deskripsi.message}
          </p>
        )}
      </div>

      {/* File Upload - Foto Kejadian */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2">
          Foto Kejadian <span className="text-red-500">*</span>
        </label>

        {!uploadedFile ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center hover:border-brand-500 hover:bg-brand-100 transition cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-medium text-gray-700">
                Klik atau seret foto
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                Max 5MB
              </p>
            </label>
          </div>
        ) : (
          <div className="border-2 border-green-300 bg-green-50 rounded-lg p-3 sm:p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 shrink-0">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              <div className="text-left overflow-hidden">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[150px] sm:max-w-none">
                  {uploadedFile.name}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-600">
                  {(uploadedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="text-red-600 hover:text-red-700 transition"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}

        {uploadError && (
          <p className="text-red-600 text-[11px] sm:text-sm mt-2 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {uploadError}
          </p>
        )}

        <p className="mt-2 text-[10px] sm:text-xs text-gray-500 italic">Foto wajib diunggah sebelum kirim.</p>

        {uploadedFile && (
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mt-3 mb-1.5 sm:mb-2">
              Deskripsi Foto (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Banjir di depan rumah"
              {...register('fotoDeskripsi')}
              className="w-full px-3 sm:px-4 py-2 border-2 text-sm border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
          </div>
        )}
      </div>

      {/* Tandai Lokasi di Peta */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2">
          Tandai Lokasi di Peta <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg border-2 border-dashed border-brand-200 text-brand-800 text-xs sm:text-sm font-bold hover:border-brand-500 hover:bg-brand-100 transition mb-3 active:scale-95"
        >
          <MapPin className="w-4 h-4" />
          {showMap ? 'Tutup Peta' : 'Buka Peta untuk Pin Lokasi'}
        </button>

        {markerPos && (
          <p className="text-[10px] sm:text-xs text-green-700 font-bold mb-2 flex items-center gap-1">
            <CheckCircle className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            Lokasi: {markerPos.lat.toFixed(6)}, {markerPos.lng.toFixed(6)}
            <button
              type="button"
              onClick={() => {
                setMarkerPos(null);
                setSearchResultPos(null);
                setValue('coordinateSource', undefined);
                setValue('latitude', undefined);
                setValue('longitude', undefined);
              }}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              <X className="w-3 h-3" />
            </button>
          </p>
        )}

        {!markerPos && (
          <p className="text-[10px] sm:text-xs text-amber-700 font-bold mb-2 flex items-center gap-1">
            <AlertCircle className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            Koordinat lokasi wajib ditandai.
          </p>
        )}

        {showMap && (
          <div
              id="laporan-map"
              className="w-full rounded-xl border-2 border-brand-200 overflow-hidden cursor-crosshair"
              style={{ height: '240px' }}
            />
        )}
        {showMap && (
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1 italic">Klik peta untuk tandai titik banjir</p>
        )}
      </div>

      {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
        <button
          type="submit"
          disabled={isSubmitting || !isDirty || !isValid || !uploadedFile || !markerPos}
          className={`flex-1 px-6 py-3 rounded-lg font-bold text-sm sm:text-base transition flex items-center justify-center gap-2 ${
            isSubmitting || !isDirty || !isValid || !uploadedFile || !markerPos
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-brand-700 text-brand-100 hover:bg-brand-800 active:scale-95 shadow-md shadow-brand-200'
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
            setSearchResultPos(null);
            setShowMap(false);
            setValue('fotoUrl', '', {
              shouldDirty: false,
              shouldValidate: true,
            });
          }}
          disabled={!isDirty || isSubmitting}
          className={`px-6 py-3 rounded-lg font-bold text-sm sm:text-base transition ${
            !isDirty || isSubmitting
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95'
          }`}
        >
          Reset
        </button>
      </div>

      {/* Form Info */}
      <div className="bg-brand-100 border border-brand-200 rounded-xl p-4 sm:p-5 mt-4 sm:mt-6">
        <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-2">ℹ️ Info Pelaporan</h4>
        <ul className="text-[11px] sm:text-sm text-gray-700 space-y-1.5 leading-relaxed">
          <li className="flex gap-2"><span>✓</span> <span>Verifikasi dilakukan dalam 24 jam kerja.</span></li>
          <li className="flex gap-2"><span>✓</span> <span>Laporan valid akan muncul di peta & statistik.</span></li>
        </ul>
      </div>
    </form>
  );
}
