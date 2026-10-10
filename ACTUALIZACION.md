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

## Actualización 7: finanzas, Mercado con colores, banco, tarjetas nuevas y TikVerp
- **Inventario → Negocios**: a la derecha de cada negocio hay un panel de **Finanzas de la empresa**: ganado (verde), perdido/invertido (rojo), balance neto, ventas, ITBMS remitido y evadido, y últimas ventas. Los contadores se llevan en `negocios` (`ganado`, `perdido`, `ventas`, `impuestoPagado`, `evadido`, `inversion`); las ventas anteriores a esta actualización no están en el historial (la inversión sí se calcula con el precio del negocio).
- **Concesionario**: color del auto con muestras; cada 3 horas "llegan" otros colores (`lib/colores.js`: `ROTACION_H`, `CUANTOS`, `PALETA`). **Detalles** opcionales (Tintes dorados, Rines dorados, etc., lista `DETALLES`, gratis por ahora). Se guardan en el inventario y en el registro de la placa.
- **Mercado**: los objetos (herramientas, armas, teléfonos, tecnología) solo se pueden tener 1. Los que tienen duración (acceso a la Dark Web) se renuevan: si aún está activo, se suman los días. Autos, casas y licencias siguen sus propias reglas.
- **MDT → Ciudadanos → buscar auto**: por matrícula o por modelo; muestra la foto del Concesionario, marca, año, clase, color, detalles y propietario. En la ficha del ciudadano cada auto lleva su foto.
- **Dark Web**: la cotización del mercado negro se renueva cada **2 horas** (antes cada día) y usa lenguaje profesional (demanda alta / estable / moderada / baja). Muestra la hora de la próxima actualización.
- **Banco**: nuevo **Retirar dinero** (de cualquier tarjeta, incluida Comerciante), **Entre mis tarjetas** en Pago móvil (instantáneo y sin impuesto), y la cédula del destinatario ahora tiene selector **V / E** (en celular el teclado numérico no deja escribir la V).
- **Tarjetas**: solo se ven los 4 primeros dígitos (el resto son puntos). Tarjetas nuevas **VERNESCO** ($20, prefijo 7500) y **VERCARIBE Platinum** ($60, prefijo 7400) con el logo VE y el logo VERP; precios y nombres en `lib/bancos.js`. El logo VE completo está en `public/ve-logo-full.png`.
- **TikVerp** (`/tikverp`, desde Teléfono): cuenta propia (usuario único, nombre, bio, foto por link de Discord), publicar fotos o videos por link (Discord/Imgur), música (catálogo de sonidos de la comunidad o crear uno con link de audio de Discord), feed "Para ti" y "Siguiendo", me gusta (doble toque), comentarios, compartir (copiar enlace o enviar por VE WhatsApp), seguidores, búsqueda por persona o #hashtag y avisos. El staff puede borrar publicaciones y comentarios. Logo nuevo en `public/tikverp-logo.png`.
- Colecciones nuevas en Mongo (se crean solas): `tv_perfiles`, `tv_posts`, `tv_likes`, `tv_com`, `tv_follows`, `tv_sonidos`.

## Actualización 8: multas, decomisos, casas y segunda mano
- **MDT → Multas** (solo Policía Nacional Bolivariana; el Developer también): ciudadano, monto, artículos infringidos (uno por línea), observaciones y plazo (**mínimo 10 días**, máximo 60). La multa NO se cobra sola: le llega al ciudadano a **Inventario → Multas** (con aviso) y la paga cuando quiera con efectivo o tarjeta; el dinero va a la Tesorería. Estados: pendiente, pagada y **vencida (desacato)**. En una vencida el oficial elige: **Detener** (queda en el historial de arrestos) o **Retirar licencia** (conducir o armas, los días que decida). Todas las multas (pagadas, pendientes y vencidas) salen en la ficha del ciudadano en la MDT. Colección nueva: `multas`.
- **MDT → Decomisos** (todos los agentes): armas, licencia de armas, licencia de conducir y autos que el sujeto lleve encima (lo guardado en casa solo se revisa con allanamiento). El oficial elige los **días**; al ciudadano le aparece en el inventario como **RETENIDO hasta…** y se libera solo al pasar el plazo. Mientras está retenido no se usa, vende, revende, guarda en casa ni se puede robar; una licencia retenida no vale (no puede comprar autos/armas) ni se puede comprar otra igual. El oficial puede **Devolver** antes de tiempo. Colección nueva: `decomisos`.
- **Inventario → Casa**: cada casa muestra su foto y lo que guardaste (con foto, placa o color). **Máximo 3 casas por usuario** (se valida al comprar y el Mercado muestra "Límite: 3 casas").
- **Revender**: en Inventario, cada objeto (herramientas, armas, teléfonos, tecnología) tiene el botón **Revender**: se vende por MENOS de lo que pagaste, sale del inventario y queda publicado; puedes cancelar y recuperarlo. No se revenden autos, casas, licencias, accesos con duración, robados, retenidos ni guardados en casa. Máximo 10 publicaciones abiertas.
- **Mercado → Segunda mano**: lista los objetos revendidos, con el precio nuevo para comparar. Se aplican las mismas reglas (armas piden licencia, objetos únicos no se repiten). No llevan ITBMS. Colección nueva: `usados`.

## Actualización 9: Mi sueldo y chip del Mercado
- **MDT → Mi sueldo**: ya no muestra un sueldo fijo; muestra el **último pago** (monto y fecha) y el **historial de pagos** con fecha. Se sigue eligiendo en qué cuenta se recibe.
- **Mercado → Chip de VE WhatsApp**: la tarjeta ahora tiene el mismo tamaño que las demás.

## Corrección: buscador de la MDT
- **MDT → Multas**: al pulsar "Buscar" ciudadano ya no se recarga la página ni te manda a Ciudadanos. El buscador estaba dentro del formulario de multar (dos formularios anidados) y enviaba el de afuera. Ahora es un buscador sin formulario, con Enter o el botón.

## Actualización 10: búsqueda en Multas
- **MDT → Multas → Buscar**: Enter y el botón Buscar solo buscan; ya no pueden enviar el formulario de la multa ni reiniciar la página (también en teclados de celular). Enter dentro de un campo de una línea del formulario ya no lo envía por accidente.
- La **pestaña de la MDT se recuerda**: si la página se recarga, vuelves a la misma pestaña y no a Ciudadanos.

## Actualización 11: comida y agua, muerte por CK, panel nuevo y miembros
- **Panel**: se quitó el acceso "VE WhatsApp" (queda el de Emergencias 911) y los cuadros de "Movimientos recientes" y "Avisos". En su lugar va el **sistema del cuerpo**: tu avatar de Roblox (cuerpo completo) con anillos de **Comida** y **Agua** (`app/Cuerpo.js`). El avatar se ve cada vez peor (gris, oscuro, tembloroso) mientras no comes ni bebes.
- **Comida y agua** bajan solas hasta 0% en 24 horas desde la última vez que comiste o bebiste (`lib/cuerpo.js`, `HORAS`). Se compran en **Mercado → Comida y bebida** (agua, jugo, refresco, empanada, arepa, hamburguesa, pabellón); se consumen al instante, llevan ITBMS y se cobran con efectivo o tarjeta. Para agregar más: añade una línea `F(...)` en `lib/catalogo.js`.
- **Moriste de sed o hambre = CK**: si comida o agua llega a 0% se bloquea toda la página (`/moriste`). Desde ahí puedes **Apelar CK** (escribes la razón, por ejemplo corte de luz; llega a Administración → **Apelaciones** y el Staff aprueba o deniega con razón) o **Crear otro usuario** (borra todo el personaje, `lib/ck.js`). Al enviar la apelación se le dice que abra un ticket en el Discord (pon `NEXT_PUBLIC_DISCORD_INVITE` para mostrar el botón). Si el Staff aprueba, vuelve con comida y agua al 100%. El Developer no se muere.
- **Dinero inicial**: ahora **$15.000** al registrarse (y al crear otro usuario o tras un CK).
- **Cabecera**: junto al logo se muestra cuántos **miembros** se han registrado (con cédula), abreviado (1.2k, 12.5k, 1.2M) y se actualiza cada minuto (`/api/miembros`, `lib/abrev.js`).
- Colecciones nuevas en Mongo (se crean solas): `apelaciones`.

## Actualización 12: comida con nevera, 4 negocios de comida, impuestos con clausura y WhatsApp desechable
- **Comida y bebida** (`lib/comida.js`): ahora se compra y va a **Inventario → Comida** (ya no se consume al instante). Cada una tiene su % (sube comida o agua), calificación ★, categoría (Comida rápida, Helados, Frutas, Bebidas) y **fecha de vencimiento**. Botones: **Comer / Beber**, **Botar**, **Guardar en la nevera** y **Sacar de la nevera**. **No lleva impuestos** y el precio máximo es **$500**. Para agregar productos: línea en `PRODUCTOS` y ponerla en el `MENUS` de la tienda que la vende (sube `CATALOGO_V`). Los productos sin tienda todavía (pollo, harina P.A.N., helados, Cocosette, Pepito, Maltín 1 L) ya tienen foto y % y esperan su negocio.
- **Vencidos**: comer o beber algo vencido tiene 70% de probabilidad de enfermarte: quita un pequeño % de comida y agua (4–12%) y te deja "enfermo" 2 horas (el panel lo avisa y el avatar se pone verdoso).
- **Neveras** (Tool Store, Mercado → Herramientas): Nevera Normal $5.000 (10 objetos), Refrigerador $7.890 (15) y Nevera de Lujo $10.000 (20). **Una por usuario** (de cualquier tipo) y **hay que tener casa**. La comida guardada dura 3 veces más. Si se llena sale "No hay espacio en tu nevera". En Inventario → Comida está **Ver nevera**.
- **4 negocios de comida** (máx. **2 negocios por persona**, todos los negocios): Frutería $160.000, Taco Bout $160.000, Three Guys $170.000, Cafetería $165.000. Mismas funciones que los demás (el dueño edita precios, las ventas llegan a su Tarjeta de Comerciante, finanzas). Mercado → Comida y bebida los muestra por tienda con filtros.
- **Impuestos de negocios**: si el dueño deja de pagar el ITBMS el negocio queda **MOROSO** y ya no puede volver solo a "pagar". Debe ir a la **Policía (PNB)**: en MDT → Multas, al elegir al ciudadano sale "Multa de negocio" y se le pone una multa que paga en Inventario → Multas. Después el **Ministro del Interior** (MDT → Tesorería → Negocios) elige **Dejar limpio** (pago normal) o **Clausurar** (con razón). Un negocio clausurado no vende; el dueño puede **Reabrir** (después de pagar una multa que le ponga la Policía) o **Dejar el negocio** (queda a la venta). Las comidas no pagan impuestos, así que sus dueños no tienen ese interruptor.
- **Aviso de ITBMS**: cuando el Ministro cambia la tasa, cada dueño recibe una notificación y bajo su local en Inventario → Negocios sale "SUBIÓ / BAJÓ el ITBMS de X% a Y%" con la fecha.
- **Celular Desechable**: en VE WhatsApp aparece **Cambiar de cuenta** (mi cuenta real o **cuenta anónima**). La anónima usa un número falso (no sale tu nombre), cada sesión dura **15 minutos** y tiene **5 usos** (mensajes). Al terminar abres una nueva. No guarda contactos ni estados. (`lib/redes.js`, `app/api/wa/route.js`).
- El buscador de Multas de la MDT ya venía corregido en tu zip.

## Actualización 12: logo Halloween, Taller, devolver negocios, MDT y ER:LC
- **Logo de Halloween** en el inicio de sesión y en la barra de arriba (junto al contador de miembros). El logo azul anterior quedó guardado como `public/logo-azul.png`. La barra de arriba ahora tiene el logo a 40 px de alto para que se vea.
- **Dark Web sin dueño**: si el Taller clandestino no tiene dueño, la plataforma compra sola los autos, incluidas las ofertas que ya estaban abiertas desde antes (`lib/dwauto.js`, se ejecuta al entrar a la Dark Web). Además, un dueño vacío ("") en la base de datos ahora cuenta como sin dueño.
- **Devolver negocios**: Inventario → negocio → **Devolver negocio al sistema** (también el Taller clandestino). Reembolsa el precio inicial de compra a la Tarjeta de Comerciante, el negocio queda a la venta y el dueño anterior no puede recomprarlo durante 15 días. Un negocio moroso o clausurado no se puede devolver. En Mercado → Negocios ya no sale el panel del dueño.
- **Sesiones**: la MDT se reinicia a los 35 minutos y hay botón **Apagar MDT**. Administración ya no mantiene la sesión: al salir del panel (o recargar) vuelve a pedir la placa, y dura máximo 35 minutos.
- **ER:LC**: al arrestar con minutos en la MDT (o por desacato) se manda `:jail <usuario de Roblox>` a ER:LC. Si el sujeto sigue conectado y sale de la cárcel antes de cumplir la condena, se le manda `:jail` otra vez. Variable nueva en Vercel: **`ERLC_SERVER_KEY`** (la Server Key del servidor privado). Para que la revisión sea continua, pon además **`CRON_SECRET`** y programa un cron externo cada minuto a `https://TU-APP.vercel.app/api/erlc/vigilar?k=TU_CRON_SECRET` (por ejemplo cron-job.org, gratis). Sin cron, la revisión corre cuando alguien usa la MDT.
- **Administración → ER:LC**: botón "Probar conexión (enviar :h)".

## Arreglo ER:LC
- La API de ER:LC cambió de dominio: api.policeroleplay.community ya no funciona. Ahora se usa api.erlc.gg (lib/erlc.js; se puede cambiar con ERLC_API_URL).
- Administración › ER:LC ahora deja escribir el mensaje que se manda con :h y traduce los errores de la API (key inválida, servidor vacío, límite de uso).

## Actualización 11: ER:LC (error 4000) e inicios de sesión separados
- **ER:LC**: el error "You are not authorized to perform this action" es el código 4000: ER:LC solo acepta comandos desde IPs de confianza y Vercel cambia de IP. Se agregó el soporte de proxy con IP fija (`ERLC_PROXY_URL` y `ERLC_PROXY_SECRET`); las instrucciones están en `erlc-proxy/LEEME.md`. El error ahora sale explicado en español.
- **Inicios de sesión separados**: la **MDT** pide la placa policial y **Administración** pide la placa de **Staff**, cada uno con su propia pantalla y su propia sesión. El Developer ya no entra directo: escribe su placa de Staff (`DEV-001`, asignada automáticamente).

## Actualización 12: inicio de sesión del Staff
- Nueva pantalla de acceso a Administración (animada, con sonidos, efectos y confirmación de acceso).
- El **Developer** entra con `DEV-001` (o `DEV-00`).

## Actualización 13: Apertura del servidor
- Administración → **Apertura** (Developer, Fundación, Junta Directiva y Asuntos Internos): **Abrir votación**, **Abrir servidor** y **Cerrar servidor**. Se envían por un webhook de Discord (variable `DISCORD_WEBHOOK_APERTURA`).
- Tres mensajes en embed con su GIF: **votación**, **Apertura** (con "Servidor en Listado" y código VNZRP) y **Servidor Cerrado**. Sin encuesta (las reacciones las pone otro bot). La votación y la apertura pinguean a `<@&1472420048197910771>` fuera del embed; cerrar no.
- Queda en la auditoría y se muestra el último aviso. Hay una espera de 15 segundos entre envíos.

## Actualización 14: cambios del concesionario, clausura, inventario, catálogo, cuerpo y delictivo
- **Concesionario**: la tarjeta ya no muestra colores ni detalles. Al pulsar **Comprar** pide un solo campo, el color (en las casas también), y luego el pago.
- **Clausura con multa**: al clausurar, el Ministro escribe la razón y el **monto de la multa**. El dueño la paga en **Inventario → Negocios** (efectivo o tarjeta), el dinero va a la Tesorería y el negocio **reabre al instante**.
- **Inventario → Negocios**: sin huecos bajo la foto. Debajo de la foto van el ITBMS actual con flecha (▲ rojo si subió, ▼ verde si bajó, lo cambia el Ministro) y el interruptor de pagar impuesto. El editor de precios es compacto: buscador, lista con scroll y filas pequeñas (sirve para más de 100 artículos).
- **Administración → Mercado**: se quitó "Editar casas por tipo". El catálogo va arriba, con **buscador** (nombre, número de casa, marca) y **filtros por categoría** (Propiedades, Negocio, etc.). Cada casa se edita sola (precio e impuesto) con el botón Editar; los formularios para crear casas y artículos quedaron plegados abajo.
- **Hambre y sed**: solo corren con el servidor **abierto** (lo marca el panel de Apertura con Abrir/Cerrar; la votación no cambia el estado). Con el servidor cerrado las barras no bajan, nadie muere y no se puede comer ni beber. Al abrir, el tiempo cerrado no cuenta. El Developer puede comer siempre.
- **Delictivo**: además del rol delictivo, ahora hace falta la **VPN** (la misma de la Dark Web), tanto en la página como en las acciones.

## Actualización 15: barras, casas, WhatsApp anónimo, TikVerp, tarjetas y ER:LC
- **Barras del personaje**: los anillos ahora se animan siempre (aro girando, brillo, pulso e ícono), aunque estén al 100% y el servidor esté cerrado.
- **Casas**: se quitó "Editar por tipo" y se agregó **Casa tipo 4** (el alta por lote con números separados por coma sigue igual).
- **WhatsApp anónimo**: solo con **Celular Desechable**. Número fijo **+58 412 0000000** (no se puede responder). Cada celular aguanta **5 sesiones** anónimas (15 min y 5 usos cada una); al terminar la 5.ª el celular se destruye y hay que comprar otro.
- **TikVerp**: solo el dueño puede borrar su video (el staff aún puede borrar comentarios).
- **Tarjetas**: la animación de "Pago aprobado" ahora sale con todas las tarjetas.
- **ER:LC → Administración**: caja para **ejecutar cualquier comando** y panel de **mensajes automáticos**: bienvenida (`:h`) cada 5 min durante los primeros 20 min tras **Abrir servidor**, y después las 15 reglas rotando cada 10 min. Todo editable. Solo se envían con el servidor abierto y jugadores dentro. Se disparan solos desde el contador de miembros (cada minuto) o con el cron `/api/erlc/vigilar?k=CRON_SECRET`.
- **Apertura**: el ping de votación y de servidor abierto ahora es el rol `1404862578374606910`; el GIF de "Servidor Abierto" es `Server_Abierto_2.gif`.

## Actualización 16: Mercado negro (cultivo en la Dark Web) y limpieza de ER:LC
- **Dark Web → Semillas y sustancias** (rol delictivo + VPN; no tiene que ver con el Taller clandestino): se compran **Semilla de Cocatia** ($1,950) y **Semilla de Matijuana** ($1,500), máximo **3 de cada una cada 24 h** por usuario. Fotos en `public/items/semilla-*.jpg`.
- **Inventario → Personal**: la semilla tiene el botón **Cultivar** (elige casa). Se planta en el **Patio** y tarda **48 h reales** (⚠ ahora está en **modo prueba: 1 minuto**; para producción cambia `MIN_CULTIVO` a 2880 en `lib/cultivo.js`) (máx. 4 plantas por casa; todo en `lib/cultivo.js`). En **Inventario → Casa** sale el temporizador y, al terminar, **Cosechar**: la planta/semilla se **elimina** y da **150 bolsitas** guardadas en el patio (100 bolsitas = 1 kilo).
- **Casa**: el traspaso entre inventario personal y casa (guardar **y** sacar) tiene espera de **5 minutos**. Una planta sembrada no se puede sacar.
- **Dónde pueden estar las sustancias**: solo encima del personaje, guardadas en casa, o vendidas en la Dark Web (no hay maletero ni venta entre jugadores).
- **Venta en la Dark Web**: la plataforma compra a la **misma cotización de los autos** (x0.60 a x1.40, cambia cada 2 horas). Base: bolsita **$30**, kilo **$1,800**. El jugador ve cuánto le pagarían y decide cuándo vender; cobra en efectivo o tarjeta. El dinero sale de la nada (sin impuestos). Lo que está en casa hay que sacarlo primero.
- **Policía (MDT)**: el inventario de la casa en un allanamiento aprobado muestra bolsitas y plantas con su temporizador. Lo que el sospechoso **lleva encima** (el oficial hace su /me de revisarlo) aparece en Decomisos y se **incauta** del todo, sin días. También se puede robar en un asalto.
- **MDT → Decomisos**: la revisión de bolsillos está **bloqueada** hasta que el agente pulsa "Ya hice mi /me lo revisa · Desbloquear". Al desbloquear, el ciudadano recibe un aviso y el agente ve **todo lo que lleva encima** (lo guardado en casa no sale), con las cosas decomisables marcadas; tiene 30 minutos para decomisar (el servidor lo exige). Lo ilícito (sustancias) se incauta y **no se devuelve**.
- **ER:LC → Administración**: se quitó la caja "Probar conexión (enviar :h)".

## Actualización 13: allanamientos e insignias
- **Allanamientos**: ahora solo el **Ministro del Interior** puede aprobarlos o rechazarlos (el Developer también, para pruebas). Cualquier agente sigue pudiendo solicitarlos.
- **Rangos de la Policía Nacional Bolivariana** con sus insignias según la imagen: Oficial, Primer Oficial y Oficial Jefe (1, 2 y 3 estrellas blancas); Inspector, Primer Inspector e Inspector Jefe (estrellas en aro dorado); Comisario, Primer Comisario y Comisario Jefe (estrella dorada con laureles); Comisario General, Mayor y Superior (laureles sobre fondo vino). Se ven en el encabezado de la MDT y en Administración → Agentes de la MDT (`components/Insignia.js`).

## Actualización 14: Tienda Ministerio y sonidos desde el celular
- **MDT → Tienda Ministerio** (solo la ve el Ministro del Interior): Mejoras de Armas Generales $260.000, Mejoras para Vehículos $450.000, Mejoras Tácticas Policiales $230.000 y Mejoras Tácticas Especiales $340.000. Se pagan con el dinero de la Tesorería, son opcionales, duran 7 días y se pueden comprar máximo 3 veces por semana cada una (si está activa, comprar otra vez suma 7 días más). Si una mejora no está activa sale en rojo el aviso de mantenimiento firmado por el Ministro J. Boscan. Datos en `lib/ministerio.js` y colección `ministerio_mejoras`.
- **TikVerp → sonidos**: al crear un sonido ahora se puede elegir un **audio de tu celular** (máx. 2.5 MB) sin subirlo a Discord ni copiar el link (el link de Discord sigue funcionando). Se guarda en Mongo (colección `tv_audio`, máx. 20 audios por usuario).

## Actualización 15: trabajos secundarios y ajustes
- **Trabajos secundarios** (menú **Trabajos**): el ciudadano pone su usuario de Roblox, elige el trabajo, las horas y ve cuánto ganó en total (horas × pago por hora). Manda 1 foto al iniciar, 1 durante y 3 al finalizar (links https, por ejemplo de Discord) y elige en qué cuenta quiere el pago. Pagos por hora: Cafeterías 2300, Bar 1980, Talleres 2000, Comida rápida 1560, Transporte público 2500, Transporte privado 3000, Correos 1500, Basurero 2100, Gasolineras 2100, Protección Civil 3700, Bomberos 3750 (se cambian en `lib/trabajos.js`). Máximo 24 horas por solicitud y 5 solicitudes pendientes por persona.
- **Administración → Solicitudes**: nuevo panel "Solicitudes de trabajo secundario" con las fotos. Lo revisan Moderación, Asuntos Internos, Fundación y Junta Directiva (y el Developer): **Aprobar y pagar** deposita el total (lo crea el sistema) y **Rechazar** pide la razón. Nadie puede revisar su propia solicitud. Queda en la auditoría.
- **Neveras**: la foto de Refrigerador y la de Nevera de Lujo quedaron intercambiadas (se aplica una sola vez, también a las ya compradas, sin tocar precios).
- **Sesión de Administración**: dura **35 minutos** desde que pones la placa. Ya no se cierra al hacer una acción ni al recargar la página.
- **WhatsApp anónimo (celular desechable)**: la cuenta anónima ya no muestra ningún número: dice **"Cuenta anónima"** y un código de país al azar (+7 Rusia, +86 China, etc.).
- **Cosecha**: la planta tarda **48 horas** (antes 1 minuto de prueba).
- **MDT → Ciudadanos**: la ficha muestra el **inventario que lleva encima** (lo que no está guardado en casa) y marca en rojo lo ilegal: robado, sustancias y armas sin licencia.
