# Camino a Cancún 2027

Aplicación web/PWA de ahorro personal para alcanzar una meta de **$7.000.000 COP**.

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
- Anillo visual de progreso y ritmo diario/semanal sugerido según los días restantes.
- Detalles de bitácora y sello retro de destino.

- Registro de aportes de ahorro.
- Persistencia local mediante `localStorage`.
- Historial de aportes.
- Metas intermedias.
- Barra de progreso.
- Gráfica acumulada rediseñada con curva suavizada, área degradada y puntos destacados.
- Gráfica mensual rediseñada con barras degradadas, pistas de fondo y etiquetas compactas.
- Redimensionamiento adaptativo de gráficas y renderizado Canvas sin dependencia externa.
- Calendario de constancia.
- Animaciones y confeti al alcanzar la meta.
- Diseño responsive para escritorio y móvil.
- PWA con Service Worker.

## Datos

Los datos de la aplicación se conservan en el navegador mediante `localStorage`. El botón **Reiniciar** elimina únicamente los datos utilizados por esta aplicación; no borra otras claves de `localStorage`.

## Diseño visual

La interfaz usa una estética retro moderna de bitácora tropical: papel crema, verde bosque, terracota y mostaza; tablas editoriales, sellos de viaje, un anillo de progreso y métricas orientativas de ahorro diario/semanal. Las gráficas Canvas usan la misma paleta y no requieren librerías externas.

## Configuración

Los valores principales están centralizados en `js/config.js`, incluyendo la meta, hitos y fecha objetivo del viaje.

> Nota: La fecha de referencia está configurada para `2027-07-01` y la meta sugerida es de $7.000.000 COP. El presupuesto es orientativo para una persona y un viaje de 5–7 días; verifica vuelos, alojamiento y actividades antes de tomarlo como cifra definitiva.

## Ejecución

Para probar la PWA y el Service Worker, se recomienda abrir el proyecto mediante un servidor local, por ejemplo con VS Code + Live Server. La aplicación utiliza un `app.bundle.js` autónomo para que los botones y la lógica funcionen también al abrir `index.html` directamente. Para instalar/probar la PWA y el Service Worker se recomienda HTTP/HTTPS (por ejemplo, VS Code + Live Server).

## Ajustes visuales v7
- Calendario mensual compacto con días de la semana, mes actual y fechas futuras deshabilitadas.
- Validación de selección para impedir marcar días futuros o fuera del mes vigente.
- Mensaje accesible que indica cuántos días están marcados y explica cómo desmarcarlos.
- Tarjetas de progreso del ahorro y ahorro mensual reducidas para dar más espacio al contenido principal.
- Se conserva el esquema de almacenamiento local existente.


## Versión 8 · panel superior compacto e interactivo
- Se eliminó la gráfica independiente de ahorro mensual para reducir ruido visual.
- El gráfico de progreso acumulado permite alternar entre todo el historial y los últimos 10 aportes.
- Al pasar el cursor o explorar con teclado se muestran fecha, valor del aporte y acumulado.
- Gráfica, calendario y bitácora están agrupados en una fila centrada y compacta, con adaptación responsive.


## Versión 11 · Progreso protagonista
- Se retiraron de la interfaz el calendario de ahorro y la bitácora de aportes.
- El gráfico de progreso acumulado ahora ocupa el ancho principal, con mejor jerarquía visual, área más amplia y controles interactivos.
- Se conservan el registro de aportes, la meta, los hitos y el almacenamiento local.


## Novedades de la versión 13
- Accesos rápidos para llenar el monto de ahorro con un toque.
- Planificador semanal que estima semanas y fecha para alcanzar la meta de $7.000.000 COP.
- Aviso si el ritmo estimado alcanzaría la meta después de la fecha del viaje.
- Estilos adicionales en `css/plan-enhancements.css`.
- El planificador es orientativo y no incluye intereses ni rendimientos.


## Novedades v16
- Reto mensual automático con objetivo orientativo de $300.000 COP, calculado a partir de los aportes registrados en el mes actual.
- Restauración de copias JSON exportadas por la aplicación, con validación de formato y confirmación antes de reemplazar los datos.
- La restauración comprueba que la suma de los movimientos sea coherente con el total guardado.


## Versión 17 — Reto y planificador juntos
El reto mensual y el planificador semanal aparecen ahora juntos en una fila equilibrada en escritorio y se apilan en pantallas pequeñas.
