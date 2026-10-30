// Difficulty settings, shared by the Menu (where you pick one) and the GameScene (which applies it).

export const DIFFICULTIES = {
  easy:   { label: "Easy",   lives: 4, enemySpeed: 0.7, blurb: "4 lives  ·  slower enemies",            color: "#2e8b57" },
  normal: { label: "Normal", lives: 3, enemySpeed: 1.0, blurb: "3 lives  ·  normal enemies",            color: "#3a6fd8" },
  hard:   { label: "Hard",   lives: 3, enemySpeed: 1.3, blurb: "3 lives  ·  fast, aggressive enemies",  color: "#c0392b" },
};

export const DEFAULT_DIFFICULTY = "normal";

// Hard mode makes enemies faster, but never faster than this: the player runs at 220,
// so you can always outrun them if you play well.
export const MAX_ENEMY_SPEED = 190;

const STORAGE_KEY = "coinCollectorDifficulty";

export function isDifficulty(key) {
  return Object.prototype.hasOwnProperty.call(DIFFICULTIES, key);
}

// The choice lives in the Phaser registry (shared between scenes) and in localStorage
// (so the game remembers it next time). Anything unknown falls back to Normal.
export function getDifficulty(registry) {
  const fromRegistry = registry && registry.get("difficulty");
  if (isDifficulty(fromRegistry)) return fromRegistry;
  let stored = null;
  try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { /* storage can be blocked: ignore */ }
  return isDifficulty(stored) ? stored : DEFAULT_DIFFICULTY;
}

export function saveDifficulty(registry, key) {
  if (!isDifficulty(key)) return;
  if (registry) registry.set("difficulty", key);
  try { localStorage.setItem(STORAGE_KEY, key); } catch (e) { /* ignore */ }
}

// Normal leaves the level's own speed untouched. Slower is never capped; faster is capped.
export function scaleEnemySpeed(base, multiplier) {
  const scaled = Math.round(base * multiplier);
  return multiplier > 1 ? Math.min(scaled, Math.max(base, MAX_ENEMY_SPEED)) : scaled;
}
