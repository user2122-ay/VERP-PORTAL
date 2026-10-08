// 999 -> "999", 1200 -> "1.2k", 12500 -> "12.5k", 1200000 -> "1.2M"
const f = (x) => (Math.round(x * 10) / 10).toString().replace(/\.0$/, "");
export const abrev = (n) => (n < 1000 ? String(n) : n < 999950 ? f(n / 1e3) + "k" : n < 999950000 ? f(n / 1e6) + "M" : f(n / 1e9) + "B");
