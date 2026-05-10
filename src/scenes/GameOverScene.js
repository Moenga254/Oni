import { levels } from "../data/levels.js";

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  init(data) {
    this.won = data.won;
    this.finalScore = data.score;
    this.currentLevel = data.currentLevel || 0;
  }

  create() {
    const W = 800;
    const H = 450;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.85);
    bg.fillRect(0, 0, W, H);

    if (this.won) {
      this.showWinScreen();
    } else {
      this.showLoseScreen();
    }
  }

  showWinScreen() {
    const W = 800;
    const currentLevel = this.currentLevel;
    const nextLevel = currentLevel + 1;
    const isLastLevel = nextLevel >= levels.length;

    // Save high score
    const highScores = JSON.parse(localStorage.getItem("highScores") || "{}");
    if (!highScores[currentLevel] || this.finalScore > highScores[currentLevel]) {
      highScores[currentLevel] = this.finalScore;
      localStorage.setItem("highScores", JSON.stringify(highScores));
    }

    // Unlock next level
    const unlockedLevel = parseInt(localStorage.getItem("unlockedLevel") || "0");
    if (nextLevel > unlockedLevel && !isLastLevel) {
      localStorage.setItem("unlockedLevel", nextLevel.toString());
    }

    // Title
    this.add.text(W / 2, 80, isLastLevel ? "YOU BEAT THE GAME! 🏆" : "LEVEL COMPLETE! 🎉", {
      fontSize: "40px",
      color: "#ffdd00",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5
    }).setOrigin(0.5);

    // Level name
    this.add.text(W / 2, 135, levels[currentLevel].name + " cleared!", {
      fontSize: "22px",
      color: "#ffffff"
    }).setOrigin(0.5);

    // Score
    this.add.text(W / 2, 185, "Score: " + this.finalScore, {
      fontSize: "28px",
      color: "#88ff88",
      fontStyle: "bold"
    }).setOrigin(0.5);

    // High score
    const highScores2 = JSON.parse(localStorage.getItem("highScores") || "{}");
    this.add.text(W / 2, 220, "Best: " + (highScores2[currentLevel] || this.finalScore), {
      fontSize: "20px",
      color: "#aaaaaa"
    }).setOrigin(0.5);

    if (!isLastLevel) {
      // Next level button
      const nextBtn = this.add.text(W / 2, 300, "▶  Next Level", {
        fontSize: "26px",
        color: "#ffffff",
        fontStyle: "bold",
        backgroundColor: "#006600",
        padding: { x: 20, y: 10 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      nextBtn.on("pointerover", () => nextBtn.setStyle({ backgroundColor: "#008800" }));
      nextBtn.on("pointerout", () => nextBtn.setStyle({ backgroundColor: "#006600" }));
      nextBtn.on("pointerdown", () => {
        this.registry.set("currentLevel", nextLevel);
        this.scene.start("GameScene");
      });
    }

    // Level select button
    const selectBtn = this.add.text(W / 2, isLastLevel ? 300 : 360, "☰  Level Select", {
      fontSize: "20px",
      color: "#ffffff",
      backgroundColor: "#444444",
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    selectBtn.on("pointerdown", () => this.scene.start("LevelSelectScene"));

    // Menu button
    const menuBtn = this.add.text(W / 2, isLastLevel ? 360 : 410, "⌂  Main Menu", {
      fontSize: "20px",
      color: "#aaaaaa",
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on("pointerdown", () => this.scene.start("MenuScene"));
  }

  showLoseScreen() {
    const W = 800;

    this.add.text(W / 2, 100, "GAME OVER", {
      fontSize: "52px",
      color: "#ff4444",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5
    }).setOrigin(0.5);

    this.add.text(W / 2, 170, "Score: " + this.finalScore, {
      fontSize: "28px",
      color: "#ffffff"
    }).setOrigin(0.5);

    // Retry button
    const retryBtn = this.add.text(W / 2, 260, "↺  Try Again", {
      fontSize: "26px",
      color: "#ffffff",
      fontStyle: "bold",
      backgroundColor: "#884400",
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryBtn.on("pointerover", () => retryBtn.setStyle({ backgroundColor: "#aa6600" }));
    retryBtn.on("pointerout", () => retryBtn.setStyle({ backgroundColor: "#884400" }));
    retryBtn.on("pointerdown", () => {
      this.registry.set("currentLevel", this.currentLevel);
      this.scene.start("GameScene");
    });

    // Level select
    const selectBtn = this.add.text(W / 2, 330, "☰  Level Select", {
      fontSize: "20px",
      color: "#ffffff",
      backgroundColor: "#444444",
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    selectBtn.on("pointerdown", () => this.scene.start("LevelSelectScene"));

    // Menu
    const menuBtn = this.add.text(W / 2, 390, "⌂  Main Menu", {
      fontSize: "20px",
      color: "#aaaaaa"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on("pointerdown", () => this.scene.start("MenuScene"));
  }
}