# Camino a Cancún 2026

Aplicación web/PWA de ahorro personal para alcanzar una meta de **$3.000.000 COP**.

## Estructura

```text
Camino_A_Cancun_2026/
├── index.html
├── manifest.json
├── sw.js
├── img/
│   └── fondo.jpg
├── css/
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   ├── animations.css
│   └── responsive.css
└── js/
    ├── config.js
    ├── storage.js
    ├── state.js
    ├── utils.js
    ├── ui.js
    ├── charts.js
    ├── effects.js
    ├── app.js
    └── app.bundle.js
```

## Funcionalidades

- Registro de aportes de ahorro.
- Persistencia local mediante `localStorage`.
- Historial de aportes.
- Metas intermedias.
- Barra de progreso.
- Gráfico acumulado y gráfico mensual con Canvas, sin dependencia externa.
- Calendario de constancia.
- Animaciones y confeti al alcanzar la meta.
- Diseño responsive para escritorio y móvil.
- PWA con Service Worker.

## Datos

Los datos de la aplicación se conservan en el navegador mediante `localStorage`. El botón **Reiniciar** elimina únicamente los datos utilizados por esta aplicación; no borra otras claves de `localStorage`.

## Configuración

Los valores principales están centralizados en `js/config.js`, incluyendo la meta, hitos y fecha objetivo del viaje.

> Nota: la fecha original del proyecto se mantuvo en `2026-07-01`. Si la fecha real del viaje es otra, cámbiala únicamente en `js/config.js`.

## Ejecución

Para probar la PWA y el Service Worker, se recomienda abrir el proyecto mediante un servidor local, por ejemplo con VS Code + Live Server. La aplicación utiliza un `app.bundle.js` autónomo para que los botones y la lógica funcionen también al abrir `index.html` directamente. Para instalar/probar la PWA y el Service Worker se recomienda HTTP/HTTPS (por ejemplo, VS Code + Live Server).
