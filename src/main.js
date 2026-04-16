import Phaser from "phaser";
import MenuScene    from "./scenes/MenuScene.js";
import GameScene    from "./scenes/GameScene.js";
import GameOverScene from "./scenes/GameOverScene.js";
import PauseScene   from "./scenes/PauseScene.js";

const config = {
  type: Phaser.AUTO,

  // Base design resolution — all your scene coordinates are written for this
  width: 800,
  height: 600,

  backgroundColor: "#87ceeb",

  scale: {
    mode: Phaser.Scale.FIT,          // shrink/grow to fit the window, keep aspect ratio
    autoCenter: Phaser.Scale.CENTER_BOTH, // centre the canvas horizontally + vertically
    parent: "game-container",        // <div id="game-container"> in your index.html
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

// Keep canvas crisp when the window is resized
window.addEventListener("resize", () => {
  game.scale.refresh();
});

export default game;