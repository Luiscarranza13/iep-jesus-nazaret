// Utilidades generales del proyecto

// Formatea fecha en español
export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

// Formatea fecha corta
export function formatDateShort(dateStr: string): string {
  return formatDate(dateStr, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Genera slug desde texto
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Trunca texto
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

// Formatea número de teléfono para WhatsApp
export function formatWhatsApp(phone: string): string {
  return phone.replace(/\D/g, '');
}

// URL de WhatsApp con mensaje
export function whatsAppUrl(phone: string, message?: string): string {
  const clean = formatWhatsApp(phone);
  const msg = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${clean}${msg}`;
}

// Obtiene URL pública de Supabase Storage
export function getStorageUrl(bucket: string, path: string): string {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

// Placeholder de imagen
export function imagePlaceholder(width = 800, height = 600, text = 'IEP Jesús de Nazaret'): string {
  return `https://placehold.co/${width}x${height}/7c3aed/ffffff?text=${encodeURIComponent(text)}`;
}

// Valida email
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Calcula tiempo relativo
export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
  if (days < 365) return `Hace ${Math.floor(days / 30)} meses`;
  return `Hace ${Math.floor(days / 365)} años`;
}
