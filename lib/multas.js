// Multas de la PNB. No se cobran solas: llegan al Inventario del ciudadano (pestaña Multas) y las paga cuando quiere,
// pero tiene como mínimo 10 días. Si vence sin pagar queda como DESACATO y el oficial decide: detención o retiro de licencia.
export const PLAZO_MIN_DIAS = 10, PLAZO_MAX_DIAS = 60, MONTO_MAX = 1000000;
export const estadoMulta = (m) => (m.estado === "pagada" ? "pagada" : new Date(m.vence) < new Date() ? "vencida" : "pendiente");
export const esPNB = (ag) => !!ag && (ag.depto === "Policía Nacional Bolivariana" || ag.rango === "Developer");
