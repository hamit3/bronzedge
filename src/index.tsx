import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);

// 🧹 Clean up any orphaned Service Workers or Workbox instances that might be lingering in the browser
// This stops the "workbox Precaching did not find a match" spam in the console
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
            registration.unregister();
            console.log("Cleaned up orphaned Service Worker:", registration);
        }
    });

    // Also clear workbox caches if they exist
    if ("caches" in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          if (name.includes("workbox") || name.includes("supabase")) {
            caches.delete(name);
          }
        }
      });
    }
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
