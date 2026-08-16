// Service worker de GYM.
//
// No hace falta tocar nada de este archivo nunca. No hay número de versión
// que actualizar: el caché se sobrescribe solo con cada visita online.
//
// Estrategia: red primero, caché de respaldo.
//  - Con señal: siempre traigo la versión publicada más nueva y la guardo.
//  - Sin señal: sirvo lo último que quedó guardado.

const CACHE = "gym";

// Archivos mínimos para que la app abra sin conexión la primera vez.
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-64.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .catch(() => {})            // si algo no baja, la app funciona igual
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        // Guardo la copia fresca para la próxima vez que no haya señal.
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
  );
});
