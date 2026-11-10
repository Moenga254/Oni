import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Makes the game an installable app (PWA) that also works offline.
// The plugin writes two files into dist/ on every build:
//   manifest.webmanifest: the app's name, colours and icons (what Android shows when installing)
//   sw.js: the service worker, which saves the game's files on the device so it opens offline
export default defineConfig({
  plugins: [
    VitePWA({
      // "prompt": a new version waits until the player agrees to update (see src/pwa.js),
      // so the game never reloads by itself in the middle of a level
      registerType: "prompt",
      injectRegister: null,   // src/pwa.js registers the service worker itself
      includeManifestIcons: false,   // the icons are already picked up by globPatterns below

      manifest: {
        id: "/",
        name: "Oni",
        short_name: "Oni",
        description: "Oni is a fast platformer: grab the coins, dodge the monsters and reach the flag before time runs out.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "landscape",
        theme_color: "#000000",
        background_color: "#000000",
        categories: ["games"],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          // "maskable": Android may crop the icon into a circle or rounded square, so this one has extra space around it
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },

      workbox: {
        // Save the whole game for offline play: the page, the code, the player sprite and the icons.
        // Each file is saved with a fingerprint of its contents, so a new deployment replaces
        // exactly the files that changed and nothing stale is left behind.
        globPatterns: ["**/*.{js,css,html,png,svg}"],
        // Old files nothing uses any more (the first manifest and icons, Vite's sample images)
        globIgnores: ["assets/manifest.json", "assets/icon-*.png", "favicon.svg", "icons.svg"],
        // The game's code is one file of about 1.4 MB; the default limit is 2 MB, so leave some headroom
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallback: "index.html",
      },
    }),
  ],
});
