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

export function loadStars() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

    // New format: { easy: { 0: 3 }, normal: { 0: 2 }, hard: { 0: 1 } }
    if (raw.easy || raw.normal || raw.hard) {
      return raw;
    }

    // Migrate old format: { 0: 3, 1: 2 }
    // Old records are placed under Normal.
    return {
      easy: {},
      normal: raw,
      hard: {}
    };
  } catch {
    return { easy: {}, normal: {}, hard: {} };
  }
}

export function saveBestStars(levelIndex, difficulty, stars) {
  const all = loadStars();

  if (!all[difficulty]) all[difficulty] = {};

  const previous = all[difficulty][levelIndex] || 0;

  if (stars > previous) {
    all[difficulty][levelIndex] = stars;

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
