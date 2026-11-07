import SoundManager from "../utils/SoundManager.js";
import { levels } from "../data/levels.js";
import { DIFFICULTIES } from "../data/Difficulty.js";
import { makeButton } from "../utils/Button.js";

// ⏸ The pause screen: drawn on top of the frozen level, with how the run is going and what to do next.
// Laid out for 800x450 and centred on wider or taller screens.
const TITLE_FONT = "Georgia, 'Times New Roman', serif";

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super("PauseScene");
  }

  create(data = {}) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const cx = W / 2;
    const top = Math.max(0, (H - 450) / 2);
    const game = this.scene.get("GameScene");
    const level = levels[game.currentLevel] || levels[0];
    const diff = DIFFICULTIES[game.difficultyKey] || DIFFICULTIES.normal;

    // 🌑 Dim the level behind, with a soft purple tint like the menus
    const overlay = this.add.graphics();
    overlay.fillStyle(0x0b0614, 0.68);
    overlay.fillRect(0, 0, W, H);
    if (!data.resized) {
      overlay.setAlpha(0);
      this.tweens.add({ targets: overlay, alpha: 1, duration: 160 });
    }

    // 📋 Everything on the panel lives in one container, so it can pop in together
    const panel = this.add.container(cx, top + 225);
    const add = (obj) => { panel.add(obj); return obj; };

    const bg = add(this.add.graphics());
    bg.fillStyle(0x000000, 0.35);
    bg.fillRoundedRect(-200 + 4, -170 + 6, 400, 340, 20);
    bg.fillStyle(0x140a26, 0.92);
    bg.fillRoundedRect(-200, -170, 400, 340, 20);
    bg.lineStyle(2, 0xffd23f, 0.45);
    bg.strokeRoundedRect(-200, -170, 400, 340, 20);
    bg.lineStyle(1, 0xffffff, 0.08);
    bg.strokeRoundedRect(-194, -164, 388, 328, 15);

    // Title: two pause bars and "PAUSED" in the gold lettering
    const bars = add(this.add.graphics());
    bars.fillStyle(0xffd23f, 1);
    bars.fillRoundedRect(-128, -143, 9, 30, 3);
    bars.fillRoundedRect(-114, -143, 9, 30, 3);
    const title = add(this.add.text(20, -128, "PAUSED", {
      fontFamily: TITLE_FONT, fontSize: "40px", fontStyle: "bold",
      color: "#ffd23f", stroke: "#2a0a10", strokeThickness: 6, padding: { x: 20, y: 16 }
    }).setOrigin(0.5).setLetterSpacing(4));
    const gold = title.context.createLinearGradient(0, 0, 0, title.height);
    gold.addColorStop(0.3, "#fff3b0");
    gold.addColorStop(0.6, "#ffc93c");
    gold.addColorStop(0.85, "#ff8a2a");
    title.setFill(gold);
    title.setShadow(0, 0, "#ff9a3c", 14, true, false);

    // Level name and difficulty
    const name = add(this.add.text(0, -88, `Level ${game.currentLevel + 1}  ·  ${level.name}  ·  `, {
      fontSize: "14px", color: "#d9cdf0"
    }).setOrigin(0, 0.5));
    const mode = add(this.add.text(0, -88, diff.label, { fontSize: "14px", fontStyle: "bold", color: diff.color }).setOrigin(0, 0.5));
    const lineW = name.width + mode.width;
    name.setX(-lineW / 2);
    mode.setX(-lineW / 2 + name.width);

    // How the run is going
    const coins = (game.totalCoins ?? 0) - (game.coins ? game.coins.countActive() : 0);
    const mins = Math.floor(Math.max(0, game.timeLeft) / 60);
    const secs = String(Math.max(0, game.timeLeft) % 60).padStart(2, "0");
    const stats = [
      ["🪙", `${coins}/${game.totalCoins}`],
      ["⏱", `${mins}:${secs}`],
      ["❤️", `${game.lives}`],
      ["⭐", `${game.score}`],
    ];
    stats.forEach(([icon, value], i) => {
      const x = (i - 1.5) * 88;
      const chip = add(this.add.graphics());
      chip.fillStyle(0xffffff, 0.07);
      chip.fillRoundedRect(x - 40, -70, 80, 30, 10);
      chip.lineStyle(1, 0xffffff, 0.12);
      chip.strokeRoundedRect(x - 40, -70, 80, 30, 10);
      add(this.add.text(x - 22, -55, icon, { fontSize: "14px" }).setOrigin(0.5));
      add(this.add.text(x - 8, -55, value, { fontSize: "14px", fontStyle: "bold", color: "#ffffff" }).setOrigin(0, 0.5));
    });

    // Hint at the bottom
    add(this.add.text(0, 150, "P or ESC to resume", { fontSize: "12px", color: "#8f86a8" }).setOrigin(0.5).setLetterSpacing(1));

    if (!data.resized) {
      panel.setScale(0.9).setAlpha(0);
      this.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 220, ease: "Back.Out" });
    }

    // ▶ Buttons (kept outside the panel container so their tap areas stay put while it pops in)
    const py = top + 225;
    const leave = (sceneKey) => {
      SoundManager.stopMusic();
      this.scene.stop("PauseScene");
      this.scene.stop("GameScene");
      this.scene.start(sceneKey);
    };
    makeButton(this, cx, py + 2, 260, 46, "▶  RESUME", 0x2e9a4a, () => this.resumeGame(), 21);
    makeButton(this, cx, py + 56, 260, 40, "↺  Restart level", 0x3a5ea8, () => leave("GameScene"), 17);
    makeButton(this, cx - 67, py + 106, 126, 38, "☰  Levels", 0x3a2e60, () => leave("LevelSelectScene"), 16);
    makeButton(this, cx + 67, py + 106, 126, 38, "⌂  Menu", 0x3a2e60, () => leave("MenuScene"), 16);

    // ⏸ ESC or P to resume
    this.input.keyboard.on("keydown-ESC", () => this.resumeGame());
    this.input.keyboard.on("keydown-P", () => this.resumeGame());

    // When the screen changes size (window resized, phone rotated), draw it again to fit
    let redrawing = false;
    const onResize = () => {
      if (redrawing) return;
      redrawing = true;
      this.time.delayedCall(120, () => this.scene.restart({ resized: true }));
    };
    this.scale.on("resize", onResize);
    this.events.once("shutdown", () => this.scale.off("resize", onResize));
  }

  resumeGame() {
    this.scene.resume("GameScene");
    this.scene.stop("PauseScene");
    SoundManager.startMusic();     // 👈 restart music when resuming
  }
}
