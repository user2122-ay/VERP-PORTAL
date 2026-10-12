// En el navegador: reduce la foto elegida (máx. 1280 px, JPEG) y la devuelve como data URL para mandarla al servidor.
export function aImagen(file, max = 1280) {
  return new Promise((ok, no) => { const r = new FileReader(); r.onerror = no; r.onload = () => { const im = new Image(); im.onerror = no; im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL("image/jpeg", 0.85)); }; im.src = r.result; }; r.readAsDataURL(file); });
}
