import './style.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  app.innerHTML = `
    <main class="shell">
      <h1>Mille Bornes</h1>
      <p class="tagline">Rally 1000 — race to 1000 km</p>
      <p class="status">Walking skeleton: the pipeline works.</p>
    </main>
  `;
}

// PWA skeleton: register the service worker. Offline caching lands in T8.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('./sw.js').catch((error: unknown) => {
      console.error('Service worker registration failed:', error);
    });
  });
}
