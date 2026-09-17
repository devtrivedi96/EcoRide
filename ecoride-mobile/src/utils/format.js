export function formatDateTime(value) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function currency(value) {
  const amount = Number(value || 0);
  return `₹${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}

export function initials(user) {
  const first = user?.firstName?.[0] || '';
  const last = user?.lastName?.[0] || '';
  return `${first}${last}`.toUpperCase() || 'ER';
}

export function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Something went wrong';
}
