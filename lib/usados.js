// Segunda mano: un ciudadano revende un artículo suyo por MENOS de lo que pagó; otros lo compran en Mercado → Segunda mano.
// Se pueden revender objetos (herramientas, armas, teléfonos, tecnología). No: autos (van por la Dark Web o el Concesionario), casas, licencias, accesos con duración, objetos robados ni retenidos.
import { estaRetenido } from "./decomiso";
export const MAX_PUBLICADOS = 10;
export const revendible = (i) => !!i && !["Propiedades", "Licencias", "Concesionario"].includes(i.category) && !i.vence && i.sku !== "vpn" && !i.robado && !estaRetenido(i) && i.loc !== "casa" && Number(i.price) > 1;
