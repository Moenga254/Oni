import Phaser from "phaser";
import MenuScene    from "./scenes/MenuScene.js";
import GameScene    from "./scenes/GameScene.js";
import GameOverScene from "./scenes/GameOverScene.js";
import PauseScene   from "./scenes/PauseScene.js";

const config = {
  type: Phaser.AUTO,

  backgroundColor: "#87ceeb",

  scale: {
    // EXPAND fills the full screen — no black bars on any screen size.
    // Scenes are designed at 800x450 but will see slightly more world on wider screens.
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: "game-container",
    width: 800,
    height: 450,
  },

  input: {
    activePointers: 4,   // up to 4 simultaneous touches (move + jump at the same time)
  },

  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },

  scene: [MenuScene, GameScene, GameOverScene, PauseScene],
};

const game = new Phaser.Game(config);

window.addEventListener("resize", () => {
  game.scale.refresh();
});

export default game;