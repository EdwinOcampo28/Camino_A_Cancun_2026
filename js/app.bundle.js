(function(){

/* ===== config.js ===== */
const APP_CONFIG = Object.freeze({
  goal: 3000000,
  currency: 'COP',
  locale: 'es-CO',
  storageKeys: {
    saved: 'saved',
    history: 'history',
    savedDays: 'savedDays'
  },
  milestones: [1000000, 1500000, 2500000],
  tripDate: '2026-07-01T00:00:00',
  appName: 'Camino a Cancún 2026'
});

/* ===== storage.js ===== */

const { storageKeys } = APP_CONFIG;

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function loadState() {
  return {
    saved: Math.max(0, Number(localStorage.getItem(storageKeys.saved)) || 0),
    history: safeParse(localStorage.getItem(storageKeys.history), []).filter(item => item && Number(item.amount) > 0 && item.date),
    savedDays: [...new Set(safeParse(localStorage.getItem(storageKeys.savedDays), []).map(Number).filter(day => day >= 1 && day <= 31))]
  };
}

function persistState(state) {
  localStorage.setItem(storageKeys.saved, String(state.saved));
  localStorage.setItem(storageKeys.history, JSON.stringify(state.history));
  localStorage.setItem(storageKeys.savedDays, JSON.stringify(state.savedDays));
}

function clearAppData() {
  Object.values(storageKeys).forEach(key => localStorage.removeItem(key));
}

/* ===== state.js ===== */

const state = loadState();

function getState() {
  return state;
}

function addSaving(amount) {
  state.saved += amount;
  state.history.push({ amount, date: new Date().toISOString() });
  persistState(state);
}

function toggleSavedDay(day) {
  const index = state.savedDays.indexOf(day);
  if (index >= 0) state.savedDays.splice(index, 1);
  else state.savedDays.push(day);
  state.savedDays.sort((a, b) => a - b);
  persistState(state);
}

function resetState() {
  clearAppData();
  state.saved = 0;
  state.history = [];
  state.savedDays = [];
}

/* ===== utils.js ===== */

function formatMoney(value, withSymbol = false) {
  const formatted = Math.round(Number(value) || 0).toLocaleString(APP_CONFIG.locale);
  return withSymbol ? `$${formatted}` : formatted;
}

function formatDate(date) {
  return new Intl.DateTimeFormat(APP_CONFIG.locale, {
    day: '2-digit', month: 'short', year: 'numeric'
  }).format(new Date(date));
}

function getCumulativeData(history) {
  let total = 0;
  return history.map(item => {
    total += Number(item.amount) || 0;
    return total;
  });
}

function getMonthlyData(history) {
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

function getProgress(saved) {
  return Math.min(Math.max((saved / APP_CONFIG.goal) * 100, 0), 100);
}

function getDaysUntilTrip() {
  const trip = new Date(APP_CONFIG.tripDate);
  const now = new Date();
  return Math.ceil((trip - now) / 86400000);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

/* ===== effects.js ===== */
function animateValue(element, start, end, duration = 700) {
  if (!element) return;
  const startTime = performance.now();
  const tick = now => {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.floor(start + (end - start) * (1 - Math.pow(1 - progress, 3)));
    element.textContent = value.toLocaleString('es-CO');
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function launchConfetti() {
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.animationDelay = `${Math.random() * 1.4}s`;
    piece.style.setProperty('--drift', `${(Math.random() - .5) * 180}px`);
    fragment.appendChild(piece);
  }
  document.body.appendChild(fragment);
  window.setTimeout(() => document.querySelectorAll('.confetti').forEach(item => item.remove()), 3200);
}

function notify(message) {
  if ('Notification' in window && Notification.permission === 'granted') new Notification(message);
}

/* ===== charts.js ===== */

const charts = new Map();

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.max(1, window.devicePixelRatio || 1);
  const width = Math.max(320, Math.floor(rect.width));
  const height = Math.max(260, Math.floor(rect.height || 300));
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width, height };
}

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawEmpty(canvas, title, subtitle) {
  const { ctx, width, height } = setupCanvas(canvas);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#f8fafc';
  roundedRect(ctx, 10, 10, width - 20, height - 20, 24); ctx.fill();
  ctx.textAlign = 'center'; ctx.fillStyle = '#0f172a'; ctx.font = '700 16px Poppins, sans-serif';
  ctx.fillText(title, width / 2, height / 2 - 8);
  ctx.fillStyle = '#64748b'; ctx.font = '500 13px Poppins, sans-serif';
  ctx.fillText(subtitle, width / 2, height / 2 + 18);
}

function drawLine(canvas, values) {
  if (!values.length) return drawEmpty(canvas, 'Aún no hay progreso', 'Registra tu primer ahorro para comenzar');
  const { ctx, width, height } = setupCanvas(canvas);
  const p = { l: 58, r: 22, t: 28, b: 48 };
  const w = width - p.l - p.r, h = height - p.t - p.b;
  const max = Math.max(...values, 1);
  const min = 0;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#fbfdff'; roundedRect(ctx, 4, 4, width - 8, height - 8, 24); ctx.fill();

  ctx.strokeStyle = 'rgba(100,116,139,.12)'; ctx.lineWidth = 1;
  ctx.font = '500 11px Poppins, sans-serif'; ctx.fillStyle = '#64748b'; ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const y = p.t + h - (h * i / 4);
    ctx.beginPath(); ctx.moveTo(p.l, y); ctx.lineTo(width - p.r, y); ctx.stroke();
    ctx.fillText(`$${formatMoney(max * i / 4)}`, p.l - 9, y + 4);
  }

  const point = (i) => ({
    x: values.length === 1 ? p.l + w / 2 : p.l + (w * i / (values.length - 1)),
    y: p.t + h - ((values[i] - min) / (max - min || 1)) * h
  });
  const pts = values.map((_, i) => point(i));
  const grad = ctx.createLinearGradient(0, p.t, 0, p.t + h);
  grad.addColorStop(0, 'rgba(14,165,233,.28)'); grad.addColorStop(1, 'rgba(14,165,233,.02)');
  ctx.beginPath(); ctx.moveTo(pts[0].x, p.t + h); pts.forEach(pt => ctx.lineTo(pt.x, pt.y)); ctx.lineTo(pts.at(-1).x, p.t + h); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
  ctx.beginPath(); pts.forEach((pt, i) => i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y));
  ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
  pts.forEach(pt => { ctx.beginPath(); ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#0284c7'; ctx.stroke(); });
  ctx.fillStyle = '#64748b'; ctx.textAlign = 'center';
  if (values.length <= 8) pts.forEach((pt, i) => ctx.fillText(`Aporte ${i + 1}`, pt.x, height - 18));
}

function drawBars(canvas, items) {
  if (!items.length) return drawEmpty(canvas, 'Aún no hay datos mensuales', 'Tus aportes aparecerán aquí');
  const { ctx, width, height } = setupCanvas(canvas);
  const p = { l: 58, r: 20, t: 28, b: 58 };
  const w = width - p.l - p.r, h = height - p.t - p.b;
  const max = Math.max(...items.map(x => x.value), 1);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#fbfdff'; roundedRect(ctx, 4, 4, width - 8, height - 8, 24); ctx.fill();
  ctx.strokeStyle = 'rgba(100,116,139,.12)'; ctx.lineWidth = 1; ctx.fillStyle = '#64748b'; ctx.textAlign = 'right'; ctx.font = '500 11px Poppins, sans-serif';
  for (let i = 0; i <= 4; i++) { const y = p.t + h - h * i / 4; ctx.beginPath(); ctx.moveTo(p.l, y); ctx.lineTo(width - p.r, y); ctx.stroke(); ctx.fillText(`$${formatMoney(max * i / 4)}`, p.l - 9, y + 4); }
  const slot = w / items.length; const barW = Math.min(54, slot * .58);
  items.forEach((item, i) => {
    const bh = (item.value / max) * h; const x = p.l + slot * i + (slot - barW) / 2; const y = p.t + h - bh;
    const grad = ctx.createLinearGradient(0, y, 0, p.t + h); grad.addColorStop(0, '#7c3aed'); grad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = grad; roundedRect(ctx, x, y, barW, Math.max(5, bh), 12); ctx.fill();
    ctx.fillStyle = '#475569'; ctx.textAlign = 'center'; ctx.font = '600 10px Poppins, sans-serif';
    ctx.fillText(item.label, x + barW / 2, height - 24);
    if (items.length <= 8) { ctx.fillStyle = '#0f172a'; ctx.font = '700 10px Poppins, sans-serif'; ctx.fillText(`$${formatMoney(item.value)}`, x + barW / 2, Math.max(18, y - 8)); }
  });
}

function renderCharts(history) {
  const progressCanvas = document.getElementById('chart');
  const monthlyCanvas = document.getElementById('monthlyChart');
  if (!progressCanvas || !monthlyCanvas) return;
  const cumulative = getCumulativeData(history);
  const monthly = getMonthlyData(history);
  drawLine(progressCanvas, cumulative);
  drawBars(monthlyCanvas, monthly);
  charts.set('progress', progressCanvas); charts.set('monthly', monthlyCanvas);
}

function resizeCharts() {
  const progressCanvas = charts.get('progress');
  const monthlyCanvas = charts.get('monthly');
  if (!progressCanvas || !monthlyCanvas) return;
  drawLine(progressCanvas, getCumulativeData([]));
}

/* ===== ui.js ===== */

const $ = id => document.getElementById(id);

const elements = {
  saved: $('saved'),
  remaining: $('remaining'),
  progressBar: $('progress-bar'),
  progressText: $('progress-text'),
  milestones: $('milestones'),
  historyList: $('historyList'),
  calendar: $('calendar'),
  amount: $('amount'),
  countdown: $('countdown'),
  goalAmount: $('goalAmount'),
  savedCount: $('savedCount'),
  nextMilestone: $('nextMilestone'),
  saveBtn: $('saveBtn'),
  resetBtn: $('resetBtn'),
  savings: $('savings')
};

function renderDashboard(state) {
  const percent = getProgress(state.saved);
  const remaining = Math.max(APP_CONFIG.goal - state.saved, 0);
  const excess = Math.max(state.saved - APP_CONFIG.goal, 0);

  if (elements.saved) elements.saved.textContent = formatMoney(state.saved);
  if (elements.remaining) {
    elements.remaining.textContent = excess > 0 ? `Sobrante $${formatMoney(excess)}` : `Faltan $${formatMoney(remaining)}`;
  }
  if (elements.progressBar) {
    elements.progressBar.style.width = `${percent}%`;
    elements.progressBar.textContent = percent >= 4 ? `${Math.floor(percent)}%` : '';
    elements.progressBar.setAttribute('aria-valuenow', percent.toFixed(1));
  }
  if (elements.progressText) elements.progressText.textContent = `${percent.toFixed(1)}% completado`;
  if (elements.goalAmount) elements.goalAmount.textContent = `$${formatMoney(APP_CONFIG.goal)}`;
  if (elements.savedCount) elements.savedCount.textContent = `${state.history.length} ${state.history.length === 1 ? 'aporte' : 'aportes'}`;

  renderMilestones(state.saved);
  renderHistory(state.history);
  renderCalendar(state.savedDays);
  renderNextMilestone(state.saved);
}

function renderMilestones(saved) {
  if (!elements.milestones) return;
  elements.milestones.innerHTML = APP_CONFIG.milestones.map(milestone => {
    const reached = saved >= milestone;
    return `<li class="milestone ${reached ? 'is-complete' : ''}"><span>${reached ? '✓' : '○'}</span><span>$${formatMoney(milestone)}</span><strong>${reached ? 'Completada' : 'Pendiente'}</strong></li>`;
  }).join('');
}

function renderNextMilestone(saved) {
  if (!elements.nextMilestone) return;
  const next = APP_CONFIG.milestones.find(value => value > saved) || APP_CONFIG.goal;
  elements.nextMilestone.textContent = saved >= APP_CONFIG.goal ? '🏆 Meta alcanzada' : `$${formatMoney(next - saved)} para tu siguiente hito`;
}

function renderHistory(history) {
  if (!elements.historyList) return;
  if (!history.length) {
    elements.historyList.innerHTML = '<li class="empty-state">Aún no hay ahorros registrados. Tu primer aporte aparecerá aquí.</li>';
    return;
  }
  elements.historyList.innerHTML = history.slice().reverse().map(item => `
    <li class="history-item">
      <span class="history-icon">💰</span>
      <span><strong>$${formatMoney(item.amount)}</strong><small>${formatDate(item.date)}</small></span>
    </li>`).join('');
}

function renderCalendar(savedDays) {
  if (!elements.calendar) return;
  elements.calendar.innerHTML = Array.from({ length: 30 }, (_, index) => {
    const day = index + 1;
    const active = savedDays.includes(day);
    return `<button type="button" class="day ${active ? 'saved' : ''}" data-day="${day}" aria-pressed="${active}">${day}</button>`;
  }).join('');
}

function updateCountdown() {
  if (!elements.countdown) return;
  const trip = new Date(APP_CONFIG.tripDate);
  const days = Math.ceil((trip - new Date()) / 86400000);
  elements.countdown.textContent = days > 0 ? `⏳ Faltan ${days} días` : days === 0 ? '🌴 ¡Hoy es el gran día!' : '🌴 Tu fecha de viaje ya pasó';
}

function scrollToSavings() {
  elements.savings?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  elements.amount?.focus({ preventScroll: true });
}

/* ===== app.js ===== */

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

})();
