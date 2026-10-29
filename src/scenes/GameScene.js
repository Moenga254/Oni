import Phaser from "phaser";
import { levels } from "../data/levels.js";
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

    // 👇 Load current level data
    const levelIndex = this.registry.get("currentLevel") || 0;
    this.currentLevel = levelIndex;
    const levelData = levels[levelIndex];

    // Use levelData for everything
    const WORLD_WIDTH = levelData.worldWidth;

    // 🔊 Init sound
    SoundManager.init(this);
    SoundManager.stopMusic();
    SoundManager.startMusic();

    this.gameOver = false;
    this.gameWon = false;

    // Level data (levels.js) is laid out for a 600px-tall world; the camera follows the player
    const WORLD_HEIGHT = 600;
    this.worldWidth = WORLD_WIDTH;
    this.worldHeight = WORLD_HEIGHT;
    this.playerStart = levelData.playerStart;
    this.respawnPoint = [...levelData.playerStart];   // moves forward when you touch a checkpoint

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // 🎨 Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(...levelData.background, 1);
    bg.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    bg.setScrollFactor(0.1);

    // ☁️ Clouds
    const cloudGraphics = this.add.graphics();
    cloudGraphics.fillStyle(0xffffff, 0.9);
    const cloudPositions = [];
    for (let cx = 200; cx < WORLD_WIDTH; cx += 400) cloudPositions.push(cx);
    cloudPositions.forEach(x => {
      const y = Phaser.Math.Between(60, 180);
      cloudGraphics.fillEllipse(x, y, 120, 50);
      cloudGraphics.fillEllipse(x + 40, y - 20, 80, 40);
      cloudGraphics.fillEllipse(x - 30, y - 10, 70, 35);
    });
    cloudGraphics.setScrollFactor(0.2);

    // 🧱 Platform data from the level: [x, y, width, height] -> add colour
    const platformData = levelData.platforms.map(([x, y, w, h]) => [
      x, y, w, h, h >= 30 ? levelData.groundColor : levelData.platformColor
    ]);

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

    // 🛗 Moving platforms: [x, y, width, moveX, speed]
    this.movingPlatforms = [];
    (levelData.movingPlatforms || []).forEach(([x, y, w, moveX, speed]) => {
      const h = 20;
      const gfx = this.add.graphics();
      gfx.fillStyle(levelData.platformColor);
      gfx.fillRect(0, 0, w, h);
      gfx.fillStyle(0xffffff, 0.35);
      gfx.fillRect(0, 0, w, 4);

      const body = this.physics.add.image(x + w / 2, y + h / 2, null);
      body.setDisplaySize(w, h);
      body.setVisible(false);
      body.setImmovable(true);
      body.body.setAllowGravity(false);
      body.setVelocityX(speed);

      this.movingPlatforms.push({
        body, gfx, w, h,
        left: x + w / 2,
        right: x + moveX + w / 2,
        speed, direction: 1
      });
    });

    // 🧍 Player
    this.player = this.physics.add.sprite(this.playerStart[0], this.playerStart[1], "player");
    this.player.setCollideWorldBounds(false);
    this.player.setBounce(0);
    this.player.body.setGravityY(800); // high extra gravity = snappy landing

    this.physics.add.collider(this.player, this.platforms);
    this.movingPlatforms.forEach(mp => this.physics.add.collider(this.player, mp.body));

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

    // [x, y, patrolLeft, patrolRight, speed, colour]
    const enemyData = levelData.enemies;

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

    const coinPositions = levelData.coins;
    this.totalCoins = coinPositions.length;

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
    const flagX = levelData.flagX;
    const flagGroundY = Math.max(
      ...levelData.platforms.filter(([px, , pw]) => flagX >= px && flagX <= px + pw).map(([, py]) => py)
    );
    this.flag.x = flagX;
    this.flag.y = flagGroundY - 60;

    this.flagZone = this.physics.add.staticImage(flagX + 3, flagGroundY - 30, null);
    this.flagZone.setDisplaySize(40, 60);
    this.flagZone.refreshBody();
    this.flagZone.setVisible(false);

    this.physics.add.overlap(this.player, this.flagZone, this.reachFlag, null, this);

    // 🟢 Checkpoints: smaller green flags (only levels that define `checkpoints` get them)
    this.checkpoints = [];
    (levelData.checkpoints || []).forEach((cx) => {
      const groundY = Math.max(
        ...levelData.platforms.filter(([px, , pw]) => cx >= px && cx <= px + pw).map(([, py]) => py)
      );
      if (!Number.isFinite(groundY)) return;   // no ground under this x: skip it instead of floating in mid-air

      const poleH = 42;                        // the finish flag pole is 60px tall
      const gfx = this.add.graphics();
      gfx.x = cx;
      gfx.y = groundY - poleH;
      const draw = (active) => {
        gfx.clear();
        gfx.fillStyle(active ? 0x1faa3c : 0x2e6b34, 1);   // pole
        gfx.fillRect(0, 0, 4, poleH);
        gfx.fillStyle(active ? 0x39ff6a : 0x3f9a4f, 1);   // green pennant (dull until you touch it)
        gfx.fillTriangle(4, 0, 4, 17, 26, 8);
      };
      draw(false);

      const zone = this.physics.add.staticImage(cx + 2, groundY - poleH / 2, null);
      zone.setDisplaySize(40, poleH);
      zone.refreshBody();
      zone.setVisible(false);

      const cp = { x: cx, groundY, gfx, draw, active: false, respawn: [cx, groundY - 60] };
      this.checkpoints.push(cp);
      this.physics.add.overlap(this.player, zone, () => this.activateCheckpoint(cp), null, this);
    });

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

    // ⏱️ TIMER — countdown length comes from the level
    this.timeLeft = levelData.timeLimit;
    const startMins = Math.floor(this.timeLeft / 60);
    const startSecs = String(this.timeLeft % 60).padStart(2, "0");
    this.timerText = this.add.text(400, 16, `⏱ ${startMins}:${startSecs}`, {
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
    // Jump timing (see update()): last time a jump was requested / last time we stood on the ground
    this._jumpPressedAt  = -Infinity;
    this._lastGroundedAt = -Infinity;

    // Optional FPS counter: open the game with ?fps in the address bar to check phone performance
    if (new URLSearchParams(window.location.search).has("fps")) {
      const fpsText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 6, "", {
        fontSize: "14px", color: "#ffff00", backgroundColor: "#000000aa"
      }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(50);
      this.time.addEvent({
        delay: 500, loop: true,
        callback: () => fpsText.setText(Math.round(this.game.loop.actualFps) + " FPS")
      });
    }

    this.createMobileControls();
  }

  // 🟢 The player touched a checkpoint flag
  activateCheckpoint(cp) {
    if (cp.active) return;
    cp.active = true;
    cp.draw(true);

    // Only ever move the respawn point forward, never back
    if (cp.x > this.respawnPoint[0]) this.respawnPoint = cp.respawn;

    SoundManager.play("coin");

    // Little green sparkle burst
    for (let i = 0; i < 12; i++) {
      const spark = this.add.graphics();
      spark.fillStyle(0x39ff6a, 1);
      spark.fillRect(-3, -3, 6, 6);
      spark.x = cp.x + 12;
      spark.y = cp.groundY - 34;
      const angle = Math.random() * Math.PI * 2;
      const dist  = 30 + Math.random() * 40;
      this.tweens.add({
        targets: spark,
        x: spark.x + Math.cos(angle) * dist,
        y: spark.y + Math.sin(angle) * dist - 20,
        alpha: 0,
        duration: 500,
        onComplete: () => spark.destroy()
      });
    }

    const label = this.add.text(cp.x + 12, cp.groundY - 70, "Checkpoint!", {
      fontSize: "16px", color: "#39ff6a", fontStyle: "bold", stroke: "#000000", strokeThickness: 3
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({
      targets: label, y: label.y - 30, alpha: 0, duration: 1100,
      onComplete: () => label.destroy()
    });
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
      this.triggerGameOver("time");
    }
  }

  // 📱 Touch controls: shown on phones/tablets only, hidden on laptops/desktops
  createMobileControls() {
    const camW = this.cameras.main.width;
    const camH = this.cameras.main.height;

    // The game is drawn at 800x450 and then scaled to fit the screen, so a fixed "64 game pixels"
    // can end up much smaller on a phone. displayScale = game pixels per real screen pixel, so we
    // size the buttons in REAL screen pixels (about 66px tall) to keep them thumb-friendly.
    const scaleY = (this.scale.displayScale && this.scale.displayScale.y) || 1;
    const btnH   = Math.min(Math.max(Math.round(66 * scaleY), 76), 104);
    const sideW  = Math.round(btnH * 1.15);   // ◀ ▶ a bit wider than tall
    const jumpW  = Math.round(btnH * 1.5);    // ▲ the widest: it is the button pressed most
    const margin = 16;
    const gap    = 14;
    const y      = camH - margin - btnH;

    this._btnRects = {
      left:  { x: margin,                  y, w: sideW, h: btnH },
      right: { x: margin + sideW + gap,    y, w: sideW, h: btnH },
      jump:  { x: camW - margin - jumpW,   y, w: jumpW, h: btnH },
    };

    // Draw the buttons (purely visual: touches are handled below)
    this._mobileUi = [];
    this._btnGfx = {};
    this._btnPressed = { left: false, right: false, jump: false };
    const labels = { left: "◀", right: "▶", jump: "▲" };

    for (const name of Object.keys(this._btnRects)) {
      const r = this._btnRects[name];
      const g = this.add.graphics().setScrollFactor(0).setDepth(10);
      const draw = (pressed) => {
        g.clear();
        g.fillStyle(pressed ? 0xffffff : 0x000000, pressed ? 0.35 : 0.45);
        g.fillRoundedRect(r.x, r.y, r.w, r.h, 16);
        g.lineStyle(3, 0xffffff, pressed ? 1 : 0.7);
        g.strokeRoundedRect(r.x, r.y, r.w, r.h, 16);
      };
      draw(false);
      const text = this.add.text(r.x + r.w / 2, r.y + r.h / 2, labels[name], {
        fontSize: Math.round(btnH * 0.42) + "px", color: "#ffffff"
      }).setOrigin(0.5).setScrollFactor(0).setDepth(11);
      this._btnGfx[name] = { draw };
      this._mobileUi.push(g, text);
    }

    // Which button is each finger on? (one finger = at most one button; the nearest wins)
    // The touch area is a little bigger than the drawn button so a slightly-off tap still counts.
    const padX = 12, padY = 22;
    const pickButton = (px, py) => {
      let best = null, bestDist = Infinity;
      for (const [name, r] of Object.entries(this._btnRects)) {
        if (px >= r.x - padX && px <= r.x + r.w + padX && py >= r.y - padY && py <= r.y + r.h + padY) {
          const d = Math.hypot(px - (r.x + r.w / 2), py - (r.y + r.h / 2));
          if (d < bestDist) { bestDist = d; best = name; }
        }
      }
      return best;
    };

    this._pointerButton = {};   // pointer id -> "left" | "right" | "jump" | null

    // Only redraw a button when its pressed state really changes (redrawing on every
    // finger movement was wasting time on phones)
    const refresh = () => {
      const down = new Set(Object.values(this._pointerButton).filter(Boolean));
      this.mobileLeft  = down.has("left");
      this.mobileRight = down.has("right");
      this.mobileJump  = down.has("jump");
      for (const name of Object.keys(this._btnRects)) {
        const pressed = down.has(name);
        if (pressed !== this._btnPressed[name]) {
          this._btnPressed[name] = pressed;
          this._btnGfx[name].draw(pressed);
        }
      }
    };
    this._refreshMobileButtons = refresh;

    this.input.on("pointerdown", (ptr) => {
      if (!this._controlsVisible) {
        if (!ptr.wasTouch) return;          // a mouse click on a laptop: ignore
        this.setControlsVisible(true);      // first real touch on a hybrid device: show the buttons
      }
      const name = pickButton(ptr.x, ptr.y);
      this._pointerButton[ptr.id] = name;
      // Remember the jump tap right now (not just while update() polls),
      // so even a very quick tap can never be missed
      if (name === "jump") this._jumpPressedAt = performance.now();
      refresh();
    });

    this.input.on("pointermove", (ptr) => {
      if (!this._controlsVisible || !(ptr.id in this._pointerButton)) return;
      const name = pickButton(ptr.x, ptr.y);
      if (name !== this._pointerButton[ptr.id]) {
        if (name === "jump") this._jumpPressedAt = performance.now();   // sliding onto jump counts as a press
        this._pointerButton[ptr.id] = name;
        refresh();
      }
    });

    const release = (ptr) => {
      if (ptr.id in this._pointerButton) {
        delete this._pointerButton[ptr.id];
        refresh();
      }
    };
    this.input.on("pointerup", release);
    this.input.on("pointerupoutside", release);

    // Never leave a button "stuck" if the finger leaves the screen or the game is paused/resumed
    const releaseAll = () => { this._pointerButton = {}; refresh(); };
    this.input.on("gameout", releaseAll);
    this.events.on("resume", releaseAll);

    // Show only on touch devices. "(pointer: coarse)" means the main pointer is a finger.
    const device = this.sys.game.device;
    const coarsePointer = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    const touchOnly = device.input.touch && !device.os.desktop;
    this.setControlsVisible(Boolean(coarsePointer || touchOnly));

    // A hybrid laptop with a touchscreen: using the keyboard hides the buttons again
    if (this.input.keyboard) {
      this.input.keyboard.on("keydown", () => {
        if (this._controlsVisible) this.setControlsVisible(false);
      });
    }
  }

  setControlsVisible(visible) {
    this._controlsVisible = visible;
    this._mobileUi.forEach(obj => obj.setVisible(visible));
    if (!visible) {
      this._pointerButton = {};
      this._refreshMobileButtons();
    }
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
    const progress = this.player ? this.player.x / this.worldWidth : 0;
    this.progressBar.fillStyle(0x00ff88, 1);
    this.progressBar.fillRect(200, 20, 400 * progress, 12);
    this.progressBar.lineStyle(2, 0xffffff, 1);
    this.progressBar.strokeRect(200, 20, 400, 12);
  }

  update() {
    if (this.gameOver || this.gameWon) return;

    if (this.player.y > this.worldHeight + 50) {  // below world bottom
      this.loseLife("fall");
      return;
    }

    // Movement — keyboard OR mobile buttons
    const goLeft  = this.cursors.left.isDown  || this.mobileLeft;
    const goRight = this.cursors.right.isDown || this.mobileRight;

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

    // Jump: two tiny grace periods make it feel responsive
    //   • jump buffer: a press just BEFORE landing still counts (130 ms)
    //   • coyote time: a press just AFTER running off a ledge still counts (100 ms)
    // Touch taps record _jumpPressedAt themselves in createMobileControls().
    const now = performance.now();
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this._jumpPressedAt = now;
    if (this.player.body.touching.down) this._lastGroundedAt = now;

    if (now - this._jumpPressedAt <= 130 && now - this._lastGroundedAt <= 100) {
      this.player.setVelocityY(-600); // higher to clear platforms with strong gravity
      SoundManager.play("jump");
      this._jumpPressedAt  = -Infinity;   // this press is used up
      this._lastGroundedAt = -Infinity;   // so no second jump in mid-air
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

    // 🛗 Move platforms back and forth
    this.movingPlatforms.forEach(mp => {
      if (mp.body.x >= mp.right) mp.direction = -1;
      else if (mp.body.x <= mp.left) mp.direction = 1;
      mp.body.setVelocityX(mp.speed * mp.direction);
      mp.gfx.x = mp.body.x - mp.w / 2;
      mp.gfx.y = mp.body.y - mp.h / 2;
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
    this.loseLife("enemy");
  }

  loseLife(cause = "enemy") {
    if (this.invincible) return;
    SoundManager.play("hit");
    Particles.deathBurst(this, this.player.x, this.player.y);
    this.lives--;

    const hearts = "❤️".repeat(Math.max(0, this.lives));
    this.livesText.setText("Lives: " + hearts);

    if (this.lives <= 0) {
      this.triggerGameOver(cause);
      return;
    }

    this.player.setPosition(this.respawnPoint[0], this.respawnPoint[1]);
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

  triggerGameOver(cause) {
    this.gameOver = true;
    SoundManager.play("gameover");
    SoundManager.stopMusic();
    this.player.setVisible(false);
    this.player.setVelocityX(0);
    this.player.setVelocityY(0);
    this.scene.start("GameOverScene", {
      won: false,
      score: this.score,
      currentLevel: this.currentLevel,
      timeLeft: this.timeLeft,
      cause
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
        currentLevel: this.currentLevel,
        timeLeft: this.timeLeft,
        timeBonus
      });
    });
  }
}
