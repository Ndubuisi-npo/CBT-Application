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
