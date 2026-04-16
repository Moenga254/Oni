import SoundManager from "../utils/SoundManager.js";
export default class PauseScene extends Phaser.Scene {
  constructor() {
    super("PauseScene");
  }

  create() {
    // 🌑 Dark overlay — covers the game behind it
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, 800, 600);

    // 📋 Pause panel
    const panel = this.add.graphics();
    panel.fillStyle(0x222222, 0.95);
    panel.fillRoundedRect(250, 150, 300, 280, 20);
    panel.lineStyle(3, 0xffffff, 0.3);
    panel.strokeRoundedRect(250, 150, 300, 280, 20);

    // ⏸ Title
    this.add.text(400, 195, "PAUSED", {
      fontSize: "42px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    // ▶️ Resume button
    const resumeBtn = this.createButton(400, 280, "▶  Resume", 0x44aa44);
    resumeBtn.on("pointerdown", () => {
      this.resumeGame();
    });

    // 🔁 Restart button
    const restartBtn = this.createButton(400, 340, "↺  Restart", 0x4488cc);
    restartBtn.on("pointerdown", () => {
      SoundManager_stop();
      this.scene.stop("PauseScene");
      this.scene.stop("GameScene");
      this.scene.start("GameScene");
    });

    // 🏠 Menu button
    const menuBtn = this.createButton(400, 400, "⌂  Main Menu", 0x888888);
    menuBtn.on("pointerdown", () => {
      SoundManager_stop();
      this.scene.stop("PauseScene");
      this.scene.stop("GameScene");
      this.scene.start("MenuScene");
    });

    // ⏸ ESC or P to resume
    this.input.keyboard.on("keydown-ESC", () => this.resumeGame());
    this.input.keyboard.on("keydown-P", () => this.resumeGame());
  }

  createButton(x, y, label, color) {
    const btn = this.add.graphics();
    btn.fillStyle(color, 1);
    btn.fillRoundedRect(-110, -22, 220, 44, 10);

    const text = this.add.text(x, y, label, {
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    // Make interactive container
    const zone = this.add.zone(x, y, 220, 44).setInteractive();

    // Hover effects
    zone.on("pointerover", () => {
      btn.clear();
      btn.fillStyle(color + 0x222222, 1);
      btn.fillRoundedRect(x - 110, y - 22, 220, 44, 10);
      text.setScale(1.05);
    });

    zone.on("pointerout", () => {
      btn.clear();
      btn.fillStyle(color, 1);
      btn.fillRoundedRect(x - 110, y - 22, 220, 44, 10);
      text.setScale(1);
    });

    // Draw initial button at correct position
    btn.fillStyle(color, 1);
    btn.fillRoundedRect(x - 110, y - 22, 220, 44, 10);

    return zone;
  }

  resumeGame() {
    this.scene.resume("GameScene");
    this.scene.stop("PauseScene");
    SoundManager.startMusic();     // 👈 restart music when resuming
  }
}

// Helper to stop music without importing SoundManager
function SoundManager_stop() {
  // Access the interval directly
  const ctx = Phaser.Sound && Phaser.Sound.context;
  clearInterval(window._musicInterval);
}

export { SoundManager_stop };