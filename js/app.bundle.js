(function(){

/* ===== config.js ===== */
const APP_CONFIG = Object.freeze({
  goal: 7000000,
  currency: 'COP',
  locale: 'es-CO',
  storageKeys: {
    saved: 'saved',
    history: 'history',
    savedDays: 'savedDays'
  },
  milestones: [1500000, 3500000, 5500000],
  tripDate: '2027-07-01T00:00:00',
  appName: 'Camino a Cancún 2027'
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

function undoLastSaving() {
  if (!state.history.length) return false;
  const last = state.history.pop();
  state.saved = Math.max(0, state.saved - Number(last.amount || 0));
  persistState(state);
  return true;
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


const chartState = { progress: null, history: [], range: 'all', visibleHistory: [], visibleCumulative: [], focusIndex: 0 };

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const width = Math.max(280, Math.floor(rect.width || 600));
  const height = Math.max(160, Math.floor(rect.height || 220));
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width, height };
}
function roundRect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}
function moneyShort(value) {
  const n = Number(value) || 0;
  if (n >= 1000000) return `$${(n/1000000).toLocaleString('es-CO',{maximumFractionDigits:1})} M`;
  if (n >= 1000) return `$${Math.round(n/1000)} mil`;
  return `$${Math.round(n).toLocaleString('es-CO')}`;
}
function drawEmpty(canvas, title, subtitle) {
  const {ctx,width,height}=setupCanvas(canvas); ctx.clearRect(0,0,width,height);
  const g=ctx.createLinearGradient(0,0,width,height); g.addColorStop(0,'#fff8e9'); g.addColorStop(1,'#f3e6ca');
  roundRect(ctx,2,2,width-4,height-4,22); ctx.fillStyle=g; ctx.fill();
  ctx.textAlign='center'; ctx.fillStyle='#264b40'; ctx.font='700 16px Poppins, sans-serif'; ctx.fillText(title,width/2,height/2-9);
  ctx.fillStyle='#8a795e'; ctx.font='500 12px Poppins, sans-serif'; ctx.fillText(subtitle,width/2,height/2+17);
}
function drawLine(canvas, values) {
  if (!values.length) return drawEmpty(canvas,'Tu viaje empieza con un aporte','Registra tu primer ahorro para ver crecer la curva');
  const {ctx,width,height}=setupCanvas(canvas); ctx.clearRect(0,0,width,height);
  const p={l:64,r:22,t:32,b:42}, w=width-p.l-p.r, h=height-p.t-p.b;
  const max=Math.max(...values,100000); const top=max*1.12;
  const xAt=i=>values.length===1?p.l+w/2:p.l+w*i/(values.length-1);
  const yAt=v=>p.t+h-(v/top)*h;
  // clean plotting surface
  const bg=ctx.createLinearGradient(0,0,width,height); bg.addColorStop(0,'#fffaf0'); bg.addColorStop(1,'#f8efdD');
  roundRect(ctx,2,2,width-4,height-4,22); ctx.fillStyle=bg; ctx.fill();
  ctx.font='500 10px Poppins, sans-serif'; ctx.textAlign='right'; ctx.fillStyle='#8a795e'; ctx.strokeStyle='#e5d7bb'; ctx.lineWidth=1;
  for(let i=0;i<=4;i++){const val=top*i/4,y=yAt(val);ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(width-p.r,y);ctx.stroke();ctx.fillText(moneyShort(val),p.l-10,y+4);}
  const pts=values.map((v,i)=>({x:xAt(i),y:yAt(v),v,i}));
  // smooth bezier path
  const path=()=>{ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++){const prev=pts[i-1],cur=pts[i],mid=(prev.x+cur.x)/2;ctx.bezierCurveTo(mid,prev.y,mid,cur.y,cur.x,cur.y);}};
  const area=ctx.createLinearGradient(0,p.t,0,p.t+h);area.addColorStop(0,'rgba(23,107,98,.25)');area.addColorStop(.65,'rgba(23,107,98,.07)');area.addColorStop(1,'rgba(23,107,98,0)');
  path();ctx.lineTo(pts[pts.length-1].x,p.t+h);ctx.lineTo(pts[0].x,p.t+h);ctx.closePath();ctx.fillStyle=area;ctx.fill();
  path();const line=ctx.createLinearGradient(p.l,0,width-p.r,0);line.addColorStop(0,'#176b62');line.addColorStop(1,'#e87555');ctx.strokeStyle=line;ctx.lineWidth=3.5;ctx.lineJoin='round';ctx.lineCap='round';ctx.shadowColor='rgba(23,107,98,.22)';ctx.shadowBlur=10;ctx.stroke();ctx.shadowBlur=0;
  const indexes=pts.length<=7?pts.map((_,i)=>i):[0,Math.floor((pts.length-1)/3),Math.floor((pts.length-1)*2/3),pts.length-1];
  pts.forEach((pt,i)=>{if(!indexes.includes(i))return;ctx.beginPath();ctx.arc(pt.x,pt.y,6,0,Math.PI*2);ctx.fillStyle='#fff8e9';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#176b62';ctx.stroke();});
  ctx.textAlign='center';ctx.fillStyle='#8a795e';ctx.font='500 10px Poppins, sans-serif';
  indexes.forEach((idx,j)=>{const label=pts.length===1?'Inicio':pts.length<=7?`Aporte ${idx+1}`:j===0?'Inicio':j===indexes.length-1?'Último':'Ahorro';ctx.fillText(label,pts[idx].x,height-17);});
}
function drawBars(canvas, items) {
  if (!items.length) return drawEmpty(canvas,'Aún no hay meses registrados','Los aportes se agruparán aquí por mes');
  const {ctx,width,height}=setupCanvas(canvas);ctx.clearRect(0,0,width,height);
  const p={l:58,r:18,t:34,b:45},w=width-p.l-p.r,h=height-p.t-p.b,max=Math.max(...items.map(x=>x.value),10000),top=max*1.18;
  const bg=ctx.createLinearGradient(0,0,width,height);bg.addColorStop(0,'#fffaf0');bg.addColorStop(1,'#f3e6ca');roundRect(ctx,2,2,width-4,height-4,22);ctx.fillStyle=bg;ctx.fill();
  ctx.strokeStyle='#e5d7bb';ctx.lineWidth=1;ctx.fillStyle='#8a795e';ctx.font='500 10px Poppins, sans-serif';ctx.textAlign='right';
  for(let i=0;i<=4;i++){const val=top*i/4,y=p.t+h-h*i/4;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(width-p.r,y);ctx.stroke();ctx.fillText(moneyShort(val),p.l-9,y+4);}
  const slot=w/items.length,barW=Math.min(58,slot*.56);
  items.forEach((item,i)=>{
    const x=p.l+slot*i+(slot-barW)/2, bh=Math.max(4,(item.value/top)*h),y=p.t+h-bh;
    // soft track and colored gradient bar
    ctx.fillStyle='#eee2c8';roundRect(ctx,x,p.t,barW,h,barW/2);ctx.fill();
    const grad=ctx.createLinearGradient(0,y,0,p.t+h);grad.addColorStop(0,'#e87555');grad.addColorStop(.55,'#176b62');grad.addColorStop(1,'#9bc7a5');
    roundRect(ctx,x,y,barW,Math.max(barW*.45,bh),barW/2);ctx.fillStyle=grad;ctx.fill();
    ctx.fillStyle='#6a6655';ctx.textAlign='center';ctx.font='600 10px Poppins, sans-serif';ctx.fillText(item.label,x+barW/2,height-18);
    if(items.length<=7){ctx.fillStyle='#264b40';ctx.font='700 10px Poppins, sans-serif';ctx.fillText(moneyShort(item.value),x+barW/2,Math.max(18,y-9));}
  });
}
function renderCharts(history) {
  chartState.history=Array.isArray(history)?history:[];
  chartState.progress=document.getElementById('chart');
  if(!chartState.progress)return;
  const range=chartState.range||'all';
  const offset=range==='10'?Math.max(0,chartState.history.length-10):0;
  const visible=chartState.history.slice(offset);
  const cumulative=getCumulativeData(chartState.history).slice(offset);
  chartState.visibleHistory=visible;
  chartState.visibleCumulative=cumulative;
  drawLine(chartState.progress,cumulative);
  const summary=document.getElementById('chartSummary');
  const tooltip=document.getElementById('chartTooltip');
  if(summary){
    const total=chartState.history.reduce((sum,item)=>sum+(Number(item.amount)||0),0);
    summary.innerHTML=`<span>${visible.length} ${visible.length===1?'aporte visible':'aportes visibles'} · ${range==='10'?'últimos movimientos':'historial completo'}</span><strong>${moneyShort(total)} acumulados</strong>`;
  }
  if(tooltip)tooltip.textContent=visible.length?'Pasa el cursor por la línea para explorar cada aporte.':'Registra tu primer ahorro para explorar el gráfico.';
}
function setChartRange(range){
  chartState.range=range;
  document.querySelectorAll('[data-chart-range]').forEach(button=>{
    const active=button.dataset.chartRange===range;
    button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));
  });
  renderCharts(chartState.history);
}
function setupChartInteraction(){
  const canvas=document.getElementById('chart');
  if(!canvas||canvas.dataset.interactive==='true')return;
  canvas.dataset.interactive='true';
  const inspect=(clientX)=>{
    const history=chartState.visibleHistory||[];if(!history.length)return;
    const rect=canvas.getBoundingClientRect();const x=clientX-rect.left;
    const left=64,right=22,plotWidth=Math.max(1,rect.width-left-right);
    const idx=history.length===1?0:Math.round(Math.max(0,Math.min(1,(x-left)/plotWidth))*(history.length-1));
    const item=history[idx];if(!item)return;
    const total=chartState.visibleCumulative[idx]||0;
    const date=item.date?formatDate(item.date):`Aporte ${idx+1}`;
    const message=`${date} · Aporte ${moneyShort(Number(item.amount)||0)} · Acumulado ${moneyShort(total)}`;
    const tooltip=document.getElementById('chartTooltip');if(tooltip)tooltip.textContent=message;
    const summary=document.getElementById('chartSummary');if(summary)summary.innerHTML=`<span>${date}</span><strong>+${moneyShort(Number(item.amount)||0)} · Total ${moneyShort(total)}</strong>`;
    canvas.title=message;
  };
  canvas.addEventListener('mousemove',event=>inspect(event.clientX));
  canvas.addEventListener('touchmove',event=>{if(event.touches[0])inspect(event.touches[0].clientX);},{passive:true});
  canvas.addEventListener('focus',()=>{const rect=canvas.getBoundingClientRect();inspect(rect.left+rect.width-22);});
  canvas.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const history=chartState.visibleHistory||[];if(!history.length)return;
    chartState.focusIndex=chartState.focusIndex??history.length-1;
    if(event.key==='Home')chartState.focusIndex=0;else if(event.key==='End')chartState.focusIndex=history.length-1;else chartState.focusIndex=Math.max(0,Math.min(history.length-1,chartState.focusIndex+(event.key==='ArrowRight'?1:-1)));
    const rect=canvas.getBoundingClientRect();inspect(rect.left+64+(history.length===1?0:(rect.width-86)*chartState.focusIndex/(history.length-1)));
  });
  document.querySelectorAll('[data-chart-range]').forEach(button=>button.addEventListener('click',()=>setChartRange(button.dataset.chartRange)));
}
function resizeCharts(){renderCharts(chartState.history);}
window.addEventListener('resize',()=>{clearTimeout(window.__cancunChartResize);window.__cancunChartResize=setTimeout(resizeCharts,120);},{passive:true});
document.addEventListener('DOMContentLoaded',setupChartInteraction);


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
  const seal = document.getElementById('progressSeal');
  const ringPercent = document.getElementById('ringPercent');
  if (seal) {
    seal.style.setProperty('--progress', `${Math.min(percent, 100)}%`);
    seal.setAttribute('aria-label', `${percent.toFixed(1)} por ciento de la meta completada`);
  }
  if (ringPercent) ringPercent.textContent = `${Math.round(percent)}%`;
  const daysLeft = Math.max(1, Math.ceil((new Date(APP_CONFIG.tripDate) - new Date()) / 86400000));
  const dailyPace = Math.ceil(remaining / daysLeft);
  const moneyPerDay = value => '$' + formatMoney(value);
  const dailyEl = document.getElementById('dailyPace');
  const weeklyEl = document.getElementById('weeklyPace');
  if (dailyEl) dailyEl.textContent = moneyPerDay(dailyPace);
  if (weeklyEl) weeklyEl.textContent = moneyPerDay(dailyPace * 7);
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
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const monthLabel = new Intl.DateTimeFormat(APP_CONFIG.locale, { month: 'long', year: 'numeric' }).format(now);
  const monthElement = document.getElementById('calendarMonth');
  if (monthElement) monthElement.textContent = monthLabel.charAt(0).toLocaleUpperCase(APP_CONFIG.locale) + monthLabel.slice(1);
  const weekdays = ['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(label => `<span class="calendar-weekday" aria-hidden="true">${label}</span>`).join('');
  const blanks = Array.from({ length: firstWeekday }, () => '<span class="day-empty" aria-hidden="true"></span>').join('');
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const active = savedDays.includes(day);
    const future = day > today;
    const classes = ['day', active ? 'saved' : '', future ? 'future' : ''].filter(Boolean).join(' ');
    const label = `${day} de ${monthLabel}${future ? ', fecha futura no disponible' : active ? ', ahorro registrado' : ', sin ahorro marcado'}`;
    return `<button type="button" class="${classes}" data-day="${day}" aria-label="${label}" aria-pressed="${active}" ${future ? 'disabled title="No puedes marcar una fecha futura"' : ''}>${day}${active ? '<span class="day-check" aria-hidden="true">✓</span>' : ''}</button>`;
  }).join('');
  elements.calendar.innerHTML = weekdays + blanks + days;
  const validation = document.getElementById('calendarValidation');
  if (validation) {
    const count = savedDays.filter(day => day >= 1 && day <= Math.min(daysInMonth, today)).length;
    validation.textContent = count ? `${count} ${count === 1 ? 'día marcado' : 'días marcados'} este mes. Puedes desmarcar un día tocándolo de nuevo.` : 'Todavía no has marcado días este mes. Las fechas futuras están bloqueadas.';
    validation.classList.toggle('has-savings', count > 0);
  }
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

function renderAchievements(current) {
  const list = document.getElementById('achievementList');
  const count = document.getElementById('achievementCount');
  if (!list) return;
  const definitions = [
    { title: 'Primer paso', detail: 'Registra tu primer aporte', done: current.history.length >= 1, icon: '🌱' },
    { title: 'Constancia', detail: 'Completa 5 aportes', done: current.history.length >= 5, icon: '🧭' },
    { title: 'Primeros $100 mil', detail: 'Acumula $100.000', done: current.saved >= 100000, icon: '🪙' },
    { title: 'Un cuarto del camino', detail: 'Alcanza $1.750.000', done: current.saved >= 1750000, icon: '🌴' },
    { title: 'Pasaporte dorado', detail: 'Completa la meta', done: current.saved >= APP_CONFIG.goal, icon: '🏆' }
  ];
  const unlocked = definitions.filter(item => item.done).length;
  if (count) count.textContent = `${unlocked} de ${definitions.length} desbloqueados`;
  list.innerHTML = definitions.map(item => `<div class="achievement ${item.done ? 'is-unlocked' : ''}" title="${item.detail}"><span class="achievement-icon">${item.done ? item.icon : '🔒'}</span><span><strong>${item.title}</strong><small>${item.done ? 'Desbloqueado' : item.detail}</small></span></div>`).join('');
}

function exportBackup() {
  const current = getState();
  const payload = { app: APP_CONFIG.appName, exportedAt: new Date().toISOString(), goal: APP_CONFIG.goal, saved: current.saved, history: current.history, savedDays: current.savedDays };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `camino-a-cancun-respaldo-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  notify('Copia de seguridad descargada. Guárdala en un lugar seguro.');
}

function renderMonthlyChallenge(current) {
  const now = new Date();
  const monthName = new Intl.DateTimeFormat(APP_CONFIG.locale, { month: 'long', year: 'numeric' }).format(now);
  const monthSaved = current.history.reduce((sum, item) => {
    const date = new Date(item.date);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() ? sum + Number(item.amount || 0) : sum;
  }, 0);
  const target = 300000;
  const percent = Math.min(100, Math.round(monthSaved / target * 100));
  const monthEl = document.getElementById('challengeMonth');
  const savedEl = document.getElementById('challengeSaved');
  const remainingEl = document.getElementById('challengeRemaining');
  const bar = document.getElementById('challengeProgressBar');
  const progress = document.getElementById('challengeProgress');
  const message = document.getElementById('challengeMessage');
  if (monthEl) monthEl.textContent = `Reto de ${monthName}`;
  if (savedEl) savedEl.textContent = `$${formatMoney(monthSaved)}`;
  if (remainingEl) remainingEl.textContent = monthSaved >= target ? '¡Meta mensual completada!' : `Faltan $${formatMoney(target - monthSaved)} para $300.000`;
  if (bar) bar.style.width = `${percent}%`;
  if (progress) progress.setAttribute('aria-valuenow', String(percent));
  if (message) message.textContent = monthSaved >= target ? '🏆 ¡Reto cumplido! Ya construiste un gran hábito este mes.' : `Llevas el ${percent}% del reto. Cada aporte registrado durante este mes suma aquí.`;
}

function importBackup(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result || ''));
      if (!payload || !Array.isArray(payload.history) || !Array.isArray(payload.savedDays)) throw new Error('Formato inválido');
      const history = payload.history.filter(item => item && Number.isFinite(Number(item.amount)) && Number(item.amount) > 0 && !Number.isNaN(new Date(item.date).getTime())).map(item => ({ amount: Number(item.amount), date: new Date(item.date).toISOString() }));
      const savedDays = [...new Set(payload.savedDays.map(Number).filter(day => Number.isInteger(day) && day >= 1 && day <= 31))];
      const calculated = history.reduce((sum, item) => sum + item.amount, 0);
      const saved = Number.isFinite(Number(payload.saved)) && Number(payload.saved) >= 0 ? Number(payload.saved) : calculated;
      if (Math.abs(calculated - saved) > 1) {
        if (!window.confirm(`El respaldo indica ${formatMoney(saved)} pero los movimientos suman ${formatMoney(calculated)}. ¿Quieres restaurarlo usando el total calculado de los movimientos?`)) return;
      }
      if (!window.confirm(`Se reemplazarán los datos actuales por ${history.length} aportes del respaldo. ¿Continuar?`)) return;
      state.saved = Math.abs(calculated - saved) > 1 ? calculated : saved;
      state.history = history;
      state.savedDays = savedDays;
      persistState(state);
      celebrationShown = state.saved >= APP_CONFIG.goal;
      refreshUI();
      notify('Copia restaurada correctamente.');
    } catch (error) {
      notify('No se pudo restaurar: el archivo no parece una copia válida de Camino a Cancún.');
    }
  };
  reader.readAsText(file);
}

function refreshUI(animate = false) {
  const state = getState();
  const previousSaved = Number(elements.saved?.textContent.replace(/\D/g, '')) || 0;
  renderDashboard(state);
  renderCharts(state.history);
  renderAchievements(state);
  renderMonthlyChallenge(state);
  const undoButton = document.getElementById('undoSavingBtn');
  if (undoButton) undoButton.disabled = state.history.length === 0;
  if (document.getElementById('weeklyContribution')?.value) calculateSavingsPlan();
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

function calculateSavingsPlan() {
  const input = document.getElementById('weeklyContribution');
  const duration = document.getElementById('planDuration');
  const dateOutput = document.getElementById('planDate');
  const weeklyOutput = document.getElementById('planWeeklyAmount');
  const note = document.getElementById('planNote');
  if (!input || !duration || !dateOutput || !weeklyOutput || !note) return;
  const weekly = Number(input.value);
  const remaining = Math.max(APP_CONFIG.goal - getState().saved, 0);
  if (!Number.isFinite(weekly) || weekly < 1000) {
    input.classList.add('input-error');
    input.setAttribute('aria-invalid', 'true');
    duration.textContent = 'Ingresa al menos $1.000';
    dateOutput.textContent = '—';
    note.textContent = 'Escribe un aporte semanal válido para calcular la proyección.';
    window.setTimeout(() => input.classList.remove('input-error'), 700);
    input.focus();
    return;
  }
  input.removeAttribute('aria-invalid');
  weeklyOutput.textContent = '$' + formatMoney(weekly);
  if (remaining <= 0) {
    duration.textContent = '¡Meta alcanzada!';
    dateOutput.textContent = '¡Ya llegaste!';
    note.textContent = 'Ya completaste la meta de ahorro. Puedes usar el planificador para una meta futura.';
    return;
  }
  const weeks = Math.ceil(remaining / weekly);
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + weeks * 7);
  duration.textContent = `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  dateOutput.textContent = new Intl.DateTimeFormat(APP_CONFIG.locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(estimatedDate);
  const tripDate = new Date(APP_CONFIG.tripDate);
  const weeksUntilTrip = Math.max(0, Math.ceil((tripDate - new Date()) / (7 * 86400000)));
  if (estimatedDate <= tripDate) {
    note.textContent = `¡Vas por buen camino! Con este ritmo podrías llegar antes de tu fecha de viaje, aproximadamente ${weeksUntilTrip - weeks} semanas de margen.`;
  } else {
    note.textContent = `Con este ritmo alcanzarías la meta después de la fecha prevista del viaje. Para llegar antes, necesitarías cerca de $${formatMoney(Math.ceil(remaining / Math.max(weeksUntilTrip, 1)))} por semana.`;
  }
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
  document.querySelectorAll('[data-quick-amount]').forEach(button => button.addEventListener('click', () => {
    const amount = Number(button.dataset.quickAmount);
    if (!elements.amount || !Number.isFinite(amount) || amount <= 0) return;

    // Cada toque suma al importe pendiente; permite repetir y combinar aportes rápidos.
    const current = Number(elements.amount.value) || 0;
    elements.amount.value = String(current + amount);
    elements.amount.classList.remove('input-error');
    elements.amount.dispatchEvent(new Event('input', { bubbles: true }));
    elements.amount.focus();

    // Confirmación visual breve sin cambiar el importe acumulado.
    button.classList.add('quick-amount-added');
    window.setTimeout(() => button.classList.remove('quick-amount-added'), 220);
  }));
  document.getElementById('calculatePlanBtn')?.addEventListener('click', calculateSavingsPlan);
  document.getElementById('weeklyContribution')?.addEventListener('keydown', event => { if (event.key === 'Enter') calculateSavingsPlan(); });
  elements.resetBtn?.addEventListener('click', handleReset);
  document.getElementById('undoSavingBtn')?.addEventListener('click', () => {
    const current = getState();
    if (!current.history.length) return;
    const last = current.history[current.history.length - 1];
    if (!window.confirm(`¿Deshacer el último aporte de $${formatMoney(last.amount)}?`)) return;
    undoLastSaving();
    celebrationShown = getState().saved >= APP_CONFIG.goal;
    refreshUI(true);
    notify('Se deshizo el último aporte.');
  });
  document.getElementById('exportBackupBtn')?.addEventListener('click', exportBackup);
  const importButton = document.getElementById('importBackupBtn');
  const importFile = document.getElementById('importBackupFile');
  importButton?.addEventListener('click', () => importFile?.click());
  importFile?.addEventListener('change', () => { const file = importFile.files?.[0]; if (file) importBackup(file); importFile.value = ''; });
  elements.amount?.addEventListener('keydown', event => {
    if (event.key === 'Enter') handleSave();
  });
  elements.calendar?.addEventListener('click', event => {
    const dayButton = event.target.closest('[data-day]');
    if (!dayButton) return;
    const day = Number(dayButton.dataset.day);
    const today = new Date();
    if (!Number.isInteger(day) || day < 1 || day > new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() || day > today.getDate()) {
      const validation = document.getElementById('calendarValidation');
      if (validation) { validation.textContent = '⚠️ Solo puedes marcar días válidos de este mes que ya hayan comenzado.'; validation.classList.add('is-warning'); }
      return;
    }
    toggleSavedDay(day);
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
