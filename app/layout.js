import "./globals.css";
export const metadata = { title: "Portal Ciudadano · VE:RP" };
export default function L({ children }) {
  return (<html lang="es" suppressHydrationWarning><head>
    <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.t||(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.dataset.theme=t}catch(e){}` }} />
    <meta name="viewport" content="width=device-width,initial-scale=1" /></head><body>{children}</body></html>);
}
