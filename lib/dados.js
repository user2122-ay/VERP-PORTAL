// Dados 1 contra 1: cada uno tira 2 dados, gana el total más alto y se lleva todo el pozo (menos el impuesto a la ganancia). Si empatan se repite la tirada.
export const MIN_D = 100, MAX_D = 100000, VENCE_MIN = 30, MAX_ABIERTAS = 3;
const d6 = () => 1 + Math.floor(Math.random() * 6);
export function duelo() { let a, b; do { a = [d6(), d6()]; b = [d6(), d6()]; } while (a[0] + a[1] === b[0] + b[1]); return { a, b, gana: a[0] + a[1] > b[0] + b[1] ? "a" : "b" }; }
