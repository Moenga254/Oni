// 📱 Immersive fullscreen for phones and tablets: hides the Android status bar and navigation buttons
// so the game fills the whole screen. Uses Phaser's Scale Manager (scene.scale.startFullscreen).
//
// Browsers only allow fullscreen as a direct result of a tap, click or key press, and on touch screens
// only when the finger LIFTS. So this tries straight away (enough for a mouse or a key), and if that
// is refused it tries once more when the finger comes up.
// If the device or browser can't do fullscreen, nothing happens and the game carries on as normal.

// Fullscreen is for touch devices and the installed app; a desktop browser window is left alone
function wantsFullscreen() {
  const query = (q) => typeof window.matchMedia === "function" && window.matchMedia(q).matches;
  return query("(pointer: coarse)") || query("(display-mode: standalone)") || query("(display-mode: fullscreen)");
}

function lockLandscape() {
  try {
    const lock = screen.orientation && screen.orientation.lock && screen.orientation.lock("landscape");
    if (lock && lock.catch) lock.catch(() => {});   // not allowed on this device: the rotate prompt still covers it
  } catch (e) { /* not supported: ignore */ }
}

export function enterFullscreen(scene) {
  const scale = scene.scale;
  if (!wantsFullscreen() || !scale.fullscreen.available) return;
  if (scale.isFullscreen) { lockLandscape(); return; }

  // Make the whole page fullscreen (not just the canvas), so the rotate prompt and the
  // "new version" bar keep working. The canvas still sizes itself exactly as before.
  scale.fullscreenTarget = document.documentElement;

  const attempt = () => {
    if (scale.isFullscreen) return;
    // If the browser refuses, it reports an error that nothing is listening for. Catch that for a
    // moment, so a refusal stays silent and the game simply carries on without fullscreen.
    const quiet = (event) => event.preventDefault();
    window.addEventListener("unhandledrejection", quiet);
    setTimeout(() => window.removeEventListener("unhandledrejection", quiet), 1000);
    try { scale.startFullscreen({ navigationUI: "hide" }); } catch (e) { /* refused: ignore */ }
  };

  scale.off("enterfullscreen", lockLandscape);
  scale.once("enterfullscreen", lockLandscape);   // landscape can only be locked once fullscreen is on

  // A finger still on the screen can't start fullscreen yet (see above), so only a mouse or key tries now
  const pointer = scene.input.activePointer;
  const fingerDown = pointer && pointer.wasTouch && pointer.isDown;
  if (!fingerDown) attempt();

  const onRelease = () => {
    window.removeEventListener("pointerup", onRelease, true);
    window.removeEventListener("touchend", onRelease, true);
    attempt();
  };
  window.addEventListener("pointerup", onRelease, true);
  window.addEventListener("touchend", onRelease, true);
}
