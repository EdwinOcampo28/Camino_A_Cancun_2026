import { getCumulativeData, getMonthlyData, formatMoney } from './utils.js';

const chartState = { progress: null, monthly: null, history: [] };

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const width = Math.max(280, Math.floor(rect.width || 600));
  const height = Math.max(250, Math.floor(rect.height || 320));
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
  const g=ctx.createLinearGradient(0,0,width,height); g.addColorStop(0,'#f7fbff'); g.addColorStop(1,'#edf7fb');
  roundRect(ctx,2,2,width-4,height-4,22); ctx.fillStyle=g; ctx.fill();
  ctx.textAlign='center'; ctx.fillStyle='#17324d'; ctx.font='700 16px Poppins, sans-serif'; ctx.fillText(title,width/2,height/2-9);
  ctx.fillStyle='#71849a'; ctx.font='500 12px Poppins, sans-serif'; ctx.fillText(subtitle,width/2,height/2+17);
}
function drawLine(canvas, values) {
  if (!values.length) return drawEmpty(canvas,'Tu viaje empieza con un aporte','Registra tu primer ahorro para ver crecer la curva');
  const {ctx,width,height}=setupCanvas(canvas); ctx.clearRect(0,0,width,height);
  const p={l:64,r:22,t:32,b:42}, w=width-p.l-p.r, h=height-p.t-p.b;
  const max=Math.max(...values,100000); const top=max*1.12;
  const xAt=i=>values.length===1?p.l+w/2:p.l+w*i/(values.length-1);
  const yAt=v=>p.t+h-(v/top)*h;
  // clean plotting surface
  const bg=ctx.createLinearGradient(0,0,width,height); bg.addColorStop(0,'#fbfdff'); bg.addColorStop(1,'#f5faff');
  roundRect(ctx,2,2,width-4,height-4,22); ctx.fillStyle=bg; ctx.fill();
  ctx.font='500 10px Poppins, sans-serif'; ctx.textAlign='right'; ctx.fillStyle='#7a8ca2'; ctx.strokeStyle='#e4edf5'; ctx.lineWidth=1;
  for(let i=0;i<=4;i++){const val=top*i/4,y=yAt(val);ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(width-p.r,y);ctx.stroke();ctx.fillText(moneyShort(val),p.l-10,y+4);}
  const pts=values.map((v,i)=>({x:xAt(i),y:yAt(v),v,i}));
  // smooth bezier path
  const path=()=>{ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++){const prev=pts[i-1],cur=pts[i],mid=(prev.x+cur.x)/2;ctx.bezierCurveTo(mid,prev.y,mid,cur.y,cur.x,cur.y);}};
  const area=ctx.createLinearGradient(0,p.t,0,p.t+h);area.addColorStop(0,'rgba(14,165,233,.27)');area.addColorStop(.65,'rgba(14,165,233,.08)');area.addColorStop(1,'rgba(14,165,233,0)');
  path();ctx.lineTo(pts[pts.length-1].x,p.t+h);ctx.lineTo(pts[0].x,p.t+h);ctx.closePath();ctx.fillStyle=area;ctx.fill();
  path();const line=ctx.createLinearGradient(p.l,0,width-p.r,0);line.addColorStop(0,'#0ea5e9');line.addColorStop(1,'#6366f1');ctx.strokeStyle=line;ctx.lineWidth=3.5;ctx.lineJoin='round';ctx.lineCap='round';ctx.shadowColor='rgba(14,165,233,.22)';ctx.shadowBlur=10;ctx.stroke();ctx.shadowBlur=0;
  const indexes=pts.length<=7?pts.map((_,i)=>i):[0,Math.floor((pts.length-1)/3),Math.floor((pts.length-1)*2/3),pts.length-1];
  pts.forEach((pt,i)=>{if(!indexes.includes(i))return;ctx.beginPath();ctx.arc(pt.x,pt.y,6,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#0ea5e9';ctx.stroke();});
  ctx.textAlign='center';ctx.fillStyle='#8292a6';ctx.font='500 10px Poppins, sans-serif';
  indexes.forEach((idx,j)=>{const label=pts.length===1?'Inicio':pts.length<=7?`Aporte ${idx+1}`:j===0?'Inicio':j===indexes.length-1?'Último':'Ahorro';ctx.fillText(label,pts[idx].x,height-17);});
}
function drawBars(canvas, items) {
  if (!items.length) return drawEmpty(canvas,'Aún no hay meses registrados','Los aportes se agruparán aquí por mes');
  const {ctx,width,height}=setupCanvas(canvas);ctx.clearRect(0,0,width,height);
  const p={l:58,r:18,t:34,b:45},w=width-p.l-p.r,h=height-p.t-p.b,max=Math.max(...items.map(x=>x.value),10000),top=max*1.18;
  const bg=ctx.createLinearGradient(0,0,width,height);bg.addColorStop(0,'#fcfdff');bg.addColorStop(1,'#f4f8ff');roundRect(ctx,2,2,width-4,height-4,22);ctx.fillStyle=bg;ctx.fill();
  ctx.strokeStyle='#e5edf6';ctx.lineWidth=1;ctx.fillStyle='#8292a6';ctx.font='500 10px Poppins, sans-serif';ctx.textAlign='right';
  for(let i=0;i<=4;i++){const val=top*i/4,y=p.t+h-h*i/4;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(width-p.r,y);ctx.stroke();ctx.fillText(moneyShort(val),p.l-9,y+4);}
  const slot=w/items.length,barW=Math.min(58,slot*.56);
  items.forEach((item,i)=>{
    const x=p.l+slot*i+(slot-barW)/2, bh=Math.max(4,(item.value/top)*h),y=p.t+h-bh;
    // soft track and colored gradient bar
    ctx.fillStyle='#e9f0fa';roundRect(ctx,x,p.t,barW,h,barW/2);ctx.fill();
    const grad=ctx.createLinearGradient(0,y,0,p.t+h);grad.addColorStop(0,'#7c6cf4');grad.addColorStop(.55,'#4f8df5');grad.addColorStop(1,'#22c6c8');
    roundRect(ctx,x,y,barW,Math.max(barW*.45,bh),barW/2);ctx.fillStyle=grad;ctx.fill();
    ctx.fillStyle='#50647e';ctx.textAlign='center';ctx.font='600 10px Poppins, sans-serif';ctx.fillText(item.label,x+barW/2,height-18);
    if(items.length<=7){ctx.fillStyle='#1e3551';ctx.font='700 10px Poppins, sans-serif';ctx.fillText(moneyShort(item.value),x+barW/2,Math.max(18,y-9));}
  });
}
export function renderCharts(history) {
  chartState.history=Array.isArray(history)?history:[];
  chartState.progress=document.getElementById('chart');chartState.monthly=document.getElementById('monthlyChart');
  if(!chartState.progress||!chartState.monthly)return;
  drawLine(chartState.progress,getCumulativeData(chartState.history));drawBars(chartState.monthly,getMonthlyData(chartState.history));
}
export function resizeCharts(){renderCharts(chartState.history);}
window.addEventListener('resize',()=>{clearTimeout(window.__cancunChartResize);window.__cancunChartResize=setTimeout(resizeCharts,120);},{passive:true});
