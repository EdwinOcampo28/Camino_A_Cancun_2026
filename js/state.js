import { loadState, persistState, clearAppData } from './storage.js';

const state = loadState();

export function getState() {
  return state;
}

export function addSaving(amount) {
  state.saved += amount;
  state.history.push({ amount, date: new Date().toISOString() });
  persistState(state);
}

export function toggleSavedDay(day) {
  const index = state.savedDays.indexOf(day);
  if (index >= 0) state.savedDays.splice(index, 1);
  else state.savedDays.push(day);
  state.savedDays.sort((a, b) => a - b);
  persistState(state);
}

export function resetState() {
  clearAppData();
  state.saved = 0;
  state.history = [];
  state.savedDays = [];
}
