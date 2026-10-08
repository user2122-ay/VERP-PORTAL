// Decomisos de la policía: el objeto sigue en el inventario del sujeto pero queda "retenido" hasta la fecha que puso el oficial.
// Mientras está retenido no se puede usar, vender, revender, guardar en casa ni robar. Pasado el plazo se libera solo.
export const estaRetenido = (i) => !!i?.retenido?.hasta && +new Date(i.retenido.hasta) > Date.now();
// Qué se puede decomisar: armas, licencia de armas, licencia de conducir y autos.
export const decomisable = (i, tipoLic) => i?.category === "Armas" || i?.category === "Concesionario" || ["armas", "conducir"].includes(tipoLic);
export const MAX_DIAS_RETENCION = 365;
