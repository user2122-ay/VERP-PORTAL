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

## Actualización 3: Armería, tarjeta Provincial y 911
- **Armería Liberty Guns & Ammo** ($95.000, foto en public/negocios/armeria.jpg): el dueño edita los precios de las armas y lo que se vende le llega a su Tarjeta de Comerciante. Los artículos que Administración crea en la categoría "Armas" quedan ligados a este negocio automáticamente (igual que Herramientas, Telefonía/Tecnología y Concesionario).
- **Tarjeta VE:RP Provincial** ($35, membresía $2/semana, se cobra de la propia tarjeta o de otro banco). Logo de VE:RP en lugar del de la red de pagos.
- **911**: el mapa del ciudadano ahora tiene zoom (botones +/−, pellizco y rueda). En la MDT (pestaña Reportes) hay un mapa con un punto por llamado, el botón **Atender llamado** (el ciudadano recibe un aviso), y suena una alerta cuando entra uno nuevo.
- **Impuesto de ventas de negocios**: listo pero APAGADO. Para activarlo cambia `IMPUESTO_NEGOCIO = 0` por `0.05` (5%) en lib/negocios.js.

## Actualización 4: licencias y Mercado por categorías
- **3 licencias** en el Mercado (categoría Licencias): Conducir $600, Armas $2.500, Embarcaciones $10.000 (por ahora solo se vende, no bloquea nada).
- **Bloqueos**: sin Licencia de Conducir no se pueden comprar vehículos; sin Licencia de Armas no se pueden comprar armas. Se valida también en el servidor. Las licencias ya compradas salen bloqueadas ("Ya la tienes").
- **Licencias personalizadas**: cada una es una tarjeta con foto, nombre y cédula del ciudadano y un número inventado (ej. LC-K7QD-3MX9, formato que no se parece a los reales). Se ven en Inventario y en la ficha de la MDT, que además dice si tiene o no licencia de conducir y de armas.
- **Mercado**: botones arriba (Todo, Tarjetas, Licencias, Concesionario, Propiedades, Armas, Herramientas, Telefonía, Tecnología, Negocios).
- Las licencias que ya existan en el servidor como artículos creados por staff se reconocen por el nombre.

## Actualización 5: casa, allanamientos, MDT con acceso y staff
- **Inventario con dos clases**: *Personal* (lo que llevas encima) y *Casa*. Con una casa puedes guardar objetos legales o ilegales y elegir **en qué parte de la casa** los escondes. Guardar tiene un enfriamiento de **10 minutos** entre objeto y objeto. No se guardan vehículos, casas ni licencias.
- **Asaltos**: solo se puede robar lo que la víctima lleva encima. En el panel delictivo el ladrón ve el efectivo y los objetos que lleva encima y elige; lo guardado en casa no aparece ni se puede robar.
- **MDT › Casas**: cualquier agente solicita un allanamiento; desde **Comisario** en adelante se aprueba o rechaza (no se puede aprobar la propia solicitud). Si se aprueba, el agente que lo pidió puede entrar durante 1 hora y ver qué escondió el sujeto y dónde. El dueño recibe un aviso.
- **MDT con acceso**: pantalla con el logo de Justicia y Paz, animación y sonido, bienvenida con rango y nombre, y luego solo pide la **placa** (5 fallos bloquean 5 minutos; la sesión dura 8 horas). Solo entran los agentes asignados desde Administración.
- **Administración → Agentes MDT**: asigna usuario de Discord, rango (Agente… Ministro del Interior), placa y departamento (incluye "Ministro del Interior"). Hacen todo menos Moderador.
- **Developer** (`itsanthony_21`): acceso total, incluida la pestaña **Staff** donde asigna a su equipo: Junta Directiva, Fundación y Asuntos Internos (hacen todo en Administración) y Moderador (solo revisa Solicitudes).
  - El Developer se fija a la primera cuenta que inicie sesión con ese usuario (así nadie puede quedarse con el nombre si lo cambias). Para más seguridad usa `DEVELOPER_IDS` (IDs de Discord). Hay que **cerrar sesión y volver a entrar una vez** para activarlo.
  - Quien asignes debe haber iniciado sesión en el portal al menos una vez.
- Colecciones nuevas: `allanamientos`, `config`.

## Actualización 6: tesorería, impuestos, sueldos, garaje y staff con placa
- **Garaje**: los autos (normales o robados) se guardan en una casa, en el garaje. **Solo cabe un auto por casa.** Los objetos robados también se pueden guardar en casa. Un auto guardado no se puede robar ni vender hasta que lo saques.
- **Staff con placa**: se eliminaron las variables `FUNDACION_IDS`, `ASUNTOS_INTERNOS_IDS`, `MODERACION_IDS` y todas las `*_ROLE_IDS` de staff. Solo entra a Administración quien esté asignado en **Administración → Staff**, y al entrar pide su **placa** (5 fallos = 5 minutos bloqueado; la sesión dura 8 horas). El Developer entra con su placa (`DEV-001` si no tiene otra). **Developer, Fundación y Asuntos Internos pueden añadir y quitar staff** (la placa es obligatoria y no se repite). Quien ya estaba asignado sin placa debe recibir una.
- **MDT · agregar agente**: departamentos Ministro del Interior, Policía Nacional Bolivariana, SEBIN y CICPC, más el **sueldo semanal**.
- **MDT · Mi sueldo**: cada agente elige en qué cuenta recibe el sueldo (efectivo o cualquiera de sus tarjetas, menos la de Comerciante).
- **MDT · Tesorería** (solo Ministro del Interior): saldo, ingresos y egresos, movimientos, nómina de la semana, y qué negocios pagan o evaden impuestos. El botón **Liberar sueldos** paga a cada agente desde la Tesorería (una vez cada 7 días por agente; si no alcanza el dinero, paga a quienes alcance). Queda en la auditoría.
- **ITBMS 7%**: todo lo que se compra en el Mercado lleva 7% sobre el precio (se muestra el total antes de pagar) y va a la Tesorería. El mercado negro (Dark Web, taller clandestino) **no paga impuestos**. Si el dueño de un negocio decide **no pagar**, ese 7% se queda con él y la Tesorería lo registra como evadido. Se cambia en Inventario → Negocios.
- **Inventario → Negocios**: al comprar un negocio aparece esta pestaña con el panel para cambiar precios y decidir si paga el impuesto.
- **Taller clandestino → vender a la página**: un auto robado se vende por un máximo de $15.000 y solo puedes ganar $1.000 sobre lo que pagaste (si lo compraste en $4.500, lo vendes hasta en $5.500).
- **WhatsApp**: se quitó subir fotos de la galería. Los estados son un **link** de foto (jpg, png, gif, webp) o video (mp4, webm, mov) de Discord o Imgur. La foto de perfil de cada contacto es su avatar de Roblox (el de la cédula).
- Colecciones nuevas: `tesoreria` y el documento `config` `{_id:"tesoreria"}`. Sin variables nuevas.
- **Para pausar**: membresías de booster y beneficios automáticos siguen anotados para después.

## Actualización 5: Tesorería, sueldos por rango, Dark Web y Teléfono
- **Tesorería** empieza con $3.000.000 (se aplica una sola vez). Los impuestos de transferencias de los bancos ahora entran a la Tesorería.
- **Impuesto a los objetos (ITBMS)**: el Ministro del Interior lo cambia en MDT → Tesorería (0% a 30%, antes fijo en 7%). Se aplica en el Mercado y en la compra.
- **Sueldos**: ya no se ponen en Administración. En MDT → Tesorería, el Ministro elige departamento y rango, escribe el sueldo y ve la lista de miembros con ese rango; "Liberar sueldo" les paga (una vez por semana cada uno).
- **Rangos** (Administración → Agentes MDT, según departamento): PNB, CICPC y SEBIN con las listas oficiales. Los agentes que ya estaban con rangos viejos (Agente, Sargento, Director...) deben reasignarse en Administración.
- **Dark Web**: se quitó "Revender un auto de mi taller". La venta de autos robados a la página (con o sin dueño del taller) ahora paga según el humor del día (x0.60 a x1.40, aleatorio, cambia cada día).
- **Menús**: en computadora los botones de arriba (menú y categorías del Mercado) ya se acomodan en varias filas y se ven todos.
- **Administración**: logo centrado y título "Administración Y Asuntos Internos De Venezuela Community".
- **Teléfono** (antes WhatsApp): hay que comprar el teléfono. Dentro salen dos opciones grandes: "?" TikVerp (izquierda, próximamente) y VE WhatsApp (derecha). WhatsApp pide solo el chip, ya no el plan de datos.
- Colecciones/documentos nuevos en Mongo (se crean solos): config `sueldos`, config `mnegro`.
