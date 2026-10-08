// Guardar objetos en casa: el objeto sale del inventario personal y queda escondido en una parte de la casa.
export const LUGARES_CASA = ["Sala", "Cocina", "Comedor", "Habitación principal", "Habitación de visitas", "Baño", "Garaje", "Sótano", "Ático", "Patio", "Jardín", "Debajo de la cama", "Detrás de un cuadro", "Dentro del colchón", "Falso fondo del armario", "Caja fuerte", "Techo falso"];
export const ESPERA_GUARDAR = 10 * 60 * 1000; // 10 minutos entre cada objeto guardado
export const esAuto = (i) => i.category === "Concesionario";
// Se puede guardar casi todo (legal, ilegal o robado). Los autos van al garaje: solo cabe UNO por casa.
export const guardable = (i) => !["Propiedades", "Licencias"].includes(i.category);
