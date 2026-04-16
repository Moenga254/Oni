import SoundManager from "../utils/SoundManager.js";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    // 🎮 Title
    this.add.text(400, 150, "COIN COLLECTOR", {
      fontSize: "48px",
      color: "#ffdd00",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(400, 220, "Collect all 10 coins to win!", {
      fontSize: "22px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(400, 258, "Don't fall off the edge or run out of time!", {
      fontSize: "18px",
      color: "#ff4444"
    }).setOrigin(0.5);

    // 🏆 Show high score
    const highScore = parseInt(localStorage.getItem("coinCollectorHighScore") || "0", 10);
    const highScoreColor = highScore > 0 ? "#ffdd00" : "#888888";
    const highScoreLabel = highScore > 0 ? `🏆 Best: ${highScore}` : "🏆 No high score yet";

    this.add.text(400, 310, highScoreLabel, {
      fontSize: "22px",
      color: highScoreColor,
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5);

    // Controls
    this.add.text(400, 375, "← → to move     ↑ to jump", {
      fontSize: "20px",
      color: "#aaaaaa"
    }).setOrigin(0.5);

    this.add.text(400, 405, "P or ESC to pause", {
      fontSize: "16px",
      color: "#888888"
    }).setOrigin(0.5);

    // 👇 Start prompt — works for keyboard and mobile tap
    const startText = this.add.text(400, 470, "Press SPACE or Tap to Start", {
      fontSize: "24px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    SoundManager.stopMusic();

    const startGame = () => this.scene.start("GameScene");

    this.input.keyboard.once("keydown-SPACE", startGame);
    this.input.once("pointerdown", startGame);
  }
}