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
  if (!(timeLeft > 0) || !(lives >= 1)) return 0;                 // not a real finish

  const noCoinsToCollect = totalCoins === 0;                      // a level without coins can't hold you back
  const overHalfCoins    = noCoinsToCollect || coins * 2 > totalCoins;
  const quarterCoins     = noCoinsToCollect || coins * 4 >= totalCoins;

  if (timeLeft * 2 > timeLimit  && overHalfCoins && lives >= 3) return 3;
  if (timeLeft * 4 >= timeLimit && quarterCoins  && lives >= 2) return 2;
  return 1;
}

// The smallest numbers that earn each star on a level, e.g. for showing hints.
export function starRequirements(timeLimit, totalCoins) {
  return {
    3: { timeLeft: Math.floor(timeLimit / 2) + 1, coins: Math.floor(totalCoins / 2) + 1, lives: 3 },
    2: { timeLeft: Math.ceil(timeLimit / 4),      coins: Math.ceil(totalCoins / 4),      lives: 2 },
    1: { timeLeft: 1,                              coins: 0,                              lives: 1 },
  };
}

// ── Saved progress: the best stars you have ever earned on each level ──
// (one number per level, shared by all difficulties)
const STORAGE_KEY = "coinCollectorStars";

export function loadStars() {
  const clean = {};
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (raw && typeof raw === "object") {
      for (const [level, value] of Object.entries(raw)) {
        const n = Number(value);
        if (/^\d+$/.test(level) && Number.isInteger(n) && n >= 0 && n <= MAX_STARS) clean[level] = n;
      }
    }
  } catch (e) { /* unreadable or blocked storage: start fresh */ }
  return clean;
}

// Keeps the best result. Returns what it was before and whether this run improved it.
export function saveBestStars(levelIndex, stars) {
  const all = loadStars();
  const previous = all[levelIndex] || 0;
  if (stars > previous) {
    all[levelIndex] = stars;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch (e) { /* ignore */ }
  }
  return { best: Math.max(previous, stars), previous, improved: stars > previous };
}
