/**
 * Format a date as a relative string (e.g. "hace 2 días")
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'hace un momento';
  if (diffMins < 60) return `hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  if (diffDays < 30) return `hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
  return formatAbsoluteDate(d);
}

/**
 * Format a date as an absolute string (e.g. "15 ene 2024")
 */
export function formatAbsoluteDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-CU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}
