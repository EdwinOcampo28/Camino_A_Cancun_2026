import { APP_CONFIG } from './config.js';

const { storageKeys } = APP_CONFIG;

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function loadState() {
  return {
    saved: Math.max(0, Number(localStorage.getItem(storageKeys.saved)) || 0),
    history: safeParse(localStorage.getItem(storageKeys.history), []).filter(item => item && Number(item.amount) > 0 && item.date),
    savedDays: [...new Set(safeParse(localStorage.getItem(storageKeys.savedDays), []).map(Number).filter(day => day >= 1 && day <= 31))]
  };
}

export function persistState(state) {
  localStorage.setItem(storageKeys.saved, String(state.saved));
  localStorage.setItem(storageKeys.history, JSON.stringify(state.history));
  localStorage.setItem(storageKeys.savedDays, JSON.stringify(state.savedDays));
}

export function clearAppData() {
  Object.values(storageKeys).forEach(key => localStorage.removeItem(key));
}
