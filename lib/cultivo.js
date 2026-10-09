// Mercado negro: cultivo y venta de sustancias (juego de rol). Todo se ajusta aquí.
// Flujo: comprar semilla (Delictivo, con VPN) → "Cultivar" en una casa con patio → 48 h → "Cosechar" (150 bolsitas en el patio) → vender al traficante o a otro jugador.
export const PLANTAS = {
  cocatia: { nombre: "Cocatia", semilla: "Semilla de Cocatia", bolsas: "Bolsitas de Cocatia", precio: 1950, bolsa: 67, img: "/items/semilla-cocatia.jpg" },
  matijuana: { nombre: "Matijuana", semilla: "Semilla de Matijuana", bolsas: "Bolsitas de Matijuana", precio: 1500, bolsa: 55, img: "/items/semilla-matijuana.jpg" },
};
export const HORAS_CULTIVO = 48, BOLSAS_PLANTA = 150, POR_KILO = 100, LIM_DIA = 3; // LIM_DIA: semillas de cada tipo por usuario cada 24 h
export const PATIO_TIPOS = ["0", "1", "2", "3", "4"]; // tipos de casa con patio apto para cultivar
export const MAX_PLANTAS_CASA = 4; // plantas sembradas a la vez en una casa
export const TRAF = { bolsa: 30, kilo: 1800, min: 0.35, max: 1.85, minutos: 3 }; // el traficante paga base × un factor al azar entre min y max; la oferta dura unos minutos
export const OFERTA_MAX = 2000000;
export const esSemilla = (i) => i?.category === "Sustancias" && !!i.planta && !i.plantada;
export const esBolsa = (i) => i?.category === "Sustancias" && Number(i.cant) > 0 && !i.plantada;
