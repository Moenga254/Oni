import { levels } from "../data/levels.js";

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

    // 🎮 Level cards
    const cardW = 200;
    const cardH = 220;
    const startX = W / 2 - ((levels.length - 1) * (cardW + 30)) / 2;

    levels.forEach((level, index) => {
      const x = startX + index * (cardW + 30);
      const y = H / 2 + 20;
      const unlocked = index <= unlockedLevel;

      this.createLevelCard(x, y, cardW, cardH, level, index, unlocked, highScores[index]);
    });

    // 💡 Hint text
    this.add.text(W / 2, H - 25, "Complete a level to unlock the next one", {
      fontSize: "16px",
      color: "#666666"
    }).setOrigin(0.5);
  }

  createLevelCard(x, y, w, h, level, index, unlocked, highScore) {
    const colors = [0x4a7c2f, 0x6644aa, 0xcc4400];
    const color = colors[index] || 0x444444;

    // Card background
    const card = this.add.graphics();

    if (unlocked) {
      card.fillStyle(color, 0.9);
    } else {
      card.fillStyle(0x333333, 0.9);
    }

    card.fillRoundedRect(x - w / 2, y - h / 2, w, h, 16);
    card.lineStyle(3, unlocked ? 0xffffff : 0x555555, 0.5);
    card.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 16);

    if (unlocked) {
      // Level number
      this.add.text(x, y - 70, index + 1 + "", {
        fontSize: "52px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 5
      }).setOrigin(0.5);

      // Level name
      this.add.text(x, y - 10, level.name, {
        fontSize: "18px",
        color: "#ffffff",
        fontStyle: "bold"
      }).setOrigin(0.5);

      // Time limit
      this.add.text(x, y + 20, "⏱ " + level.timeLimit + "s", {
        fontSize: "16px",
        color: "#ffdd00"
      }).setOrigin(0.5);

      // High score
      const scoreText = highScore ? "Best: " + highScore : "Not played";
      this.add.text(x, y + 50, scoreText, {
        fontSize: "15px",
        color: highScore ? "#88ff88" : "#888888"
      }).setOrigin(0.5);

      // Play button
      const playBtn = this.add.text(x, y + 85, "▶  PLAY", {
        fontSize: "18px",
        color: "#ffffff",
        fontStyle: "bold",
        backgroundColor: "#006600",
        padding: { x: 16, y: 8 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      playBtn.on("pointerover", () => playBtn.setStyle({ backgroundColor: "#008800" }));
      playBtn.on("pointerout", () => playBtn.setStyle({ backgroundColor: "#006600" }));
      playBtn.on("pointerdown", () => {
        this.registry.set("currentLevel", index);
        this.scene.start("GameScene");
      });

    } else {
      // Locked
      this.add.text(x, y - 20, "🔒", {
        fontSize: "52px"
      }).setOrigin(0.5);

      this.add.text(x, y + 40, "LOCKED", {
        fontSize: "20px",
        color: "#555555",
        fontStyle: "bold"
      }).setOrigin(0.5);

      this.add.text(x, y + 68, "Complete Level " + index, {
        fontSize: "14px",
        color: "#444444"
      }).setOrigin(0.5);
    }
  }
}