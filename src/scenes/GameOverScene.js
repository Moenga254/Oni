import { levels } from "../data/levels.js";
import { calculateStars, starRequirements, saveBestStars } from "../data/Stars.js";
import { drawStarRow } from "../utils/Starrow.js";

export default class GameOverScene extends Phaser.Scene {
constructor() {
super("GameOverScene");
}

init(data) {
    this.won        = data.won;
    this.won = data.won;
this.finalScore = data.score;
    this.timeLeft   = data.timeLeft  ?? 0;
    this.timeBonus  = data.timeBonus ?? 0;
    this.currentLevel = data.currentLevel || 0;
    this.cause = data.cause;   // "time" | "fall" | "enemy"

    // For the star rating (sent by GameScene when you reach the flag)
    const level = levels[this.currentLevel];
    this.coins      = data.coins      ?? 0;
    this.totalCoins = data.totalCoins ?? level.coins.length;
    this.lives      = data.lives      ?? 1;
    this.timeLimit  = data.timeLimit  ?? level.timeLimit;
}

create() {
    // 🏆 Load & compare high score
    const prevHigh   = parseInt(localStorage.getItem("coinCollectorHighScore") || "0", 10);
    const isNewHigh  = this.finalScore > prevHigh;
    this.isNewHigh   = isNewHigh;   // showWinScreen() needs this too
    if (isNewHigh) {
      localStorage.setItem("coinCollectorHighScore", String(this.finalScore));
    }
    const displayHigh = isNewHigh ? this.finalScore : prevHigh;
    const W = 800;
    const H = 450;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.85);
    bg.fillRect(0, 0, W, H);

    // Each screen draws its own title, so nothing is drawn twice here.
    if (this.won) {
      this.showWinScreen();
    } else {
      this.showLoseScreen();
    }
  }

showWinScreen() {
  const W = 800;
  const isNewHigh = this.isNewHigh;
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

  // ⭐ Star rating (same rules on every difficulty); keep the best one for Level Select
  const stats = {
    timeLeft: this.timeLeft, timeLimit: this.timeLimit,
    coins: this.coins, totalCoins: this.totalCoins, lives: this.lives
  };
  const stars = calculateStars(stats);
  saveBestStars(currentLevel, stars);

  // Title
  this.add.text(W / 2, 52, isLastLevel ? "YOU BEAT THE GAME! 🏆" : "LEVEL COMPLETE!", {
    fontSize: "40px",
    color: "#ffdd00",
    fontStyle: "bold",
    stroke: "#000000",
    strokeThickness: 5
  }).setOrigin(0.5);

  // Level name
  this.add.text(W / 2, 100, levels[currentLevel].name + " cleared!", {
    fontSize: "22px",
    color: "#ffffff"
  }).setOrigin(0.5);

  // The stars
  drawStarRow(this, W / 2, 148, stars, { radius: 24, animate: true });

  // What the stars were based on
  this.add.text(W / 2, 190, `Coins ${this.coins}/${this.totalCoins}     Time left ${this.timeLeft}s     Lives ${this.lives}`, {
    fontSize: "16px",
    color: "#dddddd"
  }).setOrigin(0.5);

  // How to earn the next star
  let hint = "Perfect! You earned every star.";
  if (stars < 3) {
    const next = stars + 1;
    const need = starRequirements(this.timeLimit, this.totalCoins)[next];
    hint = `For ${next} star${next > 1 ? "s" : ""}: finish with ${need.timeLeft}s+ left, ${need.coins}+ coins, ${need.lives}+ lives`;
  }
  this.add.text(W / 2, 212, hint, {
    fontSize: "14px",
    color: "#ffdd88"
  }).setOrigin(0.5);

  // Score
  this.add.text(W / 2, 240, "Score: " + this.finalScore, {
    fontSize: "28px",
    color: "#88ff88",
    fontStyle: "bold"
  }).setOrigin(0.5);

  // High score: a new record replaces the "Best" line (when it is a record, "Best" would just repeat the score)
  if (isNewHigh) {
    const newHighText = this.add.text(W / 2, 274, "🌟 NEW HIGH SCORE! 🌟", {
      fontSize: "24px",
      color: "#ffdd00",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.tweens.add({
      targets: newHighText,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 400,
      yoyo: true,
      repeat: -1
    });
  } else {
    const highScores2 = JSON.parse(localStorage.getItem("highScores") || "{}");
    this.add.text(W / 2, 274, "Best: " + (highScores2[currentLevel] || this.finalScore), {
      fontSize: "20px",
      color: "#aaaaaa"
    }).setOrigin(0.5);
  }

  let yPos = 320;

  if (!isLastLevel) {
    // Next level button
    const nextBtn = this.add.text(W / 2, yPos, "▶  Next Level", {
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

    yPos += 52;
  }

  // Level select button
  const selectBtn = this.add.text(W / 2, yPos, "☰  Level Select", {
    fontSize: "20px",
    color: "#ffffff",
    backgroundColor: "#444444",
    padding: { x: 16, y: 8 }
  }).setOrigin(0.5).setInteractive({ useHandCursor: true });

  selectBtn.on("pointerdown", () => this.scene.start("LevelSelectScene"));

  yPos += 44;

  // Menu button
  const menuBtn = this.add.text(W / 2, yPos, "⌂  Main Menu", {
    fontSize: "20px",
    color: "#aaaaaa",
    padding: { x: 16, y: 8 }
  }).setOrigin(0.5).setInteractive({ useHandCursor: true });

  menuBtn.on("pointerdown", () => this.scene.start("MenuScene"));
}

showLoseScreen() {
  const W = 800;

  this.add.text(W / 2, 90, "GAME OVER", {
    fontSize: "52px",
    color: "#ff4444",
    fontStyle: "bold",
    stroke: "#000000",
    strokeThickness: 5
  }).setOrigin(0.5);

  // Why did the run end?
  const cause = this.cause ?? (this.timeLeft <= 0 ? "time" : "fall");
  const reasons = {
    time:  "Time's up! ⏱",
    fall:  "You fell off the edge!",
    enemy: "A slime got you!"
  };
  this.add.text(W / 2, 145, reasons[cause] || reasons.fall, {
    fontSize: "24px",
    color: "#ffffff"
  }).setOrigin(0.5);

  this.add.text(W / 2, 195, "Score: " + this.finalScore, {
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
