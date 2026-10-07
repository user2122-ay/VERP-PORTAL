# Actualización: Dark Web, Panel Delictivo y MDT

No hay variables nuevas. Se usan las que ya tienes: `POLICIA_ROLE_IDS`, `DELICTIVO_ROLE_IDS` (ya trae 1373359377217487060) y el bot de Discord.
Los enlaces "Delictivo" y "MDT" aparecen solos (se revisan los roles en Discord cada 5 minutos). Fundación siempre los ve. Las páginas comprueban el rol EN VIVO con el bot.

## Qué hay de nuevo
- **Mercado → pestaña Negocios** (ya no hay "Negocios" en el menú). Precios: Móvil $120.000, Tool Store $125.000. El Taller clandestino ($95.000) solo se compra dentro de la Dark Web.
- **Inventario** con foto, categoría, placa y etiqueta roja parpadeante **ROBADO**. Los autos comprados reciben placa automática (ej. AB123CD).
- **Dark Web** (`/darkweb`, requiere VPN): taller clandestino, ofertas de autos robados con chat y contraoferta, reventa del taller.
- **Panel delictivo** (`/delictivo`): asaltar (la víctima acepta/rechaza y desmarca lo que no entrega) y solicitud de robo de autos al staff.
- **Administración → pestaña Solicitudes**: aprobar o rechazar robos de autos. Al aprobar, el auto llega ROBADO al inventario y se crea el reporte para la policía.
- **MDT** (`/mdt`): ciudadanos (con su cédula, vehículos, arrestos y expedientes), expedientes (crear, notas, cerrar/reabrir), arrestos (comisión 5%) y reportes con seguimiento e interruptor de "resuelto".

## Colecciones nuevas en Mongo (se crean solas)
`dw`, `asaltos`, `robos`, `reportes`, `expedientes`, `arrestos`.

## Archivos nuevos
lib/rol.js, lib/placa.js, components/CedulaCard.js, app/darkweb/*, app/delictivo/*, app/mdt/*, app/api/darkweb, app/api/delictivo, app/api/mdt, app/mercado/Negocios.js, app/notificaciones/Asaltos.js

## Actualización 2: catálogo del mercado, placas y MDT
- **Catálogo nuevo** (lib/catalogo.js, fotos en public/items): Palanca $800, Taladro $500, Martillo $900, Bate $800, Guantes de cuero $3.500, Guantes quirúrgicos $1.500, Placa debilitadora $1.000, Ipone P Max 28 $1.800, Samsun Galaxy S78 Ultra $1.790, Celular Desechable $900, Computadora $2.500, Laptop Hacker $6.500, Dron S45 $4.500, Radio/Scaner $1.500, Desactivador $5.500, Acceso a la Dark Web $5.000 (dura 5 días).
- Se aplican una sola vez (CATALOGO_V = 2). Para cambiar algo después, edita el catálogo y sube CATALOGO_V.
- Los artículos viejos (celulares de ejemplo, pendrive, radios) se borran del mercado; quien ya los compró los conserva.
- El mínimo de precio de la Tool Store baja a $500 (antes $2.000), porque hay artículos desde $500.
- **Placas VEN-000** automáticas al comprar un auto (registradas a nombre del comprador). **Casas**: preguntan el color al comprar.
- **MDT**: buscar auto por matrícula (muestra el dueño oficial; si el auto se vendió en la Dark Web ya no figura el dueño anterior) y reportes de robo sin foto.
- Colección nueva en Mongo: `placas`.
