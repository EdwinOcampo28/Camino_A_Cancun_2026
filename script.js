const goal = 4000000;

let saved = Number(localStorage.getItem("saved")) || 0;
let history = JSON.parse(localStorage.getItem("history")) || [];
let savedDays = JSON.parse(localStorage.getItem("savedDays")) || [];

const milestones = [1000000,2000000,3000000,4000000];

/* ELEMENTOS */

const savedEl = document.getElementById("saved");
const remainingEl = document.getElementById("remaining");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const calendar = document.getElementById("calendar");

let chart;
let monthlyChart;

/* FORMATEO MONEDA */

function formatMoney(value){
return value.toLocaleString("es-CO");
}

/* ACTUALIZAR UI */

function updateUI(){

savedEl.textContent = formatMoney(saved);
remainingEl.textContent = formatMoney(goal - saved);

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

const list = document.getElementById("historyList");

list.innerHTML = "";

history.slice().reverse().forEach(h => {

const li = document.createElement("li");

const date = new Date(h.date).toLocaleDateString("es-CO");

li.textContent = date + " - $" + formatMoney(h.amount);

list.appendChild(li);

});

}

/* METAS INTERMEDIAS */

function updateMilestones(){

const list = document.getElementById("milestones");

list.innerHTML = "";

milestones.forEach(m => {

const li = document.createElement("li");

li.textContent = (saved >= m ? "✅ " : "⬜ ") + "$" + formatMoney(m);

list.appendChild(li);

});

}

/* CALENDARIO */

function createCalendar(){

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

chart = new Chart(ctx,{

type:"line",

data:{
labels: history.map((_,i) => "Ahorro " + (i+1)),
datasets:[{
label:"Progreso total",
data: history.map(h => h.amount),
fill:true,
tension:.3
}]
},

options:{
responsive:true,
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
chart.data.datasets[0].data = history.map(h=>h.amount);

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

const data = createMonthlyData();

const labels = Object.keys(data);
const values = Object.values(data);

const ctx = document.getElementById("monthlyChart");

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

navigator.serviceWorker.register("sw.js")
.catch(err => console.log("SW error", err));

}

}

/* EVENTOS */

document.getElementById("saveBtn").addEventListener("click", addSavings);

document.getElementById("resetBtn").addEventListener("click", () => {

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