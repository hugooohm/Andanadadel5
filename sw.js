const CACHE_NAME = "adanada-v2";
const ASSETS = [
  "/",
  "/index.html",
  "/assets/css/styles.css",
  "/assets/js/main.js",
  "/feed.xml",
  "/config.json",
  "/post.html",
  "/category.html",
  "/tag.html",
  "/archive.html",
  "/contacto.html",
  "/offline.html",
  "/media/img/logoblanco.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const isNavigate = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      const copy = res.clone();
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, copy);
      return res;
    } catch (err) {
      if (isNavigate) {
        const offline = await caches.match("/offline.html");
        if (offline) return offline;
      }
      return cached || new Response("", { status: 503 });
    }
  })());
});
