import SoundManager from "../utils/SoundManager.js";
import Particles from "../utils/Particles.js";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.spritesheet("player", "/assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48
    });
  }

  create() {

    // 🔊 Init sound
    SoundManager.init(this);
    SoundManager.stopMusic();
    SoundManager.startMusic();

    this.gameOver = false;
    this.gameWon = false;

    const WORLD_WIDTH = 3200;
    const WORLD_HEIGHT = 600;

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // 🎨 Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xffffff, 0xffffff, 1);
    bg.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    bg.setScrollFactor(0.1);

    // ☁️ Clouds
    const cloudGraphics = this.add.graphics();
    cloudGraphics.fillStyle(0xffffff, 0.9);
    const cloudPositions = [200, 500, 900, 1300, 1700, 2100, 2600, 3000];
    cloudPositions.forEach(x => {
      const y = Phaser.Math.Between(60, 180);
      cloudGraphics.fillEllipse(x, y, 120, 50);
      cloudGraphics.fillEllipse(x + 40, y - 20, 80, 40);
      cloudGraphics.fillEllipse(x - 30, y - 10, 70, 35);
    });
    cloudGraphics.setScrollFactor(0.2);

    // 🧱 Platform data [x, y, width, height, color]
    const platformData = [
      [0,    570, 600,  30, 0x4a7c2f],
      [700,  570, 400,  30, 0x4a7c2f],
      [1200, 570, 500,  30, 0x4a7c2f],
      [1800, 570, 300,  30, 0x4a7c2f],
      [2200, 570, 600,  30, 0x4a7c2f],
      [2900, 570, 400,  30, 0x4a7c2f],
      [300,  450, 150,  20, 0x8B4513],
      [550,  380, 150,  20, 0x8B4513],
      [800,  460, 120,  20, 0x8B4513],
      [1000, 380, 150,  20, 0x8B4513],
      [1250, 460, 120,  20, 0x8B4513],
      [1450, 350, 180,  20, 0x8B4513],
      [1650, 440, 120,  20, 0x8B4513],
      [1900, 350, 150,  20, 0x8B4513],
      [2100, 440, 120,  20, 0x8B4513],
      [2350, 380, 150,  20, 0x8B4513],
      [2550, 460, 120,  20, 0x8B4513],
      [2750, 350, 180,  20, 0x8B4513],
      [2950, 440, 150,  20, 0x8B4513],
    ];

    this.platforms = this.physics.add.staticGroup();
    this.platformData = platformData;

    platformData.forEach(([x, y, w, h, color]) => {
      const gfx = this.add.graphics();
      gfx.fillStyle(color);
      gfx.fillRect(0, 0, w, h);
      gfx.fillStyle(0xffffff, 0.2);
      gfx.fillRect(0, 0, w, 4);
      gfx.x = x;
      gfx.y = y;

      const platform = this.platforms.create(x + w / 2, y + h / 2, null);
      platform.setDisplaySize(w, h);
      platform.refreshBody();
      platform.setVisible(false);
    });

    // 🧍 Player
    this.player = this.physics.add.sprite(80, 490, "player");
    this.player.setCollideWorldBounds(false);
    this.player.setBounce(0);
    this.player.body.setGravityY(200);

    this.physics.add.collider(this.player, this.platforms);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // 🎮 Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasInAir = false;

    // 🎞️ Animations
    this.anims.create({
      key: "walk",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: "idle",
      frames: [{ key: "player", frame: 4 }],
      frameRate: 20
    });

    // 👾 Enemies
    this.enemies = [];

    const enemyData = [
      [200,  540, 50,   550,  80,  0xff4444],
      [750,  540, 710,  1080, 70,  0xff4444],
      [1300, 540, 1210, 1680, 90,  0xff6600],
      [1850, 540, 1810, 2180, 80,  0xff4444],
      [2300, 540, 2210, 2780, 100, 0xff6600],
      [2950, 540, 2910, 3180, 80,  0xff4444],
      [320,  420, 305,  445,  60,  0xaa00ff],
      [570,  350, 555,  695,  60,  0xaa00ff],
      [1020, 350, 1005, 1145, 60,  0xaa00ff],
      [1470, 320, 1455, 1625, 60,  0xaa00ff],
      [2370, 350, 2355, 2495, 60,  0xaa00ff],
    ];

    enemyData.forEach(([x, y, left, right, speed, color]) => {
      const gfx = this.add.graphics();
      this.drawEnemy(gfx, color);
      gfx.x = x;
      gfx.y = y - 16;

      const body = this.physics.add.image(x, y, null);
      body.setDisplaySize(28, 28);
      body.setVisible(false);
      body.setCollideWorldBounds(false);
      body.body.setGravityY(200);
      body.setImmovable(false);

      this.physics.add.collider(body, this.platforms);

      const enemy = { body, gfx, left, right, speed, color, direction: 1 };
      this.enemies.push(enemy);
    });

    this.physics.add.overlap(
      this.player,
      this.enemies.map(e => e.body),
      this.hitEnemy,
      null,
      this
    );

    // 🪙 Coins
    this.coins = this.physics.add.group();
    this.coinGraphics = [];
    this.totalCoins = 10;

    const coinPositions = [
      [300, 420], [560, 350], [810, 430], [1010, 350],
      [1260, 430], [1460, 320], [1660, 410], [1910, 320],
      [2360, 350], [2760, 320]
    ];

    coinPositions.forEach(([x, y]) => {
      let coin = this.coins.create(x, y, null);
      coin.setCircle(10);
      coin.setBounce(0.4);
      coin.setVisible(false);
      coin.setActive(true);

      let gfx = this.add.graphics();
      gfx.fillStyle(0xffdd00, 1);
      gfx.fillCircle(0, 0, 10);
      gfx.fillStyle(0xffffff, 0.5);
      gfx.fillCircle(-3, -3, 4);
      gfx.x = x;
      gfx.y = y;
      coin.gfx = gfx;

      this.coinGraphics.push({ coin, gfx });
    });

    this.physics.add.collider(this.coins, this.platforms);
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

    // 🚩 Finish flag
    this.flag = this.add.graphics();
    this.flag.fillStyle(0xff0000);
    this.flag.fillRect(0, 0, 6, 60);
    this.flag.fillStyle(0xff4444);
    this.flag.fillTriangle(6, 0, 6, 25, 36, 12);
    this.flag.x = 3100;
    this.flag.y = 510;

    this.flagZone = this.physics.add.staticImage(3103, 540, null);
    this.flagZone.setDisplaySize(40, 60);
    this.flagZone.refreshBody();
    this.flagZone.setVisible(false);

    this.physics.add.overlap(this.player, this.flagZone, this.reachFlag, null, this);

    // 📊 UI
    this.score = 0;

    this.scoreText = this.add.text(16, 16, "Score: 0", {
      fontSize: "24px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4
    }).setScrollFactor(0);

    this.coinCountText = this.add.text(16, 46, `Coins: 0 / ${this.totalCoins}`, {
      fontSize: "20px",
      color: "#ffdd00",
      stroke: "#000000",
      strokeThickness: 4
    }).setScrollFactor(0);

    // ❤️ Lives
    this.lives = 3;
    this.livesText = this.add.text(16, 72, "Lives: ❤️❤️❤️", {
      fontSize: "20px",
      color: "#ff4444",
      stroke: "#000000",
      strokeThickness: 4
    }).setScrollFactor(0);

    this.invincible = false;

    this.progressBar = this.add.graphics().setScrollFactor(0);
    this.updateProgressBar();

    // ⏸ Pause button
    const pauseBtn = this.add.text(780, 16, "⏸", {
      fontSize: "28px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4
    })
    .setOrigin(1, 0)
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });

    pauseBtn.on("pointerover", () => pauseBtn.setAlpha(0.7));
    pauseBtn.on("pointerout", () => pauseBtn.setAlpha(1));
    pauseBtn.on("pointerdown", () => this.pauseGame());

    this.input.keyboard.on("keydown-P", () => this.pauseGame());
    this.input.keyboard.on("keydown-ESC", () => this.pauseGame());

    // ⏱️ TIMER — 90 seconds countdown
    this.timeLeft = 90;
    this.timerText = this.add.text(400, 16, "⏱ 1:30", {
      fontSize: "24px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5, 0).setScrollFactor(0);

    this.time.addEvent({
      delay: 1000,
      callback: this.tickTimer,
      callbackScope: this,
      loop: true
    });

    // 📱 Mobile controls
    this.mobileLeft  = false;
    this.mobileRight = false;
    this.mobileJump  = false;
    this.createMobileControls();
  }

  // ⏱️ Timer tick
  tickTimer() {
    if (this.gameOver || this.gameWon) return;
    this.timeLeft--;

    const mins = Math.floor(this.timeLeft / 60);
    const secs = this.timeLeft % 60;
    const pad = secs < 10 ? "0" : "";
    this.timerText.setText(`⏱ ${mins}:${pad}${secs}`);

    // Turn red when under 10 seconds
    if (this.timeLeft <= 10) {
      this.timerText.setColor("#ff4444");
      // Shake the timer text for urgency
      this.tweens.add({
        targets: this.timerText,
        x: 403,
        duration: 50,
        yoyo: true,
        repeat: 2,
        onComplete: () => this.timerText.x = 400
      });
    }

    if (this.timeLeft <= 0) {
      this.triggerGameOver();
    }
  }

  // 📱 On-screen D-pad + jump button
  createMobileControls() {
    const camW = this.cameras.main.width;
    const camH = this.cameras.main.height;

    const btnAlpha = 0.55;
    const btnSize  = 56;
    const padX     = 80;   // left cluster center-x
    const padY     = camH - 70;
    const jumpX    = camW - 80;
    const jumpY    = camH - 70;

    // Helper: draw a rounded rect button
    const makeBtn = (x, y, label) => {
      const g = this.add.graphics().setScrollFactor(0).setDepth(10);
      g.fillStyle(0x000000, btnAlpha);
      g.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 12);
      g.lineStyle(2, 0xffffff, 0.6);
      g.strokeRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 12);
      g.x = x;
      g.y = y;

      const txt = this.add.text(x, y, label, {
        fontSize: "22px",
        color: "#ffffff"
      }).setOrigin(0.5).setScrollFactor(0).setDepth(11);

      // Hit area
      const zone = this.add.zone(x, y, btnSize, btnSize)
        .setScrollFactor(0)
        .setDepth(12)
        .setInteractive();

      return { g, txt, zone };
    };

    const leftBtn  = makeBtn(padX - 64, padY, "◀");
    const rightBtn = makeBtn(padX + 64, padY, "▶");  // separate ◀▶ buttons
    const jumpBtn  = makeBtn(jumpX, jumpY, "🅰");

    // Left
    leftBtn.zone.on("pointerdown",  () => { this.mobileLeft = true; });
    leftBtn.zone.on("pointerup",    () => { this.mobileLeft = false; });
    leftBtn.zone.on("pointerout",   () => { this.mobileLeft = false; });

    // Right
    rightBtn.zone.on("pointerdown", () => { this.mobileRight = true; });
    rightBtn.zone.on("pointerup",   () => { this.mobileRight = false; });
    rightBtn.zone.on("pointerout",  () => { this.mobileRight = false; });

    // Jump (fires once per tap, not held)
    jumpBtn.zone.on("pointerdown",  () => { this.mobileJump = true; });
    jumpBtn.zone.on("pointerup",    () => { this.mobileJump = false; });
    jumpBtn.zone.on("pointerout",   () => { this.mobileJump = false; });

    // Visual press feedback
    const pressAnim = (btn) => {
      btn.zone.on("pointerdown", () => btn.g.setAlpha(0.9));
      btn.zone.on("pointerup",   () => btn.g.setAlpha(1));
      btn.zone.on("pointerout",  () => btn.g.setAlpha(1));
    };
    pressAnim(leftBtn);
    pressAnim(rightBtn);
    pressAnim(jumpBtn);
  }

  // 🎨 Draw slime enemy shape
  drawEnemy(gfx, color) {
    gfx.clear();
    gfx.fillStyle(color, 1);
    gfx.fillEllipse(0, 0, 30, 22);
    gfx.fillStyle(color, 1);
    gfx.fillEllipse(-4, -10, 12, 14);
    gfx.fillEllipse(4, -10, 12, 14);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(-6, -2, 5);
    gfx.fillCircle(6, -2, 5);
    gfx.fillStyle(0x000000, 1);
    gfx.fillCircle(-5, -2, 3);
    gfx.fillCircle(7, -2, 3);
  }

  updateProgressBar() {
    this.progressBar.clear();
    this.progressBar.fillStyle(0x000000, 0.5);
    this.progressBar.fillRect(200, 20, 400, 12);
    const progress = this.player ? this.player.x / 3200 : 0;
    this.progressBar.fillStyle(0x00ff88, 1);
    this.progressBar.fillRect(200, 20, 400 * progress, 12);
    this.progressBar.lineStyle(2, 0xffffff, 1);
    this.progressBar.strokeRect(200, 20, 400, 12);
  }

  update() {
    if (this.gameOver || this.gameWon) return;

    if (this.player.y > 650) {
      this.loseLife();
      return;
    }

    // Movement — keyboard OR mobile buttons
    const goLeft  = this.cursors.left.isDown  || this.mobileLeft;
    const goRight = this.cursors.right.isDown || this.mobileRight;
    const jumpPressed = this.cursors.up.isDown || this.mobileJump;

    if (goLeft) {
      this.player.setVelocityX(-220);
      this.player.anims.play("walk", true);
      this.player.setFlipX(false);
    } else if (goRight) {
      this.player.setVelocityX(220);
      this.player.anims.play("walk", true);
      this.player.setFlipX(true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("idle", true);
    }

    // Jump — keyboard uses JustDown; mobile uses flag set on pointerdown
    const canJump = this.player.body.touching.down;
    if (canJump) {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
        this.player.setVelocityY(-420);
        SoundManager.play("jump");
      } else if (this.mobileJump && !this._mobileJumpUsed) {
        this.player.setVelocityY(-420);
        SoundManager.play("jump");
        this._mobileJumpUsed = true;
      }
    }

    // Reset mobile jump latch when button released
    if (!this.mobileJump) {
      this._mobileJumpUsed = false;
    }

    const onGround = this.player.body.touching.down;
    if (this.wasInAir && onGround) {
      Particles.landDust(this, this.player.x, this.player.y + 20);
    }
    this.wasInAir = !onGround;

    // 👾 Move enemies
    this.enemies.forEach(enemy => {
      if (!enemy.body.active) return;

      enemy.body.setVelocityX(enemy.speed * enemy.direction);

      if (enemy.body.x >= enemy.right) {
        enemy.direction = -1;
      } else if (enemy.body.x <= enemy.left) {
        enemy.direction = 1;
      }

      enemy.gfx.x = enemy.body.x;
      enemy.gfx.y = enemy.body.y - 16;
      enemy.gfx.setScale(enemy.direction, 1);
    });

    // 🔄 Sync coins
    this.coinGraphics.forEach(({ coin, gfx }) => {
      if (coin.active) {
        gfx.x = coin.x;
        gfx.y = coin.y;
      }
    });

    this.updateProgressBar();
  }

  hitEnemy(player, enemyBody) {
    if (this.invincible) return;
    this.loseLife();
  }

  loseLife() {
    if (this.invincible) return;
    SoundManager.play("hit");
    Particles.deathBurst(this, this.player.x, this.player.y);
    this.lives--;

    const hearts = "❤️".repeat(Math.max(0, this.lives));
    this.livesText.setText("Lives: " + hearts);

    if (this.lives <= 0) {
      this.triggerGameOver();
      return;
    }

    this.player.setPosition(80, 490);
    this.player.setVelocity(0, 0);

    this.invincible = true;

    this.tweens.add({
      targets: this.player,
      alpha: 0,
      duration: 150,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.player.setAlpha(1);
        this.invincible = false;
      }
    });
  }

  collectCoin(player, coin) {
    if (coin.gfx) coin.gfx.setVisible(false);
    coin.disableBody(true, true);
    SoundManager.play("coin");
    Particles.coinBurst(this, coin.x, coin.y);

    this.score += 10;
    this.scoreText.setText("Score: " + this.score);

    const collected = this.totalCoins - this.coins.countActive();
    this.coinCountText.setText(`Coins: ${collected} / ${this.totalCoins}`);
  }

  reachFlag() {
    if (this.gameWon) return;
    Particles.flagBurst(this, this.flag.x, this.flag.y);
    this.triggerWin();
  }

  pauseGame() {
    if (this.gameOver || this.gameWon) return;
    SoundManager.stopMusic();
    this.scene.pause("GameScene");
    this.scene.launch("PauseScene");
  }

  triggerGameOver() {
    this.gameOver = true;
    SoundManager.play("gameover");
    SoundManager.stopMusic();
    this.player.setVisible(false);
    this.player.setVelocityX(0);
    this.player.setVelocityY(0);
    this.scene.start("GameOverScene", {
      won: false,
      score: this.score,
      timeLeft: this.timeLeft
    });
  }

  triggerWin() {
    this.gameWon = true;
    SoundManager.play("win");
    SoundManager.stopMusic();
    Particles.winCelebration(this);

    // Bonus score for remaining time
    const timeBonus = this.timeLeft * 2;
    this.score += timeBonus;

    this.player.setVelocityX(0);
    this.player.setVelocityY(0);
    this.time.delayedCall(1200, () => {
      this.scene.start("GameOverScene", {
        won: true,
        score: this.score,
        timeLeft: this.timeLeft,
        timeBonus
      });
    });
  }
}