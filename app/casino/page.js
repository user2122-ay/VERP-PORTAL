import { redirect } from "next/navigation";
// El casino ya no es una sola app: cada juego tiene la suya en el teléfono.
export default function P() { redirect("/whatsapp"); }
