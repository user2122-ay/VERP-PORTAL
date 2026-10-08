// Guardar objetos en casa: el objeto sale del inventario personal y queda escondido en una parte de la casa.
export const LUGARES_CASA = ["Sala", "Cocina", "Comedor", "Habitación principal", "Habitación de visitas", "Baño", "Garaje", "Sótano", "Ático", "Patio", "Jardín", "Debajo de la cama", "Detrás de un cuadro", "Dentro del colchón", "Falso fondo del armario", "Caja fuerte", "Techo falso"];
export const ESPERA_GUARDAR = 10 * 60 * 1000; // 10 minutos entre cada objeto guardado
export const guardable = (i) => !["Propiedades", "Concesionario", "Licencias"].includes(i.category);
