import { levels } from "../data/levels.js";
import { loadStars } from "../data/Stars.js";
import { drawStarRow } from "../utils/Starrow.js";

// 🧭 Layout: levels flow in rows of 3, going DOWN the screen.
// Two rows fit at once. With more levels the list scrolls: mouse wheel, drag/swipe, or the ↑ ↓ keys.
const COLUMNS = 3;
const CARD_W = 240;
const CARD_H = 166;
const GAP_X = 20;
const GAP_Y = 12;
const VIEW = { x: 0, y: 78, w: 800, h: 350 };   // the window the cards scroll inside (below the title)

export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super("LevelSelectScene");
  }

  create() {
    const W = 800;
    const H = 450;

    // 🎨 Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a3e, 0x1a1a3e, 0x0a0a2e, 0x0a0a2e, 1);
    bg.fillRect(0, 0, W, H);

    // ⭐ Title
    this.add.text(W / 2, 44, "SELECT LEVEL", {
      fontSize: "36px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5
    }).setOrigin(0.5);

    // 🔙 Back button
    const backBtn = this.add.text(30, 20, "← Back", {
      fontSize: "20px",
      color: "#aaaaaa",
      stroke: "#000000",
      strokeThickness: 3
    }).setInteractive({ useHandCursor: true });

    backBtn.on("pointerover", () => backBtn.setColor("#ffffff"));
    backBtn.on("pointerout", () => backBtn.setColor("#aaaaaa"));
    backBtn.on("pointerdown", () => this.scene.start("MenuScene"));

    // Saved progress
    const unlockedLevel = parseInt(localStorage.getItem("unlockedLevel") || "0");
    const highScores = JSON.parse(localStorage.getItem("highScores") || "{}");
    const allStars = loadStars();   // { easy: {level: stars}, normal: {...}, hard: {...} }

    // 🎮 Level cards, 3 per row, rows going down
    const rows = Math.ceil(levels.length / COLUMNS);
    const contentH = rows * CARD_H + (rows - 1) * GAP_Y + 6;
    this.maxScroll = Math.max(0, contentH - VIEW.h);

    const firstCard = this.children.list.length;
    levels.forEach((level, index) => {
      const col = index % COLUMNS;
      const row = Math.floor(index / COLUMNS);
      const x = W / 2 + (col - (COLUMNS - 1) / 2) * (CARD_W + GAP_X);
      const y = 3 + row * (CARD_H + GAP_Y) + CARD_H / 2;   // list coordinates: 0 = top of the window
      this.createLevelCard(x, y, level, index, index <= unlockedLevel, highScores[index], allStars);
    });
    const cardObjects = this.children.list.slice(firstCard);

    // 💡 Footer
    this.add.text(W / 2, H - 11, "Stars are kept for each difficulty  ·  Finish a level to unlock the next", {
      fontSize: "14px",
      color: "#8888aa"
    }).setOrigin(0.5);

    // 📜 The cards live in their own camera, so they are clipped to the window (and so are clicks)
    this.listCam = this.cameras.add(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
    this.listCam.setBounds(0, 0, W, Math.max(VIEW.h, contentH));
    this.cameras.main.ignore(cardObjects);

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

    this.listCam.ignore(this.children.list.filter(o => !cardObjects.includes(o)));

    this.scrollTo = (value) => {
      this.listCam.scrollY = Phaser.Math.Clamp(value, 0, this.maxScroll);
      drawScrollbar();
    };
    this.scrollTo(0);

    if (this.maxScroll > 0) {
      // mouse wheel
      this.input.on("wheel", (pointer, over, dx, dy) => this.scrollTo(this.listCam.scrollY + dy * 0.7));

      // drag / swipe (a drag never presses a PLAY button by accident)
      let dragStartY = null;
      let startScroll = 0;
      this.dragged = false;
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

  // One compact card: level, name, the best stars in each mode, best score, PLAY
  createLevelCard(x, y, level, index, unlocked, highScore, allStars) {
    const colors = [0x4a7c2f, 0x6644aa, 0xcc4400, 0x167a9e, 0x0b4f8a, 0x2c2a4a];
    const color = colors[index % colors.length];
    const left = x - CARD_W / 2;
    const top = y - CARD_H / 2;

    const card = this.add.graphics();
    card.fillStyle(unlocked ? color : 0x333333, 0.9);
    card.fillRoundedRect(left, top, CARD_W, CARD_H, 16);
    card.lineStyle(2, unlocked ? 0xffffff : 0x555555, 0.5);
    card.strokeRoundedRect(left, top, CARD_W, CARD_H, 16);

    if (!unlocked) {
      this.add.text(x, top + 62, "🔒", { fontSize: "30px" }).setOrigin(0.5);
      this.add.text(x, top + 100, "LOCKED", { fontSize: "16px", color: "#777777", fontStyle: "bold" }).setOrigin(0.5);
      this.add.text(x, top + 124, `Complete Level ${index}`, { fontSize: "13px", color: "#aaaaaa" }).setOrigin(0.5);
      return;
    }

    this.add.text(x, top + 14, `LEVEL ${index + 1}`, {
      fontSize: "13px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5).setAlpha(0.85);

    this.add.text(x, top + 36, level.name, {
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    // The best stars you have earned on this level in EACH mode
    const modes = [
      ["easy", "Easy", "#70e090"],
      ["normal", "Normal", "#9cc2ff"],
      ["hard", "Hard", "#ff8f8f"]
    ];
    modes.forEach(([key, label, textColor], i) => {
      const rowY = top + 66 + i * 22;
      const earned = allStars[key]?.[index] || 0;

      this.add.text(x - 78, rowY, label, { fontSize: "13px", color: textColor }).setOrigin(0, 0.5);
      drawStarRow(this, x + 42, rowY, earned, { radius: 8, gap: 18 });
    });

    this.add.text(left + 16, top + 144, highScore ? `Best: ${highScore}` : "Not played", {
      fontSize: "13px",
      color: "#88ff88"
    }).setOrigin(0, 0.5);

    const playBtn = this.add.text(left + CARD_W - 14, top + 144, "▶ PLAY", {
      fontSize: "15px",
      color: "#ffffff",
      backgroundColor: "#006600",
      padding: { x: 12, y: 5 }
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    playBtn.on("pointerover", () => playBtn.setStyle({ backgroundColor: "#008800" }));
    playBtn.on("pointerout", () => playBtn.setStyle({ backgroundColor: "#006600" }));
    playBtn.on("pointerup", () => {
      if (this.dragged) return;               // that was a scroll, not a tap
      this.registry.set("currentLevel", index);
      this.scene.start("GameScene");
    });
  }
}
