import { APP_CONFIG } from './config.js';
import { getState, addSaving, toggleSavedDay, resetState } from './state.js';
import { elements, renderDashboard, updateCountdown, scrollToSavings } from './ui.js';
import { renderCharts } from './charts.js';
import { animateValue, launchConfetti, notify } from './effects.js';

let celebrationShown = false;

function refreshUI(animate = false) {
  const state = getState();
  const previousSaved = Number(elements.saved?.textContent.replace(/\D/g, '')) || 0;
  renderDashboard(state);
  renderCharts(state.history);
  if (animate && elements.saved) animateValue(elements.saved, previousSaved, state.saved);

  if (state.saved >= APP_CONFIG.goal && !celebrationShown) {
    celebrationShown = true;
    launchConfetti();
    notify('🎉 ¡Meta alcanzada! Cancún te espera.');
  }
}

function handleSave() {
  const value = Number(elements.amount?.value);
  if (!Number.isFinite(value) || value <= 0) {
    elements.amount?.classList.add('input-error');
    elements.amount?.focus();
    window.setTimeout(() => elements.amount?.classList.remove('input-error'), 700);
    return;
  }
  addSaving(value);
  elements.amount.value = '';
  refreshUI(true);
}

function handleReset() {
  if (!window.confirm('¿Seguro que deseas reiniciar el progreso de Camino a Cancún? Esta acción elimina los ahorros, historial y días marcados de esta app.')) return;
  resetState();
  celebrationShown = false;
  refreshUI();
}

function initNotifications() {
  if (!('Notification' in window) || Notification.permission !== 'default') return;
  // No solicitamos permiso automáticamente: se respeta la decisión del usuario y se evita un popup inesperado.
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Service Worker:', error));
}

function bindEvents() {
  document.getElementById('heroSaveBtn')?.addEventListener('click', scrollToSavings);
  elements.saveBtn?.addEventListener('click', handleSave);
  elements.resetBtn?.addEventListener('click', handleReset);
  elements.amount?.addEventListener('keydown', event => {
    if (event.key === 'Enter') handleSave();
  });
  elements.calendar?.addEventListener('click', event => {
    const dayButton = event.target.closest('[data-day]');
    if (!dayButton) return;
    toggleSavedDay(Number(dayButton.dataset.day));
    refreshUI();
  });
  window.addEventListener('scroll', () => {
    document.documentElement.style.setProperty('--scroll-y', `${window.scrollY * .08}px`);
  }, { passive: true });
}

window.scrollToSavings = scrollToSavings;

window.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  refreshUI();
  updateCountdown();
  window.setInterval(updateCountdown, 60000);
  initNotifications();
  registerServiceWorker();
});
