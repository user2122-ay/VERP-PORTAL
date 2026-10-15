import { valorMano, esBJ } from "./juegos";
// Blackjack en sala 1 contra 1: el creador y su invitado reciben 2 cartas cada uno (del mismo mazo), juegan a la vez sin ver las cartas del otro, y gana el que quede más cerca de 21 sin pasarse.
// Blackjack natural (21 con dos cartas) le gana a cualquier otro 21. Si empatan (o se pasan los dos) se devuelven las apuestas. El ganador se lleva el pozo menos el impuesto a la ganancia.
export const MIN_BJ = 100, MAX_BJ = 100000, VENCE_MIN = 30, MAX_ABIERTAS = 3, ESPERA_MS = 3 * 6e4; // 3 min sin jugar = se planta solo
export function mazoNuevo() { const m = Array.from({ length: 52 }, (_, i) => i); for (let i = 51; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [m[i], m[j]] = [m[j], m[i]]; } return m; }
export const puntaje = (c) => { const t = valorMano(c).total; return t > 21 ? -1 : esBJ(c) ? 22 : t; };
