# Proxy de ER:LC (IP fija)

**Por qué:** ER:LC solo acepta comandos (como `:h` o `:jail`) desde IPs de confianza (error 4000). Vercel cambia de IP todo el tiempo, así que no se puede agregar. Este proxy corre en un servidor con **IP pública fija** y reenvía el comando.

1. Sube esta carpeta (`erlc-proxy`) a cualquier servidor o hosting con IP fija y Node 18+ (un VPS, por ejemplo). Variables: `PROXY_SECRET` = una clave larga inventada por ti. Inicio: `npm start`.
2. Averigua la IP pública de ese servidor y agrégala en https://api.erlc.gg/server-owners → tu servidor → **Settings** → IP de confianza.
3. En Vercel agrega: `ERLC_PROXY_URL` = `https://tu-proxy.com` (sin / al final) y `ERLC_PROXY_SECRET` = la misma clave. Vuelve a desplegar.
4. En Administración → ER:LC pulsa "Probar conexión".

Alternativa: si tu plan de Vercel ofrece **IPs estáticas**, puedes agregar esa IP en ER:LC y no necesitas el proxy (revisa tu plan, es una función de pago).
