import Phaser from "phaser";
import MenuScene    from "./scenes/MenuScene.js";
import GameScene    from "./scenes/GameScene.js";
import GameOverScene from "./scenes/GameOverScene.js";
import PauseScene   from "./scenes/PauseScene.js";

const config = {
  type: Phaser.AUTO,

  // 16:9 landscape — matches phone held sideways
  width: 800,
  height: 450,

  backgroundColor: "#87ceeb",

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: "game-container",
  },

  input: {
    activePointers: 4,   // allow up to 4 simultaneous touches (move + jump)
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