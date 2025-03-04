/**
 * Formatea una fecha usando las opciones de Intl.DateTimeFormat
 * @param date La fecha a formatear
 * @param options Opciones para el formato
 * @returns String formateado de la fecha
 */
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return 'Fecha no especificada';
  
  const defaultOptions: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  };
  
  const mergedOptions = {...defaultOptions, ...options};
  
  try {
    return new Date(date).toLocaleDateString('es-ES', mergedOptions);
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return date.toString();
  }
} 