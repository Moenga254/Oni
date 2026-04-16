export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  init(data) {
    this.won        = data.won;
    this.finalScore = data.score;
    this.timeLeft   = data.timeLeft  ?? 0;
    this.timeBonus  = data.timeBonus ?? 0;
  }

  create() {
    // 🏆 Load & compare high score
    const prevHigh   = parseInt(localStorage.getItem("coinCollectorHighScore") || "0", 10);
    const isNewHigh  = this.finalScore > prevHigh;
    if (isNewHigh) {
      localStorage.setItem("coinCollectorHighScore", String(this.finalScore));
    }
    const displayHigh = isNewHigh ? this.finalScore : prevHigh;

    // --- Title ---
    if (this.won) {
      this.add.text(400, 140, "YOU WIN! 🏆", {
        fontSize: "52px",
        color: "#ffdd00",
        fontStyle: "bold"
      }).setOrigin(0.5);
    } else {
      this.add.text(400, 140, "GAME OVER", {
        fontSize: "52px",
        color: "#ff4444",
        fontStyle: "bold"
      }).setOrigin(0.5);

      const reason = this.timeLeft <= 0 ? "Time's up! ⏱" : "You fell off the edge!";
      this.add.text(400, 210, reason, {
        fontSize: "24px",
        color: "#ffffff"
      }).setOrigin(0.5);
    }

    // --- Score breakdown ---
    let yPos = this.won ? 220 : 270;

    if (this.won && this.timeBonus > 0) {
      const mins = Math.floor(this.timeLeft / 60);
      const secs = this.timeLeft % 60;
      const pad  = secs < 10 ? "0" : "";

      this.add.text(400, yPos, `Time Remaining: ${mins}:${pad}${secs}`, {
        fontSize: "20px",
        color: "#aaddff"
      }).setOrigin(0.5);
      yPos += 32;

      this.add.text(400, yPos, `⏱ Time Bonus: +${this.timeBonus}`, {
        fontSize: "20px",
        color: "#aaddff"
      }).setOrigin(0.5);
      yPos += 36;
    }

    this.add.text(400, yPos, "Final Score: " + this.finalScore, {
      fontSize: "28px",
      color: "#aaffaa"
    }).setOrigin(0.5);
    yPos += 40;

    // --- High score ---
    if (isNewHigh) {
      // Animated "New High Score!" banner
      const newHighText = this.add.text(400, yPos, "🌟 NEW HIGH SCORE! 🌟", {
        fontSize: "26px",
        color: "#ffdd00",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4
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
      this.add.text(400, yPos, `Best: ${displayHigh}`, {
        fontSize: "22px",
        color: "#ffdd00"
      }).setOrigin(0.5);
    }

    yPos += 50;

    // --- Restart prompt ---
    const restartText = this.add.text(400, yPos + 20, "Press SPACE to Play Again", {
      fontSize: "22px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.tweens.add({
      targets: restartText,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    this.input.keyboard.once("keydown-SPACE", () => {
      this.scene.start("MenuScene");
    });

    // Also tap anywhere on mobile to restart
    this.input.once("pointerdown", () => {
      this.scene.start("MenuScene");
    });
  }
}