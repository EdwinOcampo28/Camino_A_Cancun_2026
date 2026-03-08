const goal = 3000000;

let saved = Number(localStorage.getItem("saved")) || 0;
let history = JSON.parse(localStorage.getItem("history")) || [];
let savedDays = JSON.parse(localStorage.getItem("savedDays")) || [];

const milestones = [1000000,2000000,3000000];

/* ELEMENTOS */

const savedEl = document.getElementById("saved");
const remainingEl = document.getElementById("remaining");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const calendar = document.getElementById("calendar");
const historyList = document.getElementById("historyList");

let chart;
let monthlyChart;

/* UTILIDADES */

function formatMoney(value){
return value.toLocaleString("es-CO");
}

function getCumulativeData(){

return history.reduce((acc,h,i)=>{
acc.push((acc[i-1]||0)+h.amount);
return acc;
},[]);

}

/* ACTUALIZAR UI */

function updateUI(){

animateValue(savedEl, 0, saved, 800);

const diff = goal - saved;

if(diff > 0){
remainingEl.textContent = "Faltan $" + formatMoney(diff);
}else{
remainingEl.textContent = "Sobraste $" + formatMoney(Math.abs(diff));
}

const percent = Math.min((saved/goal)*100,100);

progressBar.style.width = percent + "%";
progressBar.textContent = Math.floor(percent) + "%";

progressText.textContent = percent.toFixed(1) + "% completado";

localStorage.setItem("saved", saved);

updateMilestones();
updateChart();
updateMonthlyChart();
updateHistory();

if(saved >= goal){
notify("🎉 Meta alcanzada! Cancún te espera!");
launchConfetti();
}

}

/* AGREGAR AHORRO */

function addSavings(){

const input = document.getElementById("amount");
const value = Number(input.value);

if(value <= 0 || isNaN(value)){
alert("Ingresa un monto válido");
return;
}

saved += value;

history.push({
amount:value,
date:new Date().toISOString()
});

localStorage.setItem("history", JSON.stringify(history));

input.value = "";

updateUI();

}

/* HISTORIAL */

function updateHistory(){

if(!historyList) return;

historyList.innerHTML = "";

history.slice().reverse().forEach(h => {

const li = document.createElement("li");

const date = new Date(h.date).toLocaleDateString("es-CO");

li.textContent = `${date} - $${formatMoney(h.amount)}`;

historyList.appendChild(li);

});

}

/* METAS */

function updateMilestones(){

const list = document.getElementById("milestones");
if(!list) return;

list.innerHTML = "";

milestones.forEach(m => {

const li = document.createElement("li");

li.textContent = (saved >= m ? "✅ " : "⬜ ") + "$" + formatMoney(m);

list.appendChild(li);

});

}

/* CALENDARIO */

function createCalendar(){

if(!calendar) return;

for(let i = 1; i <= 30; i++){

const day = document.createElement("div");

day.classList.add("day");
day.textContent = i;

if(savedDays.includes(i)){
day.classList.add("saved");
}

day.onclick = () => {

if(day.classList.contains("saved")){

day.classList.remove("saved");

savedDays = savedDays.filter(d => d !== i);

}else{

day.classList.add("saved");

savedDays.push(i);

}

localStorage.setItem("savedDays", JSON.stringify(savedDays));

};

calendar.appendChild(day);

}

}

/* GRAFICO PROGRESO */

function createChart(){

const ctx = document.getElementById("chart");
if(!ctx) return;

chart = new Chart(ctx,{

type:"line",

data:{
labels: history.map((_,i) => "Ahorro " + (i+1)),
datasets:[{
label:"Progreso total",
data: getCumulativeData(),
fill:true,
tension:.3
}]
},

options:{
responsive:true,
animation:{
duration:1500,
easing:'easeOutQuart'
},
plugins:{
legend:{display:false}
}
}

});

}

function updateChart(){

if(!chart){
createChart();
return;
}

chart.data.labels = history.map((_,i)=>"Ahorro "+(i+1));
chart.data.datasets[0].data = getCumulativeData();

chart.update();

}

/* DATOS MENSUALES */

function createMonthlyData(){

const months = {};

history.forEach(h => {

const d = new Date(h.date);
const key = d.getMonth()+1;

if(!months[key]) months[key] = 0;

months[key] += h.amount;

});

return months;

}

/* GRAFICO MENSUAL */

function updateMonthlyChart(){

const ctx = document.getElementById("monthlyChart");
if(!ctx) return;

const data = createMonthlyData();

const labels = Object.keys(data);
const values = Object.values(data);

if(!monthlyChart){

monthlyChart = new Chart(ctx,{

type:"bar",

data:{
labels:labels,
datasets:[{
label:"Ahorro mensual",
data:values
}]
},

options:{
responsive:true,
animation:{
duration:1500,
easing:'easeOutQuart'
},
plugins:{
legend:{display:false}
}
}

});

return;

}

monthlyChart.data.labels = labels;
monthlyChart.data.datasets[0].data = values;

monthlyChart.update();

}

/* CONFETI */

function launchConfetti(){

for(let i=0;i<100;i++){

const confetti = document.createElement("div");

confetti.className="confetti";

confetti.style.left=Math.random()*100+"%";
confetti.style.animationDelay=Math.random()*2+"s";

document.body.appendChild(confetti);

setTimeout(()=>confetti.remove(),3000);

}

}

/* NOTIFICACIONES */

function notify(msg){

if(!("Notification" in window)) return;

if(Notification.permission === "granted"){
new Notification(msg);
}

}

/* CONTADOR VIAJE */

function countdown(){

const tripDate = new Date("2026-07-01");
const today = new Date();

const diff = tripDate - today;

const days = Math.ceil(diff/(1000*60*60*24));

const el = document.getElementById("countdown");

if(el){
el.textContent = "Faltan " + days + " días para Cancún";
}

}

/* ACTIVAR NOTIFICACIONES */

function initNotifications(){

if("Notification" in window){
Notification.requestPermission();
}

}

/* SERVICE WORKER */

function registerSW(){

if("serviceWorker" in navigator){

navigator.serviceWorker
.register("sw.js")
.catch(err => console.log("SW error", err));

}

}

/* EVENTOS */

document.getElementById("saveBtn")?.addEventListener("click", addSavings);

document.getElementById("resetBtn")?.addEventListener("click", () => {

if(confirm("¿Reiniciar progreso?")){

localStorage.clear();
location.reload();

}

});

/* INIT */

createCalendar();
updateUI();
countdown();
initNotifications();
registerSW();

/* SCROLL HERO */

function scrollToSavings(){

const section = document.getElementById("dashboard");

section?.scrollIntoView({
behavior:"smooth"
});

}

/* CONTADOR ANIMADO */

function animateValue(element, start, end, duration){

let startTime = null;

function animation(currentTime){

if(!startTime) startTime = currentTime;

const progress = Math.min((currentTime - startTime)/duration,1);

const value = Math.floor(progress*(end-start)+start);

if(element){
element.textContent = value.toLocaleString("es-CO");
}

if(progress < 1){
requestAnimationFrame(animation);
}

}

requestAnimationFrame(animation);

}

/* PARALLAX */

window.addEventListener("scroll", () => {

const scroll = window.scrollY;

document.body.style.backgroundPositionY = scroll * 0.4 + "px";

});