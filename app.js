let swRegistration; // Variable global para guardar el registration


// Estos son los recursos que se deben actualizar al subir cambios
const APP_CHANGES = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',

  '/sub/',
  '/sub/prueba.html'
];



if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      swRegistration = registration; // Guardamos para usarlo después

      registration.onupdatefound = () => {
        const newWorker = registration.installing;
        newWorker.onstatechange = () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            mostrarMensajeActualizacion();
          }
        };
      };
    });
}





function actualizarwebapp() {
  if (!swRegistration || !swRegistration.waiting) return;

  const newWorker = swRegistration.waiting;

  navigator.serviceWorker.addEventListener('message', function onMessage(e) {
    if (e.data.action === 'listoParaRecargar') {
      navigator.serviceWorker.removeEventListener('message', onMessage);
      // Redirigir con un parámetro único para evitar la caché del navegador
      window.location.href = window.location.pathname + '?check=' + Date.now();
    }
  });

  newWorker.postMessage({
    action: 'actualizarYActivar',
    urls: APP_CHANGES
  });

  setTimeout(() => {
    window.location.href = window.location.pathname + '?check=' + Date.now();
  }, 5000);
}










function mostrarMensajeActualizacion() {

    if (document.getElementById("update-banner")) return;

      const div = document.createElement("div");
        div.id = "update-banner";

          div.innerHTML = `
          <div style="
          position:fixed;
          top:20px;
          left:50%;
          transform:translateX(-50%);
          background:#000;
          color:#fff;
          padding:15px 25px;
          border-radius:8px;
          box-shadow:0 4px 10px rgba(0,0,0,0.3);
          font-family:sans-serif;
          z-index:9999; border: 2px solid white;">
          Nueva versión disponible
          <button
          onclick="actualizarwebapp()"
          style="margin-left:10px;padding:5px 10px;">
          Actualizar
          </button>
          </div>
          `;

          document.body.appendChild(div);
          }


document.getElementById("btn").addEventListener("click", () => {
//mostrarMensajeActualizacion();
  alert("Funciona incluso offline 😎");
});




function mostrarBannerOffline() {

  ocultarMensajeActualizacion();

  if (document.getElementById("offline-banner")) return;

  const div = document.createElement("div");
  div.id = "offline-banner";

  div.innerHTML = `
    <div style="
      position:fixed;
      bottom:20px;
      right:20px;
      background:#b00020;
      color:white;
      padding:15px 20px;
      border-radius:8px;
      box-shadow:0 4px 10px rgba(0,0,0,0.3);
      font-family:sans-serif;
      z-index:9999;border: 2px solid white;">
      🔴 Sin conexión. Algunas ventanas externas no estarán disponibles.
    </div>
  `;

  document.body.appendChild(div);
}

function quitarBannerOffline() {
  const banner = document.getElementById("offline-banner");
  if (banner) banner.remove();
}

// Detectar cuando se pierde conexión
window.addEventListener("offline", mostrarBannerOffline);

// Detectar cuando vuelve conexión
window.addEventListener("online", () => {
  quitarBannerOffline();
  mostrarBannerOnlineTemporal();
});

// Opcional: aviso cuando vuelve
function mostrarBannerOnlineTemporal() {
  const div = document.createElement("div");

  div.innerHTML = `
    <div style="
      position:fixed;
      bottom:20px;
      right:20px;
      background:#0a7f2e;
      color:white;
      padding:15px 20px;
      border-radius:8px;
      box-shadow:0 4px 10px rgba(0,0,0,0.3);
      font-family:sans-serif;
      z-index:9999;border: 2px solid white;">
      🟢 Conexión restablecida
    </div>
  `;

  document.body.appendChild(div);

  setTimeout(() => div.remove(), 3000);
}

// Detectar estado inicial al cargar
if (!navigator.onLine) {
  mostrarBannerOffline();
}





let dominioDisponible = true;

async function verificarDominio() {
  if (!navigator.onLine) return;

  try {
    await fetch('/sw.js?check=' + Date.now(), {
      method: 'HEAD',
      cache: 'no-store'
    });

    if (!dominioDisponible) {
      quitarBannerDominioOffline();
      mostrarBannerDominioOnline();
    }

    dominioDisponible = true;

    // Forzar comprobación de actualización del Service Worker
    if (swRegistration) {
      swRegistration.update();
    }

  } catch (e) {
    if (dominioDisponible) {
      mostrarBannerDominioOffline();
    }
    dominioDisponible = false;
  }
}

// cada 7s verificqmos conexiones y actualizaciones al servidor
setInterval(verificarDominio, 7000);
verificarDominio();

function mostrarBannerDominioOffline() {


ocultarMensajeActualizacion();
  if (document.getElementById("domain-offline")) return;

  const div = document.createElement("div");
  div.id = "domain-offline";

  div.innerHTML = `
    <div style="
      position:fixed;
      bottom:70px;
      right:20px;
      background:#ff9800;
      color:#000;
      padding:15px;
      border-radius:8px;
      z-index:9999;border: 2px solid white;">
      ⚠️ Navegando offline (sin acceso al servidor)
    </div>
  `;

  document.body.appendChild(div);
}

function quitarBannerDominioOffline() {
  document.getElementById("domain-offline")?.remove();
}

function mostrarBannerDominioOnline() {
  const div = document.createElement("div");

  div.innerHTML = `
    <div style="
      position:fixed;
      bottom:70px;
      right:20px;
      background:#4caf50;
      color:white;
      padding:15px;
      border-radius:8px;
      z-index:9999;border: 2px solid white;">
      ✅ Conexión al servidor restaurada
    </div>
  `;

  document.body.appendChild(div);

  setTimeout(() => div.remove(), 3000);
}


function ocultarMensajeActualizacion() {
    const banner = document.getElementById("update-banner");
      if (banner) banner.remove();
}


