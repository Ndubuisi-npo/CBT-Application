const pad = (value) => String(value).padStart(2, '0')

export const fmtDate = (date) => {
  if (!date || date === '-') return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export const fmtDateTime = (date, options = {}) => {
  if (!date || date === '-') return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options,
  }).format(d);
}

export const toDatetimeLocalInputValue = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Normalizes any incoming date-ish value (ISO datetime string, date-only
// string, Date object, timestamp) into the "YYYY-MM-DD" format required by
// native <input type="date"> elements. Without this, edit forms silently
// render blank whenever the backend sends a full ISO datetime (e.g.
// "2010-05-14T00:00:00.000000Z") instead of a bare date.
export const toDateInputValue = (value) => {
  if (!value) return '';

  if (typeof value === 'string') {
    // Prefer a direct substring match over re-parsing through Date() to
    // avoid timezone-shift bugs (a UTC-midnight string can roll back to the
    // previous day once converted to local time).
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const toDatetimeLocalIsoWithOffset = (localDateTime) => {
  if (!localDateTime) return null;

  const [datePart, timePart] = localDateTime.split('T')
  if (!datePart || !timePart) return null

  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  if ([year, month, day, hour, minute].some((value) => Number.isNaN(value))) return null

  const date = new Date(year, month - 1, day, hour, minute, 0)
  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}
