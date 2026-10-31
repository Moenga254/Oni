import { levels } from "../data/levels.js";
import { loadStars } from "../data/Stars.js";
import { drawStarRow } from "../utils/Starrow.js";

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
    this.add.text(W / 2, 50, "SELECT LEVEL", {
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

    // Get saved progress
    const unlockedLevel = parseInt(localStorage.getItem("unlockedLevel") || "0");
    const highScores = JSON.parse(localStorage.getItem("highScores") || "{}");
    const bestStars = loadStars();   // best star rating per level

    // 🎮 Level cards
    const cardW = 200;
    const cardH = 250;
    const startX = W / 2 - ((levels.length - 1) * (cardW + 30)) / 2;

    levels.forEach((level, index) => {
      const x = startX + index * (cardW + 30);
      const y = H / 2 + 20;
      const unlocked = index <= unlockedLevel;

      this.createLevelCard(x, y, cardW, cardH, level, index, unlocked, highScores[index], bestStars[index] || 0);
    });

    // ⭐ How stars work
    this.add.text(W / 2, 396, "Earn up to 3 stars: finish fast, collect coins, keep your lives", {
      fontSize: "14px",
      color: "#aaaaaa"
    }).setOrigin(0.5);

    // 💡 Hint text
    this.add.text(W / 2, H - 25, "Complete a level to unlock the next one", {
      fontSize: "16px",
      color: "#666666"
    }).setOrigin(0.5);
  }

  createLevelCard(x, y, w, h, level, index, unlocked, highScore, stars) {
  const colors = [0x4a7c2f, 0x6644aa, 0xcc4400, 0x167a9e];
  const color = colors[index] || 0x444444;

  const card = this.add.graphics();

  card.fillStyle(unlocked ? color : 0x333333, 0.9);
  card.fillRoundedRect(x - w / 2, y - h / 2, w, h, 16);

  card.lineStyle(2, unlocked ? 0xffffff : 0x555555, 0.5);
  card.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 16);

  if (unlocked) {
    this.add.text(x, y - 65, `LEVEL ${index + 1}`, {
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(x, y - 38, level.name, {
      fontSize: "17px",
      color: "#ffffff"
    }).setOrigin(0.5);

    // Separate stars for each difficulty
    const modes = [
      ["easy", "Easy", "#70e090"],
      ["normal", "Normal", "#75aaff"],
      ["hard", "Hard", "#ff7777"]
    ];

    modes.forEach(([key, label, textColor], i) => {
      const rowY = y - 5 + i * 24;
      const earned = stars[key]?.[index] || 0;

      this.add.text(x - 75, rowY, label, {
        fontSize: "14px",
        color: textColor
      }).setOrigin(0, 0.5);

      drawStarRow(this, x + 35, rowY, earned, {
        radius: 8,
        gap: 18
      });
    });

    this.add.text(x, y + 72, highScore ? `Best: ${highScore}` : "Not played", {
      fontSize: "14px",
      color: "#88ff88"
    }).setOrigin(0.5);

    const playBtn = this.add.text(x, y + 105, "▶ PLAY", {
      fontSize: "17px",
      color: "#ffffff",
      backgroundColor: "#006600",
      padding: { x: 14, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on("pointerdown", () => {
      this.registry.set("currentLevel", index);
      this.scene.start("GameScene");
    });

  } else {
    this.add.text(x, y - 15, "🔒 LOCKED", {
      fontSize: "25px",
      color: "#777777"
    }).setOrigin(0.5);

    this.add.text(x, y + 25, `Complete Level ${index}`, {
      fontSize: "14px",
      color: "#aaaaaa"
    }).setOrigin(0.5);
  }
}
}
