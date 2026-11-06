import SoundManager from "../utils/SoundManager.js";
import { DIFFICULTIES, getDifficulty, saveDifficulty } from "../data/Difficulty.js";
import { makeButton } from "../utils/Button.js";

// 🏯 The title screen. The content is laid out for an 800x450 screen and centred on wider or taller ones;
// the background always fills the whole screen.
const TITLE_FONT = "Georgia, 'Times New Roman', serif";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create(data = {}) {
    const camW = this.cameras.main.width;
    const camH = this.cameras.main.height;
    const cx = camW / 2;
    const top = Math.max(0, (camH - 450) / 2);

    if (!data.resized) this.cameras.main.fadeIn(450, 0, 0, 0);
    this.drawBackground(camW, camH);

    // When the screen changes size (window resized, phone rotated), draw the menu again to fit
    let redrawing = false;
    const onResize = () => {
      if (redrawing) return;
      redrawing = true;
      this.time.delayedCall(120, () => this.scene.restart({ resized: true }));
    };
    this.scale.on("resize", onResize);
    this.events.once("shutdown", () => this.scale.off("resize", onResize));

    // 👹 Title: big gold "ONI" with a warm glow, floating gently, with a spinning coin on each side
    const titleY = top + 76;
    const shadow = this.add.text(cx + 5, titleY + 7, "ONI", {
      fontFamily: TITLE_FONT, fontSize: "100px", fontStyle: "bold", color: "#000000"
    }).setOrigin(0.5).setAlpha(0.35).setLetterSpacing(18);

    const title = this.add.text(cx, titleY, "ONI", {
      fontFamily: TITLE_FONT, fontSize: "100px", fontStyle: "bold",
      color: "#ffd23f", stroke: "#3a0d12", strokeThickness: 10,
      padding: { x: 30, y: 30 }   // room for the glow, so it doesn't get cut off in a box
    }).setOrigin(0.5).setLetterSpacing(18);
    const gold = title.context.createLinearGradient(0, 0, 0, title.height);
    gold.addColorStop(0.15, "#fff3b0");
    gold.addColorStop(0.55, "#ffc93c");
    gold.addColorStop(0.9, "#ff8a2a");
    title.setFill(gold);
    title.setShadow(0, 0, "#ff9a3c", 22, true, false);

    this.tweens.add({ targets: [title, shadow], y: "-=7", duration: 1800, yoyo: true, repeat: -1, ease: "Sine.InOut" });

    [-1, 1].forEach((side, i) => this.addSpinningCoin(cx + side * 150, titleY + 4, i * 400));

    this.add.text(cx, top + 136, "Grab the coins  ·  Dodge the monsters  ·  Reach the flag", {
      fontSize: "16px", color: "#f1dcff", stroke: "#1a0b2e", strokeThickness: 4
    }).setOrigin(0.5);

    // 🎚️ Panel with the difficulty choice and the best score
    const panel = this.add.graphics();
    panel.fillStyle(0x120a24, 0.62);
    panel.fillRoundedRect(cx - 270, top + 160, 540, 150, 18);
    panel.lineStyle(2, 0xffffff, 0.12);
    panel.strokeRoundedRect(cx - 270, top + 160, 540, 150, 18);

    this.add.text(cx, top + 180, "DIFFICULTY   ·   tap one or press ← →", {
      fontSize: "13px", color: "#b9a6d9"
    }).setOrigin(0.5).setLetterSpacing(2);

    this._diffButtons = {};
    Object.keys(DIFFICULTIES).forEach((key, i) => {
      const b = { x: cx + (i - 1) * 165, y: top + 216, w: 150, h: 44, hover: false };
      b.g = this.add.graphics();
      b.text = this.add.text(b.x, b.y, "", { fontSize: "22px", fontStyle: "bold" }).setOrigin(0.5);
      const zone = this.add.zone(b.x, b.y, b.w, b.h).setInteractive({ useHandCursor: true });
      zone.on("pointerover", () => { b.hover = true;  this.drawDifficultyButton(key); });
      zone.on("pointerout",  () => { b.hover = false; this.drawDifficultyButton(key); });
      zone.on("pointerdown", () => this.setDifficulty(key));
      this._diffButtons[key] = b;
    });

    this._diffBlurb = this.add.text(cx, top + 258, "", {
      fontSize: "16px", color: "#ffffff", stroke: "#000000", strokeThickness: 3
    }).setOrigin(0.5);

    this.setDifficulty(getDifficulty(this.registry), false);   // show the remembered choice (default: Normal)

    // 🏆 Best score (the save key keeps the game's old name, so existing high scores are kept)
    const highScore = parseInt(localStorage.getItem("coinCollectorHighScore") || "0", 10);
    this.add.text(cx, top + 288, highScore > 0 ? `🏆  Best: ${highScore}` : "🏆  No high score yet", {
      fontSize: "18px",
      color: highScore > 0 ? "#ffd23f" : "#8f86a8",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5);

    // ▶ Play and ☰ Level Select
    SoundManager.stopMusic();

    let leaving = false;
    const go = (sceneKey) => {
      if (leaving) return;
      leaving = true;
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start(sceneKey));
    };
    const startGame = () => go("GameScene");

    makeButton(this, cx - 105, top + 352, 190, 50, "▶  PLAY", 0xe2552b, startGame);
    makeButton(this, cx + 105, top + 352, 190, 50, "☰  LEVELS", 0x4a3485, () => go("LevelSelectScene"));

    // Start hint and controls
    const hint = this.add.text(cx, top + 400, "Press SPACE or tap anywhere to start", {
      fontSize: "16px", color: "#ffffff", stroke: "#000000", strokeThickness: 3
    }).setOrigin(0.5);
    this.tweens.add({ targets: hint, alpha: 0.35, duration: 750, yoyo: true, repeat: -1, ease: "Sine.InOut" });

    this.add.text(cx, top + 428, "← →  move        ↑  jump        P / ESC  pause", {
      fontSize: "13px", color: "#a99cc8"
    }).setOrigin(0.5);

    // ⌨️ Keyboard: SPACE or ENTER to start, ← → to change difficulty
    this.input.keyboard.once("keydown-SPACE", startGame);
    this.input.keyboard.once("keydown-ENTER", startGame);
    this.input.keyboard.on("keydown-LEFT",  () => this.changeDifficulty(-1));
    this.input.keyboard.on("keydown-RIGHT", () => this.changeDifficulty(1));

    // Tap anywhere to start, but a tap that lands on a button is just that button, not "start"
    this.input.on("pointerdown", (pointer, objectsUnderPointer) => {
      if (objectsUnderPointer.length === 0) startGame();
    });
  }

  // 🌄 Dusk sky, stars and a moon, purple mountains, a red gate on the hill, drifting mist and rising embers
  drawBackground(camW, camH) {
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x150a2e, 0x150a2e, 0x6b2a5a, 0x6b2a5a, 1);
    sky.fillRect(0, 0, camW, camH);

    this.ensureGlowTexture("menuglow", 0xff8a3c);
    this.add.image(camW / 2, camH * 0.86, "menuglow").setDisplaySize(camW * 1.4, camH * 0.75).setAlpha(0.45);

    // Stars, a few of them twinkling
    const stars = this.add.graphics();
    for (let i = 0; i < 70; i++) {
      stars.fillStyle(0xffffff, 0.25 + Math.random() * 0.6);
      stars.fillCircle(Math.random() * camW, Math.random() * camH * 0.55, Math.random() < 0.15 ? 1.6 : 0.9);
    }
    for (let i = 0; i < 6; i++) {
      const s = this.add.circle(Math.random() * camW, Math.random() * camH * 0.45, 1.8, 0xffffff);
      this.tweens.add({ targets: s, alpha: 0.1, duration: 700 + Math.random() * 900, yoyo: true, repeat: -1, delay: Math.random() * 1500 });
    }

    // Moon
    this.ensureGlowTexture("moonhalo", 0xffd9a0);
    const moonX = camW * 0.83, moonY = camH * 0.2;
    this.add.image(moonX, moonY, "moonhalo").setDisplaySize(230, 230).setAlpha(0.45);
    const moon = this.add.graphics();
    moon.fillStyle(0xffe9bd, 1);
    moon.fillCircle(moonX, moonY, 38);
    moon.fillStyle(0xf2d49c, 1);
    moon.fillCircle(moonX - 12, moonY - 8, 7);
    moon.fillCircle(moonX + 14, moonY + 12, 5);

    // Far mountains: jagged peaks
    const far = this.add.graphics();
    far.fillStyle(0x3a1d52, 1);
    const farPts = [{ x: 0, y: camH }];
    for (let x = 0; x <= camW + 60; x += 60) {
      farPts.push({ x, y: camH * 0.58 + Math.sin(x / 140) * 30 + (Math.random() - 0.5) * 40 });
    }
    farPts.push({ x: camW + 60, y: camH });
    far.fillPoints(farPts, true);

    // Mist drifting slowly in front of the far mountains
    this.ensureGlowTexture("menumist", 0xe6d5ff);
    for (let i = 0; i < 6; i++) {
      const mist = this.add.image((i + 0.5) * camW / 6, camH * (0.66 + Math.random() * 0.08), "menumist")
        .setDisplaySize(260 + Math.random() * 160, 70 + Math.random() * 30)
        .setAlpha(0.14 + Math.random() * 0.08);
      this.tweens.add({ targets: mist, x: mist.x + 50 + Math.random() * 40, duration: 7000 + Math.random() * 5000, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    }

    // Near hills: soft rolling shapes, and a red torii gate standing on them
    const hillY = (x) => camH - 58 + Math.sin(x / 95) * 12 + Math.sin(x / 37) * 4;
    const near = this.add.graphics();
    near.fillStyle(0x1f0f33, 1);
    const nearPts = [{ x: 0, y: camH }];
    for (let x = 0; x <= camW + 20; x += 20) nearPts.push({ x, y: hillY(x) });
    nearPts.push({ x: camW + 20, y: camH });
    near.fillPoints(nearPts, true);

    this.drawTorii(Math.max(70, camW * 0.12), hillY(Math.max(70, camW * 0.12)) + 6);

    // Embers floating up
    if (!this.textures.exists("ember")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffa64d, 0.3);
      g.fillCircle(5, 5, 5);
      g.fillStyle(0xffe0a0, 1);
      g.fillCircle(5, 5, 1.8);
      g.generateTexture("ember", 10, 10);
      g.destroy();
    }
    this.add.particles(0, 0, "ember", {
      x: { min: 0, max: camW },
      y: camH + 10,
      lifespan: 7000,
      speedY: { min: -45, max: -20 },
      speedX: { min: -10, max: 10 },
      scale: { min: 0.5, max: 1.1 },
      alpha: { values: [0, 1, 0.4, 0.9, 0] },
      frequency: 220,
      advance: 6000
    });
  }

  // ⛩️ A small red gate: two posts, a curved top beam with upturned ends, and a lower beam
  drawTorii(x, groundY) {
    const g = this.add.graphics();
    const red = 0xc23a2b, dark = 0x7a1e18;
    const postH = 74, span = 64;
    g.fillStyle(red, 1);
    g.fillRect(x - span / 2 - 4, groundY - postH, 9, postH);
    g.fillRect(x + span / 2 - 5, groundY - postH, 9, postH);
    g.fillRect(x - span / 2 - 12, groundY - postH + 12, span + 24, 7);               // lower beam
    g.fillStyle(dark, 1);
    g.fillRect(x - span / 2 - 22, groundY - postH - 6, span + 44, 9);                // top beam
    g.fillTriangle(x - span / 2 - 22, groundY - postH - 6, x - span / 2 - 30, groundY - postH - 13, x - span / 2 - 22, groundY - postH + 3);
    g.fillTriangle(x + span / 2 + 22, groundY - postH - 6, x + span / 2 + 30, groundY - postH - 13, x + span / 2 + 22, groundY - postH + 3);
    g.fillStyle(red, 1);
    g.fillRect(x - 4, groundY - postH - 2, 8, 16);                                    // centre post between the beams
  }

  addSpinningCoin(x, y, delay) {
    const coin = this.add.graphics({ x, y });
    coin.fillStyle(0xb8860b, 1);
    coin.fillCircle(0, 0, 17);
    coin.fillStyle(0xffd23f, 1);
    coin.fillCircle(0, 0, 14);
    coin.lineStyle(2, 0xb8860b, 1);
    coin.strokeCircle(0, 0, 9);
    coin.fillStyle(0xffffff, 0.6);
    coin.fillCircle(-5, -5, 4);
    this.tweens.add({ targets: coin, scaleX: 0.12, duration: 520, yoyo: true, repeat: -1, ease: "Sine.InOut", delay });
    this.tweens.add({ targets: coin, y: y - 8, duration: 1300, yoyo: true, repeat: -1, ease: "Sine.InOut", delay });
  }

  // A soft round glow, drawn once and reused
  ensureGlowTexture(key, color) {
    if (this.textures.exists(key)) return;
    const tex = this.textures.createCanvas(key, 256, 256);
    const ctx = tex.getContext();
    const rgb = `${(color >> 16) & 255},${(color >> 8) & 255},${color & 255}`;
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, `rgba(${rgb},1)`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    tex.refresh();
  }

  // ← → move the selection (stops at Easy / Hard, no wrap-around)
  changeDifficulty(step) {
    const keys = Object.keys(DIFFICULTIES);
    const next = Math.min(Math.max(keys.indexOf(this.difficulty) + step, 0), keys.length - 1);
    this.setDifficulty(keys[next]);
  }

  setDifficulty(key, save = true) {
    if (!DIFFICULTIES[key]) return;
    this.difficulty = key;
    if (save) saveDifficulty(this.registry, key);
    Object.keys(this._diffButtons).forEach(k => this.drawDifficultyButton(k));
    this._diffBlurb.setText(DIFFICULTIES[key].blurb);
  }

  drawDifficultyButton(key) {
    const b = this._diffButtons[key];
    const selected = key === this.difficulty;
    const fill = selected
      ? Phaser.Display.Color.HexStringToColor(DIFFICULTIES[key].color).color
      : (b.hover ? 0x3a2e60 : 0x2a2048);
    b.g.clear();
    b.g.fillStyle(fill, 1);
    b.g.fillRoundedRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 12);
    if (selected) {
      b.g.fillStyle(0xffffff, 0.15);
      b.g.fillRoundedRect(b.x - b.w / 2 + 3, b.y - b.h / 2 + 3, b.w - 6, b.h / 2 - 3, { tl: 9, tr: 9, bl: 3, br: 3 });
    }
    b.g.lineStyle(2, 0xffffff, selected ? 0.7 : 0.15);
    b.g.strokeRoundedRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 12);
    b.text.setText((selected ? "✓ " : "") + DIFFICULTIES[key].label);
    b.text.setColor(selected ? "#ffffff" : "#a99cc8");
  }
}
