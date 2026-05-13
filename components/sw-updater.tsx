"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function ServiceWorkerUpdater() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let newWorkerRef: ServiceWorker | null = null;

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      // Vérifie les mises à jour à chaque fois que l'app redevient visible
      const checkForUpdate = () => registration.update();
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checkForUpdate();
      });

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorkerRef = newWorker;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // Une nouvelle version est prête — affiche la notification
            toast("Mise à jour disponible 🎉", {
              description: "Une nouvelle version de FridgeFlow est prête.",
              action: {
                label: "Mettre à jour",
                onClick: () => {
                  newWorker.postMessage({ type: "SKIP_WAITING" });
                },
              },
              duration: Infinity,
            });
          }
        });
      });
    });

    // Recharge la page dès que le nouveau SW prend le contrôle
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }, []);

  return null;
}
