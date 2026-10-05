import { APP_CONFIG } from './config.js';

export function formatMoney(value, withSymbol = false) {
  const formatted = Math.round(Number(value) || 0).toLocaleString(APP_CONFIG.locale);
  return withSymbol ? `$${formatted}` : formatted;
}

export function formatDate(date) {
  return new Intl.DateTimeFormat(APP_CONFIG.locale, {
    day: '2-digit', month: 'short', year: 'numeric'
  }).format(new Date(date));
}

export function getCumulativeData(history) {
  let total = 0;
  return history.map(item => {
    total += Number(item.amount) || 0;
    return total;
  });
}

export function getMonthlyData(history) {
  const monthMap = new Map();
  const formatter = new Intl.DateTimeFormat(APP_CONFIG.locale, { month: 'short' });

  history.forEach(item => {
    const date = new Date(item.date);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = formatter.format(date).replace('.', '');
    monthMap.set(key, { label: label.charAt(0).toUpperCase() + label.slice(1), value: (monthMap.get(key)?.value || 0) + Number(item.amount) });
  });

  return [...monthMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);
}

export function getProgress(saved) {
  return Math.min(Math.max((saved / APP_CONFIG.goal) * 100, 0), 100);
}

export function getDaysUntilTrip() {
  const trip = new Date(APP_CONFIG.tripDate);
  const now = new Date();
  return Math.ceil((trip - now) / 86400000);
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}
