// ⭐ Star ratings. The rules are the same on every level and on every difficulty.
//
// A rating needs ALL THREE things: time left, coins collected, and lives left.
// They are minimums, so doing better at any of them can never lower your rating.
//
//   3 stars: MORE than half the time left   AND  MORE than half the coins  AND  3 or more lives left
//   2 stars: at least a QUARTER of the time AND  at least a QUARTER of coins AND  2 or more lives left
//   1 star : you reached the flag before the time ran out (with a life left)
//
// Whole-number maths is used on purpose ("timeLeft * 2 > timeLimit"), so there are
// no rounding surprises at exactly 50% or 25%.

export const MAX_STARS = 3;

export function calculateStars({ timeLeft, timeLimit, coins, totalCoins, lives }) {
  if (!(timeLeft > 0) || !(lives >= 1)) return 0;

  const noCoins = totalCoins === 0;
  const overHalfCoins = noCoins || coins * 2 > totalCoins;
  const quarterCoins = noCoins || coins * 4 >= totalCoins;

  if (timeLeft * 2 > timeLimit && overHalfCoins && lives >= 3) return 3;
  if (timeLeft * 4 >= timeLimit && quarterCoins && lives >= 2) return 2;

  return 1;
}

export function starRequirements(timeLimit, totalCoins) {
  return {
    3: {
      timeLeft: Math.floor(timeLimit / 2) + 1,
      coins: Math.floor(totalCoins / 2) + 1,
      lives: 3
    },
    2: {
      timeLeft: Math.ceil(timeLimit / 4),
      coins: Math.ceil(totalCoins / 4),
      lives: 2
    },
    1: { timeLeft: 1, coins: 0, lives: 1 }
  };
}

const STORAGE_KEY = "coinCollectorStars";
const MODES = ["easy", "normal", "hard"];

// Keep only sensible entries: level number -> 0..3 stars
function cleanLevels(raw) {
  const clean = {};
  if (raw && typeof raw === "object") {
    for (const [level, value] of Object.entries(raw)) {
      const n = Number(value);
      if (/^\d+$/.test(level) && Number.isInteger(n) && n >= 0 && n <= MAX_STARS) clean[level] = n;
    }
  }
  return clean;
}

// Always returns { easy: {...}, normal: {...}, hard: {...} }, each mapping level -> best stars.
// Anything broken or missing is treated as "no stars yet" instead of crashing the Level Select.
export function loadStars() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch (e) { raw = null; }

  const result = { easy: {}, normal: {}, hard: {} };
  if (!raw || typeof raw !== "object") return result;

  if (MODES.some(mode => mode in raw)) {
    // Current format: { easy: { 0: 3 }, normal: { 0: 2 }, hard: { 0: 1 } }
    MODES.forEach(mode => { result[mode] = cleanLevels(raw[mode]); });
  } else {
    // Old format { 0: 3, 1: 2 } (saved before stars were kept per difficulty) counts as Normal
    result.normal = cleanLevels(raw);
  }
  return result;
}

// Keeps the best result for that level in that difficulty (every other level and mode is left alone)
export function saveBestStars(levelIndex, difficulty, stars) {
  const mode = MODES.includes(difficulty) ? difficulty : "normal";
  const all = loadStars();

  const previous = all[mode][levelIndex] || 0;

  if (stars > previous) {
    all[mode][levelIndex] = stars;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      // Ignore storage errors
    }
  }

  return {
    best: Math.max(previous, stars),
    previous,
    improved: stars > previous
  };
}
