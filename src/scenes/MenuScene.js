import SoundManager from "../utils/SoundManager.js";
import { DIFFICULTIES, getDifficulty, saveDifficulty } from "../data/Difficulty.js";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const W = 800;

    // 🎮 Title
    this.add.text(400, 48, "COIN COLLECTOR", {
      fontSize: "48px",
      color: "#ffdd00",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(400, 92, "Collect all 10 coins to win!", {
      fontSize: "22px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(400, 118, "Don't fall off the edge or run out of time!", {
      fontSize: "18px",
      color: "#ff4444"
    }).setOrigin(0.5);

    // 🎚️ Difficulty: tap/click one, or press ← →. Your choice is remembered.
    this.add.text(400, 150, "DIFFICULTY   (tap one, or press ← →)", {
      fontSize: "16px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5);

    this._diffButtons = {};
    Object.keys(DIFFICULTIES).forEach((key, i) => {
      const btn = this.add.text(400 + (i - 1) * 165, 192, DIFFICULTIES[key].label, {
        fontSize: "24px",
        fontStyle: "bold",
        fixedWidth: 150,
        align: "center",
        padding: { y: 12 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on("pointerover", () => { if (this.difficulty !== key) btn.setStyle({ backgroundColor: "#3a3a66" }); });
      btn.on("pointerout",  () => { if (this.difficulty !== key) btn.setStyle({ backgroundColor: "#2a2a4a" }); });
      btn.on("pointerdown", () => this.setDifficulty(key));
      this._diffButtons[key] = btn;
    });

    this._diffBlurb = this.add.text(400, 238, "", {
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5);

    this.setDifficulty(getDifficulty(this.registry), false);   // show the remembered choice (default: Normal)

    // 🏆 Show high score
    const highScore = parseInt(localStorage.getItem("coinCollectorHighScore") || "0", 10);
    const highScoreColor = highScore > 0 ? "#ffdd00" : "#888888";
    const highScoreLabel = highScore > 0 ? `🏆 Best: ${highScore}` : "🏆 No high score yet";

    this.add.text(400, 272, highScoreLabel, {
      fontSize: "22px",
      color: highScoreColor,
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5);

    // ☰ Level Select
    const selectBtn = this.add.text(W / 2, 316, "☰  Level Select", {
      fontSize: "22px",
      color: "#ffffff",
      backgroundColor: "#333366",
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    selectBtn.on("pointerover", () => selectBtn.setStyle({ backgroundColor: "#4444aa" }));
    selectBtn.on("pointerout", () => selectBtn.setStyle({ backgroundColor: "#333366" }));
    selectBtn.on("pointerdown", () => this.scene.start("LevelSelectScene"));

    // Controls
    this.add.text(400, 358, "← → to move     ↑ to jump", {
      fontSize: "20px",
      color: "#aaaaaa"
    }).setOrigin(0.5);

    this.add.text(400, 384, "P or ESC to pause", {
      fontSize: "16px",
      color: "#888888"
    }).setOrigin(0.5);

    // 👇 Start prompt: works for keyboard and mobile tap
    const startText = this.add.text(400, 420, "Press SPACE or Tap to Start", {
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

    let started = false;
    const startGame = () => {
      if (started) return;
      started = true;
      this.scene.start("GameScene");
    };

    this.input.keyboard.once("keydown-SPACE", startGame);
    this.input.keyboard.on("keydown-LEFT",  () => this.changeDifficulty(-1));
    this.input.keyboard.on("keydown-RIGHT", () => this.changeDifficulty(1));

    // Tap anywhere to start, but a tap that lands on a button (a difficulty or Level Select)
    // is just that button, not "start".
    this.input.on("pointerdown", (pointer, objectsUnderPointer) => {
      if (objectsUnderPointer.length === 0) startGame();
    });
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

    Object.entries(this._diffButtons).forEach(([k, btn]) => {
      const selected = k === key;
      btn.setText((selected ? "✓ " : "") + DIFFICULTIES[k].label);
      btn.setStyle(selected
        ? { backgroundColor: DIFFICULTIES[k].color, color: "#ffffff" }
        : { backgroundColor: "#2a2a4a", color: "#9a9ab8" });
    });
    this._diffBlurb.setText(DIFFICULTIES[key].blurb);
  }
}
