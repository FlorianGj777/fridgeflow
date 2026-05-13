// Service Worker servi dynamiquement pour que chaque déploiement Vercel
// change le contenu (via VERCEL_GIT_COMMIT_SHA) et déclenche la détection de mise à jour.
export async function GET() {
  const buildId =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_BUILD_ID ||
    Date.now().toString();

  const sw = `
// FridgeFlow Service Worker — build: ${buildId}
const BUILD_ID = '${buildId}';

self.addEventListener('install', () => {
  // Ne pas activer automatiquement : attendre que l'utilisateur confirme la MAJ
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
`;

  return new Response(sw, {
    headers: {
      "Content-Type":          "application/javascript; charset=utf-8",
      "Cache-Control":         "no-cache, no-store, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}
