export function asDate(value) {
  if (value instanceof Date) return value;
  const text = String(value || '');
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T12:00:00` : /T/.test(text) && !/(Z|[+-]\d{2}:?\d{2})$/i.test(text) ? `${text}Z` : text);
}
export function formatDate(value, locale) { const date = asDate(value); return Number.isNaN(+date) ? '' : new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(date); }
export function formatDateTime(value, locale) { const date = asDate(value); return Number.isNaN(+date) ? '' : new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date); }