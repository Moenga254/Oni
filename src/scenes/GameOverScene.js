import { levels } from "../data/levels.js";
import { calculateStars, starRequirements, saveBestStars } from "../data/Stars.js";
import { DIFFICULTIES } from "../data/Difficulty.js";
import { drawStarRow } from "../utils/Starrow.js";
import { makeButton } from "../utils/Button.js";

// 🏁 The screen after a level: a celebration when you reach the flag, or "Game Over" when you run out
// of lives or time. Laid out for 800x450 and centred on wider or taller screens.
const TITLE_FONT = "Georgia, 'Times New Roman', serif";

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  init(data) {
    this.data_ = data;   // kept, so the screen can redraw itself after a resize
    this.won        = data.won;
    this.finalScore = data.score;
    this.timeLeft   = data.timeLeft  ?? 0;
    this.timeBonus  = data.timeBonus ?? 0;
    this.currentLevel = data.currentLevel || 0;
    this.cause = data.cause;   // "time" | "fall" | "enemy"
    this.difficultyKey = DIFFICULTIES[data.difficulty] ? data.difficulty : "normal";
    this.progress = data.progress;   // 0..1: how far along the level you got (only when you lose)

    // For the star rating (sent by GameScene when you reach the flag)
    const level = levels[this.currentLevel];
    this.coins      = data.coins      ?? 0;
    this.totalCoins = data.totalCoins ?? level.coins.length;
    this.lives      = data.lives      ?? 1;
    this.timeLimit  = data.timeLimit  ?? level.timeLimit;
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    this.cx = W / 2;
    this.top = Math.max(0, (H - 450) / 2);
    const redraw = Boolean(this.data_.redraw);

    // 🏆 Load & compare the overall high score. On a redraw it was already saved, so reuse the answer.
    const prevHigh = parseInt(localStorage.getItem("coinCollectorHighScore") || "0", 10);
    this.isNewHigh = redraw ? this.data_.redraw.isNewHigh : this.finalScore > prevHigh;
    if (!redraw && this.isNewHigh) {
      localStorage.setItem("coinCollectorHighScore", String(this.finalScore));
    }

    if (!redraw) this.cameras.main.fadeIn(400, 0, 0, 0);
    this.drawBackground(W, H, this.won);

    // When the screen changes size (window resized, phone rotated), draw it again to fit
    let redrawing = false;
    const onResize = () => {
      if (redrawing) return;
      redrawing = true;
      this.time.delayedCall(120, () => this.scene.restart({
        ...this.data_, redraw: { isNewHigh: this.isNewHigh, starsImproved: this.starsImproved }
      }));
    };
    this.scale.on("resize", onResize);
    this.events.once("shutdown", () => this.scale.off("resize", onResize));

    let leaving = false;
    this.go = (sceneKey) => {
      if (leaving) return;
      leaving = true;
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start(sceneKey));
    };
    this.input.keyboard.on("keydown-ESC", () => this.go("MenuScene"));

    if (this.won) this.showWinScreen(redraw);
    else this.showLoseScreen(redraw);
  }

  // ─── Win ──────────────────────────────────────────────────────────────────────────────────
  showWinScreen(redraw) {
    const { cx, top } = this;
    const currentLevel = this.currentLevel;
    const nextLevel = currentLevel + 1;
    const isLastLevel = nextLevel >= levels.length;

    // Save the level's best score
    const highScores = JSON.parse(localStorage.getItem("highScores") || "{}");
    const prevLevelBest = highScores[currentLevel] || 0;
    if (!highScores[currentLevel] || this.finalScore > highScores[currentLevel]) {
      highScores[currentLevel] = this.finalScore;
      localStorage.setItem("highScores", JSON.stringify(highScores));
    }

    // Unlock the next level
    const unlockedLevel = parseInt(localStorage.getItem("unlockedLevel") || "0");
    if (nextLevel > unlockedLevel && !isLastLevel) {
      localStorage.setItem("unlockedLevel", nextLevel.toString());
    }

    // ⭐ Star rating (same rules on every difficulty); keep the best one for Level Select
    const stats = {
      timeLeft: this.timeLeft, timeLimit: this.timeLimit,
      coins: this.coins, totalCoins: this.totalCoins, lives: this.lives
    };
    const stars = calculateStars(stats);
    const saved = saveBestStars(currentLevel, this.difficultyKey, stars);
    this.starsImproved = redraw ? this.data_.redraw.starsImproved : saved.improved;

    // Panel
    this.drawPanel(cx - 280, top + 14, 560, 304, 0xffd23f);

    // Title and level
    this.goldTitle(cx, top + 50, isLastLevel ? "YOU BEAT THE GAME!" : "LEVEL COMPLETE!", 36, ["#fff3b0", "#ffc93c", "#ff8a2a"], "#ff9a3c");
    this.levelChip(cx, top + 88, `${levels[currentLevel].name} cleared`);

    // The stars, popping in one after another with a little burst each
    drawStarRow(this, cx, top + 136, stars, { radius: 27, gap: 70, animate: !redraw });
    if (!redraw) {
      for (let i = 0; i < stars; i++) {
        this.time.delayedCall(300 + i * 250 + 200, () => this.sparkBurst(cx + (i - 1) * 70, top + 136));
      }
    }
    if (this.starsImproved && stars > 0) {
      this.badge(cx + 150, top + 118, "NEW BEST", 0x6fd36a, "#0d2a12");
    }

    // What the stars were based on
    const chips = [
      ["🪙", `${this.coins} / ${this.totalCoins}`, "coins"],
      ["⏱", `${this.timeLeft}s`, "time left"],
      ["❤️", `${this.lives}`, this.lives === 1 ? "life" : "lives"],
    ];
    chips.forEach(([icon, value, label], i) => this.statChip(cx + (i - 1) * 150, top + 192, icon, value, label));

    // How to earn the next star
    let hint = "Perfect! You earned every star.";
    if (stars < 3) {
      const next = stars + 1;
      const need = starRequirements(this.timeLimit, this.totalCoins)[next];
      hint = `For ${next} star${next > 1 ? "s" : ""}: finish with ${need.timeLeft}s+ left, ${need.coins}+ coins, ${need.lives}+ lives`;
    }
    this.add.text(cx, top + 228, hint, { fontSize: "13px", color: stars < 3 ? "#ffdd88" : "#9cf0a8" }).setOrigin(0.5);

    // Score (counting up), with the time bonus and the best score
    this.scoreLine(cx, top + 270, redraw, this.timeBonus > 0 ? `incl. +${this.timeBonus} time bonus` : "");
    if (this.isNewHigh) {
      this.badge(cx + 170, top + 266, "🌟 NEW HIGH SCORE", 0xffd23f, "#3a2200", true);
    } else {
      const best = Math.max(prevLevelBest, this.finalScore);
      this.add.text(cx + 170, top + 270, `Level best: ${best}`, { fontSize: "13px", color: "#b9a6d9" }).setOrigin(0.5);
    }

    // Buttons: the main one, then three smaller ones
    const play = (level) => { this.registry.set("currentLevel", level); this.go("GameScene"); };
    const primary = isLastLevel
      ? { label: "☰  ALL LEVELS", color: 0x4a3485, action: () => this.go("LevelSelectScene") }
      : { label: "▶  NEXT LEVEL", color: 0x2e9a4a, action: () => play(nextLevel) };
    makeButton(this, cx, top + 352, 230, 46, primary.label, primary.color, primary.action, 21);
    makeButton(this, cx - 150, top + 406, 136, 38, "↺  Replay", 0x3a2e60, () => play(currentLevel), 16);
    makeButton(this, cx, top + 406, 136, 38, "☰  Levels", 0x3a2e60, () => this.go("LevelSelectScene"), 16);
    makeButton(this, cx + 150, top + 406, 136, 38, "⌂  Menu", 0x3a2e60, () => this.go("MenuScene"), 16);
    this.input.keyboard.once("keydown-ENTER", primary.action);
    this.input.keyboard.once("keydown-SPACE", primary.action);

    // 🎉 Confetti
    if (!redraw) this.confetti();
  }

  // ─── Lose ─────────────────────────────────────────────────────────────────────────────────
  showLoseScreen(redraw) {
    const { cx, top } = this;
    const level = levels[this.currentLevel];

    this.drawPanel(cx - 260, top + 22, 520, 286, 0xff5a5a);

    // Title: drops in and shakes
    const title = this.goldTitle(cx, top + 72, "GAME OVER", 54, ["#ffb3a7", "#ff5a4a", "#b3152c"], "#ff3b3b");
    if (!redraw) {
      title.setScale(1.6).setAlpha(0);
      this.tweens.add({
        targets: title, scale: 1, alpha: 1, duration: 380, ease: "Back.Out",
        onComplete: () => this.cameras.main.shake(180, 0.006)
      });
    }

    // Why did the run end?
    const cause = this.cause ?? (this.timeLeft <= 0 ? "time" : "fall");
    const enemyName = { sea: "A fish", forest: "A snake", volcano: "A fire creature", swamp: "A swamp mutant" }[level.theme] || "A slime";
    const reasons = {
      time:  ["⏱", "Time's up!"],
      fall:  ["🕳️", "You fell off the edge!"],
      enemy: ["👾", `${enemyName} got you!`],
      lava:  ["🔥", "You fell into the lava!"],
      toxic: ["☣️", "You fell into the toxic water!"],
      rock:  ["🪨", "A falling rock got you!"]
    };
    const [icon, reason] = reasons[cause] || reasons.fall;
    this.add.text(cx, top + 128, `${icon}  ${reason}`, {
      fontSize: "22px", fontStyle: "bold", color: "#ffffff", stroke: "#000000", strokeThickness: 4
    }).setOrigin(0.5);
    this.levelChip(cx, top + 164, level.name);

    // How far you got
    if (typeof this.progress === "number") {
      const pct = Math.round(Math.min(1, Math.max(0, this.progress)) * 100);
      const barW = 300, barX = cx - barW / 2, barY = top + 196;
      const bar = this.add.graphics();
      bar.fillStyle(0x000000, 0.45);
      bar.fillRoundedRect(barX, barY, barW, 12, 6);
      const fill = this.add.graphics();
      const label = this.add.text(cx, barY + 26, "", { fontSize: "13px", color: "#d9cdf0" }).setOrigin(0.5);
      const drawFill = (p) => {
        fill.clear();
        if (p <= 0) return;
        fill.fillStyle(0xff8a5a, 1);
        fill.fillRoundedRect(barX, barY, Math.max(12, barW * p / 100), 12, 6);
        fill.fillStyle(0xffffff, 0.25);
        fill.fillRoundedRect(barX + 2, barY + 2, Math.max(8, barW * p / 100 - 4), 4, 2);
        label.setText(`You made it ${Math.round(p)}% of the way`);
      };
      if (redraw) drawFill(pct);
      else {
        const counter = { p: 0 };
        this.tweens.add({ targets: counter, p: pct, duration: 900, delay: 300, ease: "Cubic.Out", onUpdate: () => drawFill(counter.p) });
      }
      // a little flag at the end of the bar
      bar.fillStyle(0xffffff, 0.8);
      bar.fillRect(barX + barW + 6, barY - 8, 2, 20);
      bar.fillStyle(0xff4444, 1);
      bar.fillTriangle(barX + barW + 8, barY - 8, barX + barW + 20, barY - 4, barX + barW + 8, barY);
    }

    this.scoreLine(cx + 60, top + 270, redraw, "");   // nothing beside it here, so nudge it to the middle

    // Buttons
    const retry = () => { this.registry.set("currentLevel", this.currentLevel); this.go("GameScene"); };
    makeButton(this, cx, top + 346, 230, 46, "↺  TRY AGAIN", 0xe2552b, retry, 21);
    makeButton(this, cx - 80, top + 402, 146, 38, "☰  Levels", 0x3a2e60, () => this.go("LevelSelectScene"), 16);
    makeButton(this, cx + 80, top + 402, 146, 38, "⌂  Menu", 0x3a2e60, () => this.go("MenuScene"), 16);
    this.input.keyboard.once("keydown-ENTER", retry);
    this.input.keyboard.once("keydown-SPACE", retry);
  }

  // ─── Pieces ───────────────────────────────────────────────────────────────────────────────

  // Dusk sky like the menus: warm and golden after a win, dark red after a loss
  drawBackground(W, H, won) {
    const sky = this.add.graphics();
    if (won) sky.fillGradientStyle(0x1b0f3a, 0x1b0f3a, 0x7a3a4a, 0x7a3a4a, 1);
    else sky.fillGradientStyle(0x12060f, 0x12060f, 0x4a1020, 0x4a1020, 1);
    sky.fillRect(0, 0, W, H);

    if (!this.textures.exists("go_glow")) {
      const tex = this.textures.createCanvas("go_glow", 256, 256);
      const ctx = tex.getContext();
      const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      tex.refresh();
    }
    const glow = this.add.image(W / 2, H * 0.32, "go_glow")
      .setDisplaySize(W * 1.1, H * 0.9).setTint(won ? 0xffb347 : 0xff3b3b).setAlpha(won ? 0.35 : 0.25);
    this.tweens.add({ targets: glow, alpha: glow.alpha * 0.6, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.InOut" });

    const stars = this.add.graphics();
    for (let i = 0; i < 60; i++) {
      stars.fillStyle(0xffffff, 0.15 + Math.random() * 0.5);
      stars.fillCircle(Math.random() * W, Math.random() * H * 0.7, Math.random() < 0.15 ? 1.5 : 0.8);
    }

    const hills = this.add.graphics();
    hills.fillStyle(won ? 0x24123a : 0x1a0812, 1);
    const pts = [{ x: 0, y: H }];
    for (let x = 0; x <= W + 20; x += 20) pts.push({ x, y: H - 30 + Math.sin(x / 95) * 9 + Math.sin(x / 37) * 3 });
    pts.push({ x: W + 20, y: H });
    hills.fillPoints(pts, true);

    // Dark corners, so the eye goes to the middle
    const edge = this.add.graphics();
    edge.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.45, 0.45, 0, 0);
    edge.fillRect(0, 0, W, H * 0.18);
  }

  drawPanel(x, y, w, h, accent) {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.35);
    g.fillRoundedRect(x + 4, y + 6, w, h, 20);
    g.fillStyle(0x140a26, 0.82);
    g.fillRoundedRect(x, y, w, h, 20);
    g.lineStyle(2, accent, 0.45);
    g.strokeRoundedRect(x, y, w, h, 20);
    g.lineStyle(1, 0xffffff, 0.08);
    g.strokeRoundedRect(x + 6, y + 6, w - 12, h - 12, 15);
  }

  // A big serif title with a colour fade, outline and glow (like the "ONI" title)
  goldTitle(x, y, text, size, stops, glowColor) {
    const t = this.add.text(x, y, text, {
      fontFamily: TITLE_FONT, fontSize: `${size}px`, fontStyle: "bold",
      color: stops[1], stroke: "#2a0a10", strokeThickness: Math.round(size / 7),
      padding: { x: 24, y: 20 }
    }).setOrigin(0.5).setLetterSpacing(2);
    const grad = t.context.createLinearGradient(0, 0, 0, t.height);
    grad.addColorStop(0.3, stops[0]);
    grad.addColorStop(0.6, stops[1]);
    grad.addColorStop(0.85, stops[2]);
    t.setFill(grad);
    t.setShadow(0, 0, glowColor, 16, true, false);
    return t;
  }

  // "Grasslands cleared  ·  Normal" with the difficulty in its own colour
  levelChip(x, y, text) {
    const diff = DIFFICULTIES[this.difficultyKey];
    const name = this.add.text(0, 0, text, { fontSize: "16px", color: "#f1dcff" }).setOrigin(0, 0.5);
    const dot = this.add.text(0, 0, "  ·  ", { fontSize: "16px", color: "#8f86a8" }).setOrigin(0, 0.5);
    const mode = this.add.text(0, 0, diff.label, { fontSize: "16px", fontStyle: "bold", color: diff.color }).setOrigin(0, 0.5);
    const total = name.width + dot.width + mode.width;
    let left = x - total / 2;
    [name, dot, mode].forEach(t => { t.setPosition(left, y); left += t.width; });
  }

  statChip(x, y, icon, value, label) {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.07);
    g.fillRoundedRect(x - 66, y - 20, 132, 40, 12);
    g.lineStyle(1, 0xffffff, 0.12);
    g.strokeRoundedRect(x - 66, y - 20, 132, 40, 12);
    this.add.text(x - 46, y, icon, { fontSize: "18px" }).setOrigin(0.5);
    this.add.text(x - 30, y - 6, value, { fontSize: "16px", fontStyle: "bold", color: "#ffffff" }).setOrigin(0, 0.5);
    this.add.text(x - 30, y + 10, label, { fontSize: "11px", color: "#b9a6d9" }).setOrigin(0, 0.5);
  }

  // "SCORE  1234", counting up from 0
  scoreLine(x, y, redraw, note) {
    this.add.text(x - 170, y, "SCORE", { fontSize: "13px", fontStyle: "bold", color: "#b9a6d9" }).setOrigin(0, 0.5).setLetterSpacing(3);
    const value = this.add.text(x - 110, y, redraw ? String(this.finalScore) : "0", {
      fontFamily: TITLE_FONT, fontSize: "30px", fontStyle: "bold", color: "#ffe9a8", stroke: "#000000", strokeThickness: 4
    }).setOrigin(0, 0.5);
    if (note) this.add.text(x - 108, y + 22, note, { fontSize: "11px", color: "#8f86a8" }).setOrigin(0, 0.5);
    if (!redraw) {
      const counter = { v: 0 };
      this.tweens.add({
        targets: counter, v: this.finalScore, duration: 900, delay: 500, ease: "Cubic.Out",
        onUpdate: () => value.setText(String(Math.round(counter.v)))
      });
    }
  }

  // A small rounded label that gently pulses (NEW BEST, NEW HIGH SCORE)
  badge(x, y, text, color, textColor, wide = false) {
    const label = this.add.text(0, 0, text, { fontSize: "12px", fontStyle: "bold", color: textColor }).setOrigin(0.5);
    const w = label.width + 20, h = 22;
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    g.fillStyle(0xffffff, 0.3);
    g.fillRoundedRect(-w / 2 + 3, -h / 2 + 2, w - 6, 6, 3);
    const c = this.add.container(x, y, [g, label]);
    this.tweens.add({ targets: c, scale: wide ? 1.06 : 1.1, duration: 600, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    return c;
  }

  sparkBurst(x, y) {
    for (let i = 0; i < 10; i++) {
      const s = this.add.star(x, y, 4, 2, 5, 0xfff3b0);
      const a = (i / 10) * Math.PI * 2;
      this.tweens.add({
        targets: s, x: x + Math.cos(a) * 46, y: y + Math.sin(a) * 46, alpha: 0, angle: 180,
        duration: 520, ease: "Cubic.Out", onComplete: () => s.destroy()
      });
    }
  }

  confetti() {
    if (!this.textures.exists("confetti")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 8, 4);
      g.generateTexture("confetti", 8, 4);
      g.destroy();
    }
    const W = this.cameras.main.width;
    this.add.particles(0, 0, "confetti", {
      x: { min: 0, max: W },
      y: -10,
      lifespan: 4200,
      speedY: { min: 70, max: 150 },
      speedX: { min: -40, max: 40 },
      rotate: { min: 0, max: 360 },
      scale: { min: 0.7, max: 1.2 },
      tint: [0xffd23f, 0xff6b6b, 0x6fd36a, 0x4fc3f7, 0xb07cff, 0xffffff],
      alpha: { start: 1, end: 0.2 },
      frequency: 45,
      duration: 2600
    });
  }
}
