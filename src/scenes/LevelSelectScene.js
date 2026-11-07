import { levels } from "../data/levels.js";
import { loadStars, MAX_STARS } from "../data/Stars.js";
import { drawStarRow } from "../utils/Starrow.js";

// 🧭 Layout: levels flow in rows of 3, going DOWN the screen.
// Two rows fit at once. With more levels the list scrolls: mouse wheel, drag/swipe, or the ↑ ↓ keys.
// The content is laid out for 800x450 and centred on wider or taller screens.
const COLUMNS = 3;
const CARD_W = 240;
const CARD_H = 166;
const THUMB_H = 92;        // the picture of the level at the top of each card
const GAP_X = 20;
const GAP_Y = 12;
const LIST_TOP = 78;       // the cards scroll inside a window from here...
const LIST_H = 350;        // ...this tall
const TITLE_FONT = "Georgia, 'Times New Roman', serif";

// 🎨 Each level's look on its card: accent colour (border, badge, PLAY) and its picture's sky colours
const THEMES = {
  grass:   { accent: 0x6fd36a, sky: [0x6ec3ef, 0xcdeefd] },
  crystal: { accent: 0xb07cff, sky: [0x2a0f4f, 0x0c0420] },
  sunset:  { accent: 0xffa53d, sky: [0xff6a1a, 0xffd34d] },
  ice:     { accent: 0x8fd8ff, sky: [0x0c2a48, 0x2d6a92] },
  sea:     { accent: 0x4fc3f7, sky: [0x0d6aa0, 0x03264f] },
  forest:  { accent: 0xffd23f, sky: [0x1a2240, 0x070b16] },
  volcano: { accent: 0xff5a1a, sky: [0x1a0404, 0x8a220a] },
  swamp:   { accent: 0xa6e22e, sky: [0x14200e, 0x4a5a1a] },
};

// Grasslands and Sky Kingdom have no theme in levels.js; give them one here for their pictures
function themeOf(level, index) {
  return level.theme || ["grass", null, "sunset"][index] || "grass";
}

export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super("LevelSelectScene");
  }

  create(data = {}) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const top = Math.max(0, (H - 450) / 2);
    const VIEW = { x: 0, y: top + LIST_TOP, w: W, h: LIST_H };

    if (!data.resized) this.cameras.main.fadeIn(350, 0, 0, 0);
    this.drawBackground(W, H);

    // When the screen changes size (window resized, phone rotated), draw everything again to fit
    let redrawing = false;
    const onResize = () => {
      if (redrawing) return;
      redrawing = true;
      this.time.delayedCall(120, () => this.scene.restart({ resized: true }));
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

    // Saved progress
    const unlockedLevel = parseInt(localStorage.getItem("unlockedLevel") || "0");
    const highScores = JSON.parse(localStorage.getItem("highScores") || "{}");
    const allStars = loadStars();   // { easy: {level: stars}, normal: {...}, hard: {...} }

    // ⭐ Title, in the same gold as the start screen
    const title = this.add.text(W / 2, top + 40, "SELECT LEVEL", {
      fontFamily: TITLE_FONT, fontSize: "36px", fontStyle: "bold",
      color: "#ffd23f", stroke: "#3a0d12", strokeThickness: 6,
      padding: { x: 20, y: 16 }
    }).setOrigin(0.5).setLetterSpacing(4);
    const gold = title.context.createLinearGradient(0, 0, 0, title.height);
    gold.addColorStop(0.25, "#fff3b0");
    gold.addColorStop(0.6, "#ffc93c");
    gold.addColorStop(0.85, "#ff8a2a");
    title.setFill(gold);
    title.setShadow(0, 0, "#ff9a3c", 14, true, false);

    // 🔙 Back (or ESC)
    this.makePill(20, top + 22, 96, 32, "←  Back", 0x2a2048, () => this.go("MenuScene"));
    this.input.keyboard.on("keydown-ESC", () => this.go("MenuScene"));

    // ★ All the stars you have collected, out of every star in the game
    let earnedTotal = 0;
    Object.values(allStars).forEach(mode => Object.values(mode).forEach(n => { earnedTotal += n; }));
    const possible = levels.length * 3 * MAX_STARS;
    const pill = this.add.graphics();
    pill.fillStyle(0x120a24, 0.75);
    pill.fillRoundedRect(W - 138, top + 22, 118, 32, 16);
    pill.lineStyle(2, 0xffd23f, 0.45);
    pill.strokeRoundedRect(W - 138, top + 22, 118, 32, 16);
    this.add.star(W - 116, top + 38, 5, 4.5, 10, 0xffd700).setStrokeStyle(1.5, 0xb8860b);
    this.add.text(W - 100, top + 38, `${earnedTotal} / ${possible}`, {
      fontSize: "15px", fontStyle: "bold", color: "#ffe9a8"
    }).setOrigin(0, 0.5);

    // 🎮 Level cards, 3 per row, rows going down. Each card is one container, so it can grow and slide in.
    const rows = Math.ceil(levels.length / COLUMNS);
    const contentH = rows * CARD_H + (rows - 1) * GAP_Y + 6;
    this.maxScroll = Math.max(0, contentH - VIEW.h);
    this.dragged = false;

    const cards = levels.map((level, index) => {
      const col = index % COLUMNS;
      const row = Math.floor(index / COLUMNS);
      const x = W / 2 + (col - (COLUMNS - 1) / 2) * (CARD_W + GAP_X);
      const y = 3 + row * (CARD_H + GAP_Y) + CARD_H / 2;   // list coordinates: 0 = top of the window
      const card = this.createLevelCard(x, y, level, index, index <= unlockedLevel, highScores[index], allStars);

      card.setAlpha(0).setY(y + 24);
      this.tweens.add({ targets: card, alpha: 1, y, duration: 420, delay: 80 + index * 70, ease: "Back.Out" });
      return card;
    });

    // 💡 Footer
    this.add.text(W / 2, top + 439, "Stars are kept for each difficulty  ·  Finish a level to unlock the next", {
      fontSize: "13px", color: "#8f86a8"
    }).setOrigin(0.5);

    // 📜 The cards live in their own camera, so they are clipped to the window (and so are clicks)
    this.listCam = this.cameras.add(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
    this.listCam.setBounds(0, 0, W, Math.max(VIEW.h, contentH));
    this.cameras.main.ignore(cards);

    // Scrollbar (only drawn when there is more than fits)
    this.scrollbar = this.add.graphics();
    const drawScrollbar = () => {
      this.scrollbar.clear();
      if (this.maxScroll <= 0) return;
      const trackX = W - 9;
      const thumbH = Math.max(30, VIEW.h * VIEW.h / contentH);
      const thumbY = VIEW.y + (this.listCam.scrollY / this.maxScroll) * (VIEW.h - thumbH);
      this.scrollbar.fillStyle(0xffffff, 0.15);
      this.scrollbar.fillRoundedRect(trackX, VIEW.y, 5, VIEW.h, 2);
      this.scrollbar.fillStyle(0xffffff, 0.6);
      this.scrollbar.fillRoundedRect(trackX, thumbY, 5, thumbH, 2);
    };

    this.listCam.ignore(this.children.list.filter(o => !cards.includes(o)));

    this.scrollTo = (value) => {
      this.listCam.scrollY = Phaser.Math.Clamp(value, 0, this.maxScroll);
      drawScrollbar();
    };
    this.scrollTo(0);

    if (this.maxScroll > 0) {
      // mouse wheel
      this.input.on("wheel", (pointer, over, dx, dy) => this.scrollTo(this.listCam.scrollY + dy * 0.7));

      // drag / swipe (a drag never presses a card by accident)
      let dragStartY = null;
      let startScroll = 0;
      this.input.on("pointerdown", (p) => {
        this.dragged = false;
        if (p.y >= VIEW.y && p.y <= VIEW.y + VIEW.h) { dragStartY = p.y; startScroll = this.listCam.scrollY; }
      });
      this.input.on("pointermove", (p) => {
        if (dragStartY === null || !p.isDown) return;
        const dy = dragStartY - p.y;
        if (Math.abs(dy) > 8) this.dragged = true;
        if (this.dragged) this.scrollTo(startScroll + dy);
      });
      this.input.on("pointerup", () => { dragStartY = null; });

      // keyboard
      this.input.keyboard.on("keydown-DOWN", () => this.scrollTo(this.listCam.scrollY + CARD_H + GAP_Y));
      this.input.keyboard.on("keydown-UP", () => this.scrollTo(this.listCam.scrollY - CARD_H - GAP_Y));
    }
  }

  // 🌌 The same dusk look as the start screen: purple sky, stars, dark hills, embers
  drawBackground(W, H) {
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x150a2e, 0x150a2e, 0x3b1a4f, 0x3b1a4f, 1);
    sky.fillRect(0, 0, W, H);

    const stars = this.add.graphics();
    for (let i = 0; i < 60; i++) {
      stars.fillStyle(0xffffff, 0.2 + Math.random() * 0.5);
      stars.fillCircle(Math.random() * W, Math.random() * H * 0.7, Math.random() < 0.15 ? 1.5 : 0.8);
    }

    const hills = this.add.graphics();
    hills.fillStyle(0x1f0f33, 1);
    const pts = [{ x: 0, y: H }];
    for (let x = 0; x <= W + 20; x += 20) pts.push({ x, y: H - 34 + Math.sin(x / 95) * 9 + Math.sin(x / 37) * 3 });
    pts.push({ x: W + 20, y: H });
    hills.fillPoints(pts, true);

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
      x: { min: 0, max: W },
      y: H + 10,
      lifespan: 7000,
      speedY: { min: -40, max: -18 },
      speedX: { min: -8, max: 8 },
      scale: { min: 0.4, max: 0.9 },
      alpha: { values: [0, 0.8, 0.3, 0.7, 0] },
      frequency: 400,
      advance: 6000
    });
  }

  // A small rounded button (used for Back)
  makePill(x, y, w, h, label, color, onClick) {
    const g = this.add.graphics();
    const draw = (hover) => {
      g.clear();
      g.fillStyle(hover ? 0x3a2e60 : color, 0.9);
      g.fillRoundedRect(x, y, w, h, h / 2);
      g.lineStyle(2, 0xffffff, hover ? 0.5 : 0.2);
      g.strokeRoundedRect(x, y, w, h, h / 2);
    };
    draw(false);
    this.add.text(x + w / 2, y + h / 2, label, { fontSize: "15px", fontStyle: "bold", color: "#f1dcff" }).setOrigin(0.5);
    g.setInteractive({ hitArea: new Phaser.Geom.Rectangle(x, y, w, h), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
    g.on("pointerover", () => draw(true));
    g.on("pointerout", () => draw(false));
    g.on("pointerdown", onClick);
  }

  // One card: a little picture of the level, its number and name, the best stars in each mode, best score, PLAY.
  // Everything is drawn around the card's centre (0, 0) inside one container.
  createLevelCard(x, y, level, index, unlocked, highScore, allStars) {
    const theme = THEMES[themeOf(level, index)];
    const left = -CARD_W / 2;
    const top = -CARD_H / 2;
    const card = this.add.container(x, y);
    const add = (obj) => { card.add(obj); return obj; };

    // Card body and the picture of the level
    const body = add(this.add.graphics());
    body.fillStyle(0x000000, 0.35);
    body.fillRoundedRect(left + 3, top + 5, CARD_W, CARD_H, 14);
    body.fillStyle(0x1b1030, 0.96);
    body.fillRoundedRect(left, top, CARD_W, CARD_H, 14);

    const pic = add(this.add.graphics());
    drawLevelPicture(pic, themeOf(level, index), left, top, CARD_W, THUMB_H, theme.sky, index);

    // Dark fade at the bottom of the picture, so the name is easy to read
    pic.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.7, 0.7);
    pic.fillRect(left, top + THUMB_H - 38, CARD_W, 38);

    // "LEVEL n" badge and the level's name
    const badge = add(this.add.graphics());
    badge.fillStyle(theme.accent, 0.95);
    badge.fillRoundedRect(left + 10, top + 9, 62, 19, 9.5);
    add(this.add.text(left + 41, top + 18.5, `LEVEL ${index + 1}`, {
      fontSize: "11px", fontStyle: "bold", color: "#1b1030"
    }).setOrigin(0.5));
    add(this.add.text(left + 12, top + THUMB_H - 15, level.name, {
      fontFamily: TITLE_FONT, fontSize: "19px", fontStyle: "bold",
      color: "#ffffff", stroke: "#000000", strokeThickness: 4
    }).setOrigin(0, 0.5));

    // Border: brighter, with a soft glow, while you point at the card
    const border = add(this.add.graphics());
    const drawBorder = (hover) => {
      border.clear();
      if (hover) {
        border.lineStyle(7, theme.accent, 0.25);
        border.strokeRoundedRect(left - 2, top - 2, CARD_W + 4, CARD_H + 4, 16);
      }
      border.lineStyle(hover ? 3 : 2, unlocked ? theme.accent : 0x5a5070, hover ? 1 : 0.55);
      border.strokeRoundedRect(left, top, CARD_W, CARD_H, 14);
    };

    if (!unlocked) {
      // 🔒 Locked: dim the whole card and show a padlock
      const shade = add(this.add.graphics());
      shade.fillStyle(0x0b0614, 0.7);
      shade.fillRoundedRect(left, top, CARD_W, CARD_H, 14);
      const lock = add(this.add.graphics());
      lock.lineStyle(5, 0xb9a6d9, 1);
      lock.beginPath();
      lock.arc(0, top + 40, 10, Math.PI, 0);
      lock.strokePath();
      lock.fillStyle(0xb9a6d9, 1);
      lock.fillRoundedRect(-17, top + 40, 34, 26, 5);
      lock.fillStyle(0x1b1030, 1);
      lock.fillCircle(0, top + 50, 3.5);
      lock.fillRect(-1.5, top + 50, 3, 9);
      add(this.add.text(0, top + 116, "LOCKED", {
        fontSize: "14px", fontStyle: "bold", color: "#b9a6d9"
      }).setOrigin(0.5).setLetterSpacing(3));
      add(this.add.text(0, top + 140, `Finish Level ${index} to unlock`, {
        fontSize: "12px", color: "#8f86a8"
      }).setOrigin(0.5));
    } else {
      // ⭐ The best stars on this level in each mode
      const modes = [["easy", "EASY", "#70e090"], ["normal", "NORMAL", "#9cc2ff"], ["hard", "HARD", "#ff8f8f"]];
      modes.forEach(([key, label, color], i) => {
        const gx = (i - 1) * 78;
        add(this.add.text(gx, top + 104, label, { fontSize: "10px", fontStyle: "bold", color }).setOrigin(0.5).setLetterSpacing(1));
        drawStarRow(this, gx, top + 120, allStars[key]?.[index] || 0, { radius: 6.5, gap: 16 }).forEach(add);
      });

      const divider = add(this.add.graphics());
      divider.lineStyle(1, 0xffffff, 0.1);
      divider.lineBetween(left + 12, top + 133, left + CARD_W - 12, top + 133);

      add(this.add.text(left + 12, top + 150, highScore ? `🏆 ${highScore}` : "Not played yet", {
        fontSize: "13px", fontStyle: highScore ? "bold" : "normal", color: highScore ? "#ffd23f" : "#8f86a8"
      }).setOrigin(0, 0.5));

      const play = add(this.add.graphics());
      play.fillStyle(theme.accent, 1);
      play.fillRoundedRect(left + CARD_W - 86, top + 138, 74, 24, 12);
      play.fillStyle(0xffffff, 0.25);
      play.fillRoundedRect(left + CARD_W - 83, top + 140, 68, 9, { tl: 8, tr: 8, bl: 2, br: 2 });
      add(this.add.text(left + CARD_W - 49, top + 150, "▶ PLAY", {
        fontSize: "12px", fontStyle: "bold", color: "#1b1030"
      }).setOrigin(0.5));
    }
    drawBorder(false);

    // The whole card is the button
    body.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(left, top, CARD_W, CARD_H),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: unlocked
    });
    body.on("pointerover", () => {
      drawBorder(true);
      if (unlocked) this.tweens.add({ targets: card, scale: 1.04, duration: 140, ease: "Sine.Out" });
    });
    body.on("pointerout", () => {
      drawBorder(false);
      this.tweens.add({ targets: card, scale: 1, duration: 140, ease: "Sine.Out" });
    });
    body.on("pointerup", () => {
      if (this.dragged) return;               // that was a scroll, not a tap
      if (!unlocked) {                        // a little "no" shake
        this.tweens.add({ targets: card, x: x + 6, duration: 50, yoyo: true, repeat: 2, onComplete: () => card.setX(x) });
        return;
      }
      this.registry.set("currentLevel", index);
      this.go("GameScene");
    });

    return card;
  }
}

// ─── Level pictures ──────────────────────────────────────────────────────────────────────────
// Small drawings of each level for the top of its card. Everything stays inside the picture's
// rectangle (x, y, w, h); its top corners are rounded like the card.

function makeRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A circle with everything below `bottom` cut off (for a sun setting on the horizon)
function clippedCircle(g, cx, cy, r, bottom) {
  const pts = [];
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    pts.push({ x: cx + Math.cos(a) * r, y: Math.min(cy + Math.sin(a) * r, bottom) });
  }
  g.fillPoints(pts, true);
}

// Rolling hills across the picture, filled down to its bottom edge
function hills(g, x, w, bottom, baseY, amp, period, phase, color, alpha = 1) {
  g.fillStyle(color, alpha);
  const pts = [{ x, y: bottom }];
  for (let px = x; px <= x + w; px += 6) pts.push({ x: px, y: baseY + Math.sin((px - x) / period + phase) * amp });
  pts.push({ x: x + w, y: bottom });
  g.fillPoints(pts, true);
}

// A row of pointed shapes (pine trees, ice peaks) standing on the bottom edge
function spikes(g, x, w, bottom, { minH, maxH, minW, maxW }, color, rand, alpha = 1) {
  g.fillStyle(color, alpha);
  for (let px = x + 4; px < x + w - 4; px += minW * 0.6 + rand() * (maxW - minW) * 0.5) {
    const sw = minW + rand() * (maxW - minW);
    const sh = minH + rand() * (maxH - minH);
    const l = Math.max(x, px - sw / 2), r = Math.min(x + w, px + sw / 2);
    g.fillTriangle(l, bottom, r, bottom, px, bottom - sh);
  }
}

function drawLevelPicture(g, theme, x, y, w, h, sky, index) {
  const rand = makeRandom(1000 + index * 77);
  const bottom = y + h;
  const r = 14;

  // Sky: a rounded strip at the top, then a gradient for the rest
  g.fillStyle(sky[0], 1);
  g.fillRoundedRect(x, y, w, r * 2, { tl: r, tr: r, bl: 0, br: 0 });
  g.fillGradientStyle(sky[0], sky[0], sky[1], sky[1], 1);
  g.fillRect(x, y + r, w, h - r);

  if (theme === "grass") {
    g.fillStyle(0xfff3a0, 0.35); g.fillCircle(x + w - 44, y + 30, 20);
    g.fillStyle(0xffe36e, 1);    g.fillCircle(x + w - 44, y + 30, 13);
    g.fillStyle(0xffffff, 0.95);
    [[x + 64, y + 30], [x + 138, y + 46]].forEach(([cx, cy]) => {
      g.fillEllipse(cx, cy, 44, 16); g.fillEllipse(cx + 12, cy - 7, 26, 16); g.fillEllipse(cx - 12, cy - 4, 22, 13);
    });
    hills(g, x, w, bottom, bottom - 30, 7, 30, 0.5, 0x7cc96a);
    hills(g, x, w, bottom, bottom - 16, 4, 18, 2, 0x4a9a3a);
    g.fillStyle(0x8b4513, 1); g.fillRect(x + 150, y + 52, 48, 7);
    g.fillStyle(0x6fbf4a, 1); g.fillRect(x + 150, y + 52, 48, 2);
    g.fillStyle(0xffdd00, 1); g.fillCircle(x + 174, y + 43, 5);
    g.fillStyle(0xff4444, 1); g.fillEllipse(x + 92, bottom - 19, 16, 11);
  }

  if (theme === "crystal") {
    // dark stalactites hanging from the ceiling, glowing crystal clusters on the floor
    g.fillStyle(0x0f0720, 1);
    for (let px = x + 22; px < x + w - 22; px += 18 + rand() * 14) g.fillTriangle(px - 7, y, px + 7, y, px, y + 10 + rand() * 18);
    [[x + 40, 34], [x + 120, 46], [x + 196, 38]].forEach(([cx, size]) => {
      [1, 0.75, 0.5].forEach(k => { g.fillStyle(0xa25bff, 0.09); g.fillCircle(cx, bottom - size * 0.4, size * 0.7 * k); });   // soft glow
      [-0.5, 0, 0.5].forEach((t, i) => {
        const L = size * (i === 1 ? 1 : 0.65), Wd = 9, ang = t * 0.8;
        const ax = Math.sin(ang), ay = -Math.cos(ang), px = Math.cos(ang), py = Math.sin(ang);
        const at = (v, u) => ({ x: cx + t * 14 + px * v + ax * u, y: bottom - 3 + py * v + ay * u });
        g.fillStyle(0x8a3ffc, 1);
        g.fillPoints([at(-Wd / 2, 0), at(-Wd / 2, 0.72 * L), at(0, L), at(Wd / 2, 0.72 * L), at(Wd / 2, 0)], true);
        g.fillStyle(0xc39bff, 1);
        g.fillPoints([at(0, 0), at(0, L), at(Wd / 2, 0.72 * L), at(Wd / 2, 0)], true);
      });
    });
    g.fillStyle(0xffffff, 0.8);
    for (let i = 0; i < 10; i++) g.fillCircle(x + 14 + rand() * (w - 28), y + 22 + rand() * (h - 40), 1.2);
  }

  if (theme === "sunset") {
    g.fillStyle(0xfff1a8, 0.5); clippedCircle(g, x + w * 0.62, bottom - 8, 38, bottom);
    g.fillStyle(0xfff6c8, 1);   clippedCircle(g, x + w * 0.62, bottom - 8, 26, bottom);
    g.fillStyle(0xffffff, 0.55);
    g.fillEllipse(x + 50, y + 26, 46, 12); g.fillEllipse(x + 190, y + 40, 40, 10);
    // floating islands
    [[x + 22, y + 52, 46], [x + 96, y + 34, 40], [x + 160, y + 60, 52]].forEach(([ix, iy, iw]) => {
      g.fillStyle(0xcc4400, 1); g.fillTriangle(ix + 4, iy + 6, ix + iw - 4, iy + 6, ix + iw / 2, iy + 20);
      g.fillStyle(0xddaa00, 1); g.fillRect(ix, iy, iw, 7);
    });
    g.fillStyle(0xffdd00, 1); g.fillCircle(x + 116, y + 24, 4.5);
  }

  if (theme === "ice") {
    g.fillStyle(0xbfefff, 0.85);
    for (let px = x + 20; px < x + w - 20; px += 12 + rand() * 12) g.fillTriangle(px - 4, y, px + 4, y, px, y + 8 + rand() * 18);
    spikes(g, x, w, bottom, { minH: 26, maxH: 52, minW: 26, maxW: 44 }, 0x2a6db5, rand, 0.9);
    spikes(g, x, w, bottom, { minH: 14, maxH: 30, minW: 18, maxW: 30 }, 0x9fdcff, rand);
    g.fillStyle(0xffffff, 0.9);
    for (let i = 0; i < 16; i++) g.fillCircle(x + 10 + rand() * (w - 20), y + 16 + rand() * (h - 30), 0.8 + rand() * 1.2);
  }

  if (theme === "sea") {
    g.fillStyle(0xd8f6ff, 0.12);
    [x + 40, x + 110, x + 180].forEach(rx => g.fillTriangle(rx - 8, y, rx + 8, y, rx + 34, bottom));
    g.lineStyle(3, 0x2e8b57, 1);
    [x + 22, x + 34, x + 200, x + 214].forEach(sx => {
      g.beginPath(); g.moveTo(sx, bottom);
      for (let s = 1; s <= 5; s++) g.lineTo(sx + Math.sin(s * 1.3) * 4, bottom - s * 8);
      g.strokePath();
    });
    hills(g, x, w, bottom, bottom - 8, 3, 20, 0, 0x9c8457);
    [[x + 80, y + 46, 0xff7f50], [x + 150, y + 64, 0xffd23f]].forEach(([fx, fy, c]) => {
      g.fillStyle(c, 1); g.fillEllipse(fx, fy, 20, 12); g.fillTriangle(fx - 8, fy, fx - 16, fy - 6, fx - 16, fy + 6);
      g.fillStyle(0xffffff, 1); g.fillCircle(fx + 5, fy - 1, 2.4);
      g.fillStyle(0x000000, 1); g.fillCircle(fx + 5.6, fy - 1, 1.2);
    });
    g.lineStyle(1.2, 0xe6fbff, 0.8);
    for (let i = 0; i < 7; i++) g.strokeCircle(x + 110 + rand() * 60, y + 20 + rand() * 50, 1.5 + rand() * 2.5);
  }

  if (theme === "forest") {
    g.fillStyle(0xffffff, 0.8);
    for (let i = 0; i < 14; i++) g.fillCircle(x + 12 + rand() * (w - 24), y + 14 + rand() * 34, 0.7 + rand() * 0.6);
    g.fillStyle(0xcfd8ff, 0.25); g.fillCircle(x + w - 46, y + 30, 18);
    g.fillStyle(0xf3f1dc, 1);    g.fillCircle(x + w - 46, y + 30, 11);
    // fog drifting along the top
    g.fillGradientStyle(0x9aa6c4, 0x9aa6c4, 0x9aa6c4, 0x9aa6c4, 0.3, 0.3, 0, 0);
    g.fillRect(x, y + r, w, 30);
    spikes(g, x, w, bottom, { minH: 36, maxH: 62, minW: 18, maxW: 30 }, 0x1f2c4a, rand);
    spikes(g, x, w, bottom, { minH: 22, maxH: 44, minW: 16, maxW: 26 }, 0x060a13, rand);
    g.fillStyle(0xffd23f, 1); g.fillCircle(x + 62, bottom - 40, 1.8); g.fillCircle(x + 69, bottom - 40, 1.8);
    g.fillStyle(0xd8ff6a, 0.8); g.fillCircle(x + 140, bottom - 22, 1.6); g.fillCircle(x + 176, bottom - 34, 1.4);
  }

  if (theme === "volcano") {
    // a smoking volcano with lava running down it, a fall of magma, and a lava pool between dark rocks
    const vx = x + w * 0.6, vTop = y + 26;
    g.fillStyle(0x3a2a28, 0.6); g.fillCircle(vx + 6, y + 18, 9); g.fillCircle(vx + 16, y + 10, 7);
    g.fillStyle(0x2a0d0a, 1);
    g.fillPoints([{ x: vx - 62, y: bottom }, { x: vx - 12, y: vTop }, { x: vx + 12, y: vTop }, { x: vx + 62, y: bottom }], true);
    g.fillStyle(0xff6a1a, 1); g.fillEllipse(vx, vTop + 1, 22, 5);
    g.lineStyle(3, 0xff4a0a, 1); g.lineBetween(vx - 4, vTop + 2, vx - 22, bottom - 10);
    g.lineStyle(1.2, 0xffc23a, 1); g.lineBetween(vx - 4, vTop + 2, vx - 22, bottom - 10);
    g.fillStyle(0x140605, 1); g.fillRect(x + 22, y + 34, 34, h - 34);           // cliff with a magma fall
    g.fillStyle(0xff4a0a, 1); g.fillRect(x + 36, y + 36, 7, h - 36);
    g.fillStyle(0xffd060, 1); g.fillRect(x + 38.5, y + 36, 2, h - 36);
    g.fillStyle(0xff4a0a, 1); g.fillRect(x + 70, bottom - 9, 60, 9);             // lava pool
    g.fillStyle(0xffc23a, 1); g.fillRect(x + 70, bottom - 9, 60, 2);
    g.fillStyle(0x1c1512, 1); g.fillRect(x, bottom - 12, 70, 12); g.fillRect(x + 130, bottom - 12, w - 130, 12);
    g.fillStyle(0xffd060, 0.9);
    for (let i = 0; i < 10; i++) g.fillCircle(x + 10 + rand() * (w - 20), y + 14 + rand() * (h - 30), 0.9 + rand() * 0.8);
  }

  if (theme === "swamp") {
    // a factory leaking smoke, dead trees with moss, toxic water, a barrel and glowing spores
    g.fillStyle(0xe0f08a, 0.5); g.fillCircle(x + 46, y + 26, 11);
    g.fillStyle(0x1a2412, 1);
    g.fillRect(x + w - 80, bottom - 40, 56, 30); g.fillRect(x + w - 66, bottom - 66, 7, 30); g.fillRect(x + w - 46, bottom - 58, 7, 22);
    g.fillStyle(0x5a6a2a, 0.6); g.fillCircle(x + w - 60, y + 18, 8); g.fillCircle(x + w - 50, y + 12, 6);
    g.fillStyle(0xb4ff2a, 0.8); g.fillRect(x + w - 72, bottom - 30, 4, 4); g.fillRect(x + w - 58, bottom - 30, 4, 4);
    g.lineStyle(3, 0x141c0e, 1);
    [[x + 30, 58], [x + 92, 46]].forEach(([tx, th]) => {
      g.lineBetween(tx, bottom - 6, tx + 2, bottom - th);
      g.lineBetween(tx + 1, bottom - th * 0.6, tx - 12, bottom - th * 0.85);
      g.lineBetween(tx + 1, bottom - th * 0.75, tx + 13, bottom - th * 0.95);
    });
    g.lineStyle(1, 0x4a6a1e, 1);
    [x + 18, x + 21, x + 104, x + 107].forEach(mx => g.lineBetween(mx, bottom - 40, mx, bottom - 26));
    g.fillStyle(0x5a9a14, 1); g.fillRect(x, bottom - 9, w, 9);              // toxic water
    g.fillStyle(0xd8ff4a, 1); g.fillRect(x, bottom - 9, w, 2);
    g.fillStyle(0x3a2818, 1); g.fillRect(x + 50, bottom - 12, 70, 12);      // mud bank
    g.fillStyle(0x2f4a16, 1); g.fillRect(x + 50, bottom - 12, 70, 3);
    g.fillStyle(0x5a3a1e, 1); g.fillRoundedRect(x + 128, bottom - 24, 14, 16, 2);   // barrel
    g.fillStyle(0xa6e22e, 1); g.fillRect(x + 128, bottom - 19, 14, 4);
    g.fillStyle(0xd8ff6a, 0.9);
    for (let i = 0; i < 10; i++) g.fillCircle(x + 10 + rand() * (w - 20), y + 30 + rand() * (h - 44), 0.9 + rand() * 0.7);
  }
}
