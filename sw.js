const CACHE_NAME = 'mi-pwa-v4'; // Puedes incrementar la versión si deseas

let dominioDisponible = true;

// Estos son los recursos que se deben guardar para usarse Offline
const APP_SHELL = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',

  '/sub/',
  '/sub/prueba.html'
];


// INSTALACIÓN (sin skipWaiting)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
  );
  // ❌ NO llamar a self.skipWaiting() aquí
});

// Activación: limpiar cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: intenta caché, si no, va a red y guarda
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Excluir peticiones de verificación de dominio
  if (url.searchParams.has('check')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // 1. Si está en caché, devolverlo
      if (response) return response;

      // 2. Si el dominio no está disponible, no intentar la red
      if (!dominioDisponible) {
        if (event.request.mode === 'navigate') {
          return new Response(
            `<!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <title>Sin conexión</title>
              <style>
                body { font-family: sans-serif; text-align: center; padding: 2rem; }
                h1 { color: #b00020; }
              </style>
            </head>
            <body>
              <h1>🔴 Sin acceso al servidor</h1>
              <p>No hay conexión a internet ni copia en caché de esta página.</p>
              <button onclick="window.location.reload()">Reintentar</button>
            </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        } else {
          return new Response('Recurso no disponible (sin salida a internet)', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        }
      }

      // 3. Si no, ir a la red (evitando caché del navegador)
      return fetch(new Request(event.request, { cache: 'no-cache' }))
        .then(networkResponse => {
          // Guardar en caché para futuras visitas offline
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // 4. Si la red falla, verificar si es una navegación (página HTML)
          if (event.request.mode === 'navigate') {
            return new Response(
              `<!DOCTYPE html>
              <html lang="es">
              <head>
                <meta charset="UTF-8">
                <title>Sin conexión</title>
                <style>
                  body { font-family: sans-serif; text-align: center; padding: 2rem; }
                  h1 { color: #b00020; }
                </style>
              </head>
              <body>
                <h1>🔴 Estás offline</h1>
                <p>No hay conexión a este enlace ni copia en caché de esta página.</p>
                <button onclick="window.location.reload()">Reintentar</button>
              </body>
              </html>`,
              { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
          } else {
            // Para otros recursos (imágenes, scripts, etc.), devolver un error simple
            return new Response('Recurso no disponible offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          }
        });
    })
  );
});

// Mensajes: dominio + actualización PWA
self.addEventListener('message', event => {

  // Estado del dominio reportado por app.js
  if (event.data?.type === 'DOMINIO_OFFLINE') { dominioDisponible = false; return; }
  if (event.data?.type === 'DOMINIO_ONLINE')  { dominioDisponible = true;  return; }

  // Actualización de la PWA
  console.log('SW recibió mensaje:', event.data);
  if (event.data.action === 'actualizarYActivar') {
    const urls = event.data.urls;
    caches.open(CACHE_NAME).then(cache => {
      Promise.all(urls.map(url => cache.delete(url)))
        .then(() => {
          console.log('Archivos eliminados, enviando respuesta y activando');
          event.source.postMessage({ action: 'listoParaRecargar' });
          self.skipWaiting();
        });
    });
  }
});