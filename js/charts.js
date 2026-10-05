import { getCumulativeData, getMonthlyData, formatMoney } from './utils.js';

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

export function renderCharts(history) {
  const progressCanvas = document.getElementById('chart');
  const monthlyCanvas = document.getElementById('monthlyChart');
  if (!progressCanvas || !monthlyCanvas) return;
  const cumulative = getCumulativeData(history);
  const monthly = getMonthlyData(history);
  drawLine(progressCanvas, cumulative);
  drawBars(monthlyCanvas, monthly);
  charts.set('progress', progressCanvas); charts.set('monthly', monthlyCanvas);
}

export function resizeCharts() {
  const progressCanvas = charts.get('progress');
  const monthlyCanvas = charts.get('monthly');
  if (!progressCanvas || !monthlyCanvas) return;
  drawLine(progressCanvas, getCumulativeData([]));
}
