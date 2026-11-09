import { levels } from "../data/levels.js";
import { THEMES } from "./LevelSelectScene.js";

// ⏳ The loading screen shown before a level starts. It lasts 5 seconds and then opens the level.
// It uses the level's own background colours and accent colour, so each level's loader matches it.
const LOADING_MS = 5000;
const TITLE_FONT = "Georgia, 'Times New Roman', serif";

export default class LoadingScene extends Phaser.Scene {
  constructor() {
    super("LoadingScene");
  }

  // data.progress is only set when the screen is redrawn after a resize (0..1, how far it had got)
  create(data = {}) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const cx = W / 2;
    const cy = H / 2;

    // Which level is about to start (the same value GameScene will read)
    const index = this.registry.get("currentLevel") || 0;
    const level = levels[index];
    const accent = (THEMES[level.theme] || THEMES.grass).accent;

    if (data.progress === undefined) this.cameras.main.fadeIn(300, 0, 0, 0);

    // Background: the level's four sky colours, top to bottom
    const [c1, c2, c3, c4] = level.background;
    const sky = this.add.graphics();
    [[c1, c2, 0, 0.4], [c2, c3, 0.4, 0.75], [c3, c4, 0.75, 1]].forEach(([top, bottom, from, to]) => {
      sky.fillGradientStyle(top, top, bottom, bottom, 1);
      sky.fillRect(0, H * from, W, H * (to - from) + 1);
    });

    // A few soft dots drifting across the screen: snow falls, sand blows sideways, everything else rises
    if (!this.textures.exists("loader_dot")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture("loader_dot", 8, 8);
      g.destroy();
    }
    const drift = { ice: [0, 40], desert: [120, 0] }[level.theme] || [0, -40];
    this.add.particles(0, 0, "loader_dot", {
      x: { min: 0, max: W }, y: { min: 0, max: H },
      lifespan: 3500, speedX: drift[0], speedY: drift[1],
      scale: { min: 0.2, max: 0.6 }, alpha: { start: 0.6, end: 0 },
      frequency: 90, advance: 3000
    });

    // Level number and name
    this.add.text(cx, cy - 74, `LEVEL ${index + 1}`, {
      fontSize: "18px", fontStyle: "bold", color: "#ffffff", stroke: "#000000", strokeThickness: 4
    }).setOrigin(0.5).setLetterSpacing(4);
    this.add.text(cx, cy - 30, level.name, {
      fontFamily: TITLE_FONT, fontSize: "48px", fontStyle: "bold",
      color: "#ffffff", stroke: "#000000", strokeThickness: 7
    }).setOrigin(0.5);

    // Progress bar: a dark track, and a fill in the level's accent colour
    const barW = Math.min(360, W - 80), barH = 16, barX = cx - barW / 2, barY = cy + 34;
    const track = this.add.graphics();
    track.fillStyle(0x000000, 0.55);
    track.fillRoundedRect(barX, barY, barW, barH, barH / 2);
    track.lineStyle(2, 0xffffff, 0.5);
    track.strokeRoundedRect(barX, barY, barW, barH, barH / 2);
    const fill = this.add.graphics();
    const label = this.add.text(cx, barY + 36, "", {
      fontSize: "16px", color: "#ffffff", stroke: "#000000", strokeThickness: 3
    }).setOrigin(0.5);

    // The level's own message (the loadingText line in src/data/levels.js)
    if (level.loadingText) {
      this.add.text(cx, barY + 72, level.loadingText, {
        fontSize: "20px", fontStyle: "bold", color: "#ffffff", stroke: "#000000", strokeThickness: 4,
        align: "center", wordWrap: { width: W - 60 }
      }).setOrigin(0.5);
    }

    const loading = { progress: data.progress || 0 };
    const draw = () => {
      fill.clear();
      fill.fillStyle(accent, 1);
      fill.fillRoundedRect(barX + 2, barY + 2, Math.max(12, (barW - 4) * loading.progress), barH - 4, (barH - 4) / 2);
      label.setText(`Loading...  ${Math.round(loading.progress * 100)}%`);
    };
    draw();

    // The 5-second timer: move progress from where it is to 100%, then open the level
    let leaving = false;
    this.tweens.add({
      targets: loading,
      progress: 1,
      duration: LOADING_MS * (1 - loading.progress),
      onUpdate: draw,
      onComplete: () => {
        leaving = true;
        this.scene.start("GameScene");
      }
    });

    // When the screen changes size, draw it again to fit and carry on from the same point
    let redrawing = false;
    const onResize = () => {
      if (redrawing || leaving) return;
      redrawing = true;
      this.time.delayedCall(120, () => {
        if (!leaving) this.scene.restart({ progress: loading.progress });
      });
    };
    this.scale.on("resize", onResize);
    this.events.once("shutdown", () => this.scale.off("resize", onResize));
  }
}
