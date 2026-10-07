// El acceso a la Dark Web (sku "vpn") dura los días que indique el artículo (5). Vence a partir de la compra.
export const tieneVpn = (u) => (u?.inventory || []).some((i) => i.sku === "vpn" && (!i.vence || +new Date(i.vence) > Date.now()));
