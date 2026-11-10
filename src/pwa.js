import { registerSW } from "virtual:pwa-register";

// 📲 Installable app support. Registers the service worker (built by vite-plugin-pwa, see vite.config.js)
// and handles new versions politely: when a new deployment is found, a small "Update" bar appears,
// but only on the main menu. It never shows, and the game never reloads, while a level is being played.
export function setupPWA(game) {
  let updateReady = false;
  let bar = null;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() { updateReady = true; },          // a new version is downloaded and waiting
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      // Look for a new version whenever the player comes back to the game
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") registration.update().catch(() => {});
      });
    },
  });

  const showBar = () => {
    if (bar) return;
    bar = document.createElement("div");
    bar.style.cssText = "position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:9998;display:flex;gap:10px;" +
      "align-items:center;padding:8px 12px;border-radius:12px;background:rgba(20,10,38,.95);border:2px solid #ffd23f;" +
      "color:#fff;font:bold 14px sans-serif;touch-action:manipulation";
    bar.append("A new version of Oni is ready");

    const button = (label, background, onClick) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.style.cssText = `border:0;border-radius:8px;padding:8px 14px;font:bold 14px sans-serif;color:#fff;background:${background}`;
      b.addEventListener("click", onClick);
      bar.append(b);
    };
    button("Update", "#2e9a4a", () => updateSW(true));                     // reloads into the new version
    button("Later", "#4a3485", () => { updateReady = false; hideBar(); });  // asks again next time the game opens
    document.body.append(bar);
  };
  const hideBar = () => { if (bar) { bar.remove(); bar = null; } };

  // Once a second: show the bar only while the main menu is on screen
  setInterval(() => {
    if (updateReady && game.scene.isActive("MenuScene")) showBar();
    else hideBar();
  }, 1000);
}
