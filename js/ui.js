import { APP_CONFIG } from './config.js';
import { formatMoney, formatDate, getProgress } from './utils.js';

const $ = id => document.getElementById(id);

export const elements = {
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

export function renderDashboard(state) {
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
  elements.historyList.innerHTML = `
    <div class="table-wrap"><table class="savings-table">
      <thead><tr><th>Movimiento</th><th>Fecha</th><th class="amount-cell">Ahorro</th></tr></thead>
      <tbody>${history.slice().reverse().map((item, index) => `
        <tr><td><span class="movement-label"><span class="movement-icon">↗</span><span><strong>Aporte #${history.length-index}</strong><small>Camino a Cancún</small></span></span></td><td class="date-cell">${formatDate(item.date)}</td><td class="amount-cell positive-amount">+$${formatMoney(item.amount)}</td></tr>`).join('')}
      </tbody>
    </table></div>`;
}

function renderCalendar(savedDays) {
  if (!elements.calendar) return;
  elements.calendar.innerHTML = Array.from({ length: 30 }, (_, index) => {
    const day = index + 1;
    const active = savedDays.includes(day);
    return `<button type="button" class="day ${active ? 'saved' : ''}" data-day="${day}" aria-pressed="${active}">${day}</button>`;
  }).join('');
}

export function updateCountdown() {
  if (!elements.countdown) return;
  const trip = new Date(APP_CONFIG.tripDate);
  const days = Math.ceil((trip - new Date()) / 86400000);
  elements.countdown.textContent = days > 0 ? `⏳ Faltan ${days} días` : days === 0 ? '🌴 ¡Hoy es el gran día!' : '🌴 Tu fecha de viaje ya pasó';
}

export function scrollToSavings() {
  elements.savings?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  elements.amount?.focus({ preventScroll: true });
}
