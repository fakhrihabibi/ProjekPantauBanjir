/**
 * Utility functions for the flood mapping system.
 */

/**
 * Returns the hex color associated with a severity level.
 */
export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'Tinggi':
    case 'Parah':
      return '#ef4444'; // red-500
    case 'Sedang':
      return '#f59e0b'; // amber-500
    case 'Rendah':
      return '#10b981'; // emerald-500
    default:
      return '#0ea5e9'; // sky-500
  }
};

/**
 * Returns the tailwind background and text color classes for a status.
 */
export const getStatusColorClasses = (status: string): string => {
  switch (status) {
    case 'Terverifikasi':
      return 'bg-green-100 text-green-800';
    case 'Menunggu Verifikasi':
      return 'bg-yellow-100 text-yellow-800';
    case 'Ditolak':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Returns the URL for a severity icon marker.
 */
export const getSeverityIconUrl = (severity: string): string => {
  const baseUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-';

  switch (severity) {
    case 'Tinggi':
    case 'Parah':
      return `${baseUrl}red.png`;
    case 'Sedang':
      return `${baseUrl}orange.png`;
    case 'Rendah':
      return `${baseUrl}green.png`;
    default:
      return `${baseUrl}blue.png`;
  }
};

/**
 * Formats a date string to a localized medium date and short time.
 */
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(dateObj);
};
