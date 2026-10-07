// Muestra la notificación solo si el usuario NO tiene la web abierta y enfocada.
self.addEventListener("push", (e) => {
  const d = e.data ? e.data.json() : {};
  e.waitUntil((async () => {
    const cs = await clients.matchAll({ type: "window", includeUncontrolled: true });
    if (cs.some((c) => c.focused)) return;
    await self.registration.showNotification(d.title || "VERP", { body: d.body || "", icon: "/ve-logo.png", badge: "/ve-logo.png", data: { url: d.url || "/" }, tag: d.tag });
  })());
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const cs = await clients.matchAll({ type: "window", includeUncontrolled: true }), c = cs[0];
    if (c) { await c.focus(); if ("navigate" in c) c.navigate(e.notification.data.url); } else await clients.openWindow(e.notification.data.url);
  })());
});
