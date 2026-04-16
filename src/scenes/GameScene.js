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
    const WORLD_HEIGHT = 450;

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
      [0,    420, 600,  30, 0x4a7c2f],
      [700,  420, 400,  30, 0x4a7c2f],
      [1200, 420, 500,  30, 0x4a7c2f],
      [1800, 420, 300,  30, 0x4a7c2f],
      [2200, 420, 600,  30, 0x4a7c2f],
      [2900, 420, 400,  30, 0x4a7c2f],
      [300,  320, 150,  20, 0x8B4513],
      [550,  260, 150,  20, 0x8B4513],
      [800,  320, 120,  20, 0x8B4513],
      [1000, 260, 150,  20, 0x8B4513],
      [1250, 320, 120,  20, 0x8B4513],
      [1450, 220, 180,  20, 0x8B4513],
      [1650, 300, 120,  20, 0x8B4513],
      [1900, 220, 150,  20, 0x8B4513],
      [2100, 300, 120,  20, 0x8B4513],
      [2350, 260, 150,  20, 0x8B4513],
      [2550, 320, 120,  20, 0x8B4513],
      [2750, 220, 180,  20, 0x8B4513],
      [2950, 300, 150,  20, 0x8B4513],
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
    this.player = this.physics.add.sprite(80, 360, "player");
    this.player.setCollideWorldBounds(false);
    this.player.setBounce(0);
    this.player.body.setGravityY(800); // high extra gravity = snappy landing

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
      [200,  390, 50,   550,  80,  0xff4444],  // ground patrol
      [750,  390, 710,  1080, 70,  0xff4444],
      [1300, 390, 1210, 1680, 90,  0xff6600],
      [1850, 390, 1810, 2180, 80,  0xff4444],
      [2300, 390, 2210, 2780, 100, 0xff6600],
      [2950, 390, 2910, 3180, 80,  0xff4444],

      // Platform enemies
      [320,  290, 305,  445,  60,  0xaa00ff],
      [570,  230, 555,  695,  60,  0xaa00ff],
      [1020, 230, 1005, 1145, 60,  0xaa00ff],
      [1470, 190, 1455, 1625, 60,  0xaa00ff],
      [2370, 230, 2355, 2495, 60,  0xaa00ff],
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
      [300, 290], [560, 230], [810, 300], [1010, 230],
      [1260, 300], [1460, 190], [1660, 280], [1910, 190],
      [2360, 230], [2760, 190]
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
    this.flag.y = 360;

    this.flagZone = this.physics.add.staticImage(3103, 390, null);
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

  // 📱 Multitouch mobile controls
  // Uses raw pointer positions so LEFT + JUMP can be held simultaneously
  createMobileControls() {
    const camW = this.cameras.main.width;
    const camH = this.cameras.main.height;

    const btnSize = 64;
    const margin  = 20;

    // Button hit regions (in screen coords)
    this._btnRects = {
      left:  { x: margin,              y: camH - margin - btnSize, w: btnSize, h: btnSize },
      right: { x: margin + btnSize + 12, y: camH - margin - btnSize, w: btnSize, h: btnSize },
      jump:  { x: camW - margin - btnSize, y: camH - margin - btnSize, w: btnSize, h: btnSize },
    };

    // Draw buttons as graphics (purely visual)
    const drawBtn = (rect, label, gfxRef) => {
      const g = this.add.graphics().setScrollFactor(0).setDepth(10);
      const draw = (alpha) => {
        g.clear();
        g.fillStyle(0x000000, alpha);
        g.fillRoundedRect(rect.x, rect.y, rect.w, rect.h, 14);
        g.lineStyle(2, 0xffffff, 0.7);
        g.strokeRoundedRect(rect.x, rect.y, rect.w, rect.h, 14);
      };
      draw(0.45);
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + rect.h / 2;
      this.add.text(cx, cy, label, {
        fontSize: "26px", color: "#ffffff"
      }).setOrigin(0.5).setScrollFactor(0).setDepth(11);
      return { g, draw };
    };

    this._btnGfx = {
      left:  drawBtn(this._btnRects.left,  "◀", "left"),
      right: drawBtn(this._btnRects.right, "▶", "right"),
      jump:  drawBtn(this._btnRects.jump,  "▲", "jump"),
    };

    // Track which pointer ids are pressing which buttons
    this._pointerButtons = {}; // pointerId → Set of button names

    const hitTest = (px, py) => {
      const hits = new Set();
      for (const [name, r] of Object.entries(this._btnRects)) {
        if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
          hits.add(name);
        }
      }
      return hits;
    };

    const updateStates = () => {
      const all = new Set();
      for (const btns of Object.values(this._pointerButtons)) {
        btns.forEach(b => all.add(b));
      }
      this.mobileLeft  = all.has("left");
      this.mobileRight = all.has("right");
      this.mobileJump  = all.has("jump");

      // Visual feedback
      for (const [name, gfx] of Object.entries(this._btnGfx)) {
        gfx.draw(all.has(name) ? 0.8 : 0.45);
      }
    };

    // Listen on the whole scene — captures ALL simultaneous touches
    this.input.on("pointerdown", (ptr) => {
      this._pointerButtons[ptr.id] = hitTest(ptr.x, ptr.y);
      updateStates();
    });

    this.input.on("pointermove", (ptr) => {
      if (this._pointerButtons[ptr.id] !== undefined) {
        this._pointerButtons[ptr.id] = hitTest(ptr.x, ptr.y);
        updateStates();
      }
    });

    this.input.on("pointerup", (ptr) => {
      delete this._pointerButtons[ptr.id];
      updateStates();
    });
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

    if (this.player.y > 500) {  // below world bottom
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

    // Jump — keyboard uses JustDown; mobile uses latch to fire once per press
    const canJump = this.player.body.touching.down;
    if (canJump) {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
        this.player.setVelocityY(-600); // higher to clear platforms with strong gravity
        SoundManager.play("jump");
      } else if (this.mobileJump && !this._mobileJumpUsed) {
        this.player.setVelocityY(-600);
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

    this.player.setPosition(80, 360);
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