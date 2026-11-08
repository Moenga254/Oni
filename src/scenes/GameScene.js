import Phaser from "phaser";
import { levels } from "../data/levels.js";
import {
  drawIceCaveBackdrop, drawDeepSeaBackdrop, drawNightForestBackdrop, drawCrystalCaveBackdrop,
  drawGrasslandsBackdrop, bakeGrassPlatform, bakeWoodPlatform,
  drawSkyKingdomBackdrop, bakeSkyIslandPlatform, bakeMarblePlatform, bakeCloudPlatform,
  drawVolcanoBackdrop, bakeBasaltPlatform, bakeObsidianPlatform,
  drawSwampBackdrop, bakeMudPlatform, bakeMossyLogPlatform, bakeRustyPlatform,
  drawDesertBackdrop, bakeDesertGround, bakeRuinBlock, bakeCarpetPlatform
} from "../utils/Backdrops.js";
import { setupVolcanoHazards, setupSwampHazards, setupDesertHazards } from "../utils/Hazards.js";
import { DIFFICULTIES, getDifficulty, scaleEnemySpeed } from "../data/Difficulty.js";
import SoundManager from "../utils/SoundManager.js";
import Particles from "../utils/Particles.js";

// 🪂 Player gravity. The total pull = 300 (world gravity, main.js) + the player's own value below.
//   Going UP is unchanged, so the jump is exactly as high as before (apex ~164px).
//   Coming DOWN is heavier, so you land sooner and enemies have less time to catch you in mid-air.
export const RISE_GRAVITY   = 800;    // total 1100
export const FALL_GRAVITY   = 1570;   // total 1870  (1.7x heavier). Raise for a snappier drop, lower for floatier.
export const MAX_FALL_SPEED = 900;    // top falling speed, so a long drop can never skip through a thin platform

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
    this.difficultyKey = getDifficulty(this.registry);  // chosen on the Menu
    this.difficulty    = DIFFICULTIES[this.difficultyKey];

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // 🎨 Background
    if (levelData.theme === "grass") {
      // ☀️ Grasslands: sun, snowy mountains, rolling hills with trees, fluffy clouds, birds (see src/utils/Backdrops.js)
      drawGrasslandsBackdrop(this, { colors: levelData.background, worldWidth: WORLD_WIDTH, worldHeight: WORLD_HEIGHT });
    } else if (levelData.theme === "desert") {
      // 🏜️ Lost Sands: blazing sun, pyramids, ruins in the dunes, vultures, blowing sand (see src/utils/Backdrops.js)
      drawDesertBackdrop(this, { colors: levelData.background, worldWidth: WORLD_WIDTH, worldHeight: WORLD_HEIGHT });
    } else if (levelData.theme === "swamp") {
      // ☣️ Toxic Swamp: smog, factories, dead trees with moss, toxic haze, reeds and barrels (see src/utils/Backdrops.js)
      drawSwampBackdrop(this, { colors: levelData.background, worldWidth: WORLD_WIDTH, worldHeight: WORLD_HEIGHT });
    } else if (levelData.theme === "volcano") {
      // 🌋 Magma Falls: smoking volcanoes, falls of magma, red-lit rocks, embers and ash (see src/utils/Backdrops.js)
      drawVolcanoBackdrop(this, { colors: levelData.background, worldWidth: WORLD_WIDTH, worldHeight: WORLD_HEIGHT });
    } else if (levelData.theme === "sunset") {
      // 🏰 Sky Kingdom: sunset sky, setting sun, castles on far islands, a sea of clouds, birds (see src/utils/Backdrops.js)
      drawSkyKingdomBackdrop(this, { colors: levelData.background, worldWidth: WORLD_WIDTH, worldHeight: WORLD_HEIGHT });
    } else if (levelData.theme === "crystal") {
      // 💎 Crystal Cave: purple cave, glowing crystals on the floor and ceiling, sparkles (see src/utils/Backdrops.js)
      drawCrystalCaveBackdrop(this, { colors: levelData.background, worldWidth: WORLD_WIDTH, worldHeight: WORLD_HEIGHT });
    } else if (levelData.theme === "ice") {
      // 🧊 Ice Cave: cold gradient, layered silhouettes and drifting snow (see src/utils/Backdrops.js)
      drawIceCaveBackdrop(this, { colors: levelData.background, worldWidth: WORLD_WIDTH, worldHeight: WORLD_HEIGHT });
    } else if (levelData.theme === "sea") {
      // 🌊 Deep Sea: light rays, rocks and kelp, rising bubbles (see src/utils/Backdrops.js)
      drawDeepSeaBackdrop(this, { colors: levelData.background, worldWidth: WORLD_WIDTH, worldHeight: WORLD_HEIGHT });
    } else if (levelData.theme === "forest") {
      // 🦉 Night Owl: moon and stars, pine silhouettes, fog along the top, owls and fireflies (see src/utils/Backdrops.js)
      drawNightForestBackdrop(this, { colors: levelData.background, worldWidth: WORLD_WIDTH, worldHeight: WORLD_HEIGHT });
    } else {
      const bg = this.add.graphics();
      bg.fillGradientStyle(...levelData.background, 1);
      bg.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      bg.setScrollFactor(0.1);
    }

    // ☁️ Clouds (only on the plain sky levels, not in the cave or under the sea)
    if (!levelData.theme)
      {
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
  }


    // 🧱 Platform data from the level: [x, y, width, height] -> add colour
    const platformData = levelData.platforms.map(([x, y, w, h]) => [
      x, y, w, h, h >= 30 ? levelData.groundColor : levelData.platformColor
    ]);

    this.platforms = this.physics.add.staticGroup();
    this.platformData = platformData;

    // 🌱 On the Grasslands, platforms are grass-topped soil (drawn once into a picture each)
    // 🏝️ In the Sky Kingdom, the ground is floating island rock and the small platforms are marble slabs
    // 🪨 In Magma Falls, everything is basalt with glowing cracks
    const grassy = levelData.theme === "grass";
    const skyKingdom = levelData.theme === "sunset";
    const volcanic = levelData.theme === "volcano";
    // 🟫 In the Toxic Swamp, the ground is mud and the floating platforms are mossy logs
    const swampy = levelData.theme === "swamp";
    // 🟨 In the Lost Sands, the ground is sand over sandstone and the floating platforms are ruin blocks
    const desert = levelData.theme === "desert";

    platformData.forEach(([x, y, w, h, color], i) => {
      if (grassy) {
        const key = `grass_platform_${i}`;
        const over = bakeGrassPlatform(this, key, w, h, h < 30, i);
        this.add.image(x, y - over, key).setOrigin(0, 0);
      } else if (desert) {
        const key = `desert_platform_${i}`;
        if (h >= 30) {
          const over = bakeDesertGround(this, key, w, h, i);
          this.add.image(x, y - over, key).setOrigin(0, 0);
        } else {
          bakeRuinBlock(this, key, w, h, i);
          this.add.image(x, y, key).setOrigin(0, 0);
        }
      } else if (swampy) {
        const key = `swamp_platform_${i}`;
        const over = h >= 30 ? bakeMudPlatform(this, key, w, h, i) : bakeMossyLogPlatform(this, key, w, h, i);
        this.add.image(x, y - over, key).setOrigin(0, 0);
      } else if (volcanic) {
        const key = `basalt_platform_${i}`;
        const over = bakeBasaltPlatform(this, key, w, h, i, h >= 30);
        this.add.image(x, y - over, key).setOrigin(0, 0);
      } else if (skyKingdom) {
        const key = `sky_platform_${i}`;
        if (h >= 30) {
          const over = bakeSkyIslandPlatform(this, key, w, h, i);
          this.add.image(x, y - over, key).setOrigin(0, 0);
        } else {
          bakeMarblePlatform(this, key, w, h, i);
          this.add.image(x, y, key).setOrigin(0, 0);
        }
      } else {
        const gfx = this.add.graphics();
        gfx.fillStyle(color);
        gfx.fillRect(0, 0, w, h);
        gfx.fillStyle(0xffffff, 0.2);
        gfx.fillRect(0, 0, w, 4);
        gfx.x = x;
        gfx.y = y;
      }

      const platform = this.platforms.create(x + w / 2, y + h / 2, null);
      platform.setDisplaySize(w, h);
      platform.refreshBody();
      platform.setVisible(false);
    });

    // 🕳️ On the Grasslands and in the Lost Sands the hills / dunes behind would make gaps in the ground
    // look like solid ground, so each gap gets a dark pit, making it obvious there's nothing to stand on
    // (gaps filled with quicksand are drawn by the quicksand itself)
    if (grassy || desert) {
      const ground = platformData.filter(([, , , h]) => h >= 30).sort((a, b) => a[0] - b[0]);
      const quicksand = levelData.quicksand || [];
      const pits = this.add.graphics();
      for (let i = 0; i < ground.length - 1; i++) {
        const [gx, gy, gw] = ground[i];
        const gapX = gx + gw, gapW = ground[i + 1][0] - gapX;
        if (gapW <= 0 || quicksand.some(([qx]) => qx === gapX)) continue;
        pits.fillStyle(desert ? 0x4a2a12 : 0x2b1a0e, 1);
        pits.fillRect(gapX, gy + 8, gapW, WORLD_HEIGHT - gy);
        pits.fillStyle(desert ? 0x24140a : 0x120a05, 1);
        pits.fillRect(gapX + 4, gy + 14, gapW - 8, WORLD_HEIGHT - gy);
      }
    }

    // 🛗 Moving platforms: [x, y, width, moveX, speed]
    this.movingPlatforms = [];
    (levelData.movingPlatforms || []).forEach(([x, y, w, moveX, speed], i) => {
      const h = 20;
      let gfx;
      let overY = 0;   // how far the picture sticks up above the platform's top
      if (grassy) {
        // 🪵 wooden planks
        bakeWoodPlatform(this, `wood_platform_${i}`, w, h, i);
        gfx = this.add.image(x, y, `wood_platform_${i}`).setOrigin(0, 0);
      } else if (desert) {
        // 🧞 flying carpets
        bakeCarpetPlatform(this, `carpet_platform_${i}`, w, h, i);
        gfx = this.add.image(x, y, `carpet_platform_${i}`).setOrigin(0, 0);
      } else if (swampy) {
        // 🔩 rusty metal plates
        bakeRustyPlatform(this, `rusty_platform_${i}`, w, h, i);
        gfx = this.add.image(x, y, `rusty_platform_${i}`).setOrigin(0, 0);
      } else if (volcanic) {
        // ⬛ obsidian slabs
        bakeObsidianPlatform(this, `obsidian_platform_${i}`, w, h, i);
        gfx = this.add.image(x, y, `obsidian_platform_${i}`).setOrigin(0, 0);
      } else if (skyKingdom) {
        // ☁️ little clouds to ride on
        overY = bakeCloudPlatform(this, `cloud_platform_${i}`, w, h, i);
        gfx = this.add.image(x, y - overY, `cloud_platform_${i}`).setOrigin(0, 0);
      } else {
        gfx = this.add.graphics();
        gfx.fillStyle(levelData.platformColor);
        gfx.fillRect(0, 0, w, h);
        gfx.fillStyle(0xffffff, 0.35);
        gfx.fillRect(0, 0, w, 4);
      }

      const body = this.physics.add.image(x + w / 2, y + h / 2, null);
      body.setDisplaySize(w, h);
      body.setVisible(false);
      body.setImmovable(true);
      body.body.setAllowGravity(false);
      body.setVelocityX(speed);

      this.movingPlatforms.push({
        body, gfx, w, h, overY,
        left: x + w / 2,
        right: x + moveX + w / 2,
        speed, direction: 1
      });
    });

    // 🧍 Player
    this.player = this.physics.add.sprite(this.playerStart[0], this.playerStart[1], "player");
    this.player.setCollideWorldBounds(false);
    this.player.setBounce(0);
    this.player.body.setGravityY(RISE_GRAVITY);
    this.player.body.maxVelocity.y = MAX_FALL_SPEED;

    this.physics.add.collider(this.player, this.platforms);
    this.movingPlatforms.forEach(mp => this.physics.add.collider(this.player, mp.body));

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // 🎮 Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasInAir = false;

    // 🎞️ Animations (shared by the whole game, so only create them the first time a level starts)
    if (!this.anims.exists("walk")) {
      this.anims.create({
        key: "walk",
        frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
      });
    }

    if (!this.anims.exists("idle")) {
      this.anims.create({
        key: "idle",
        frames: [{ key: "player", frame: 4 }],
        frameRate: 20
      });
    }

    // 👾 Enemies
    this.enemies = [];

    // [x, y, patrolLeft, patrolRight, speed, colour, kind?, easiestMode?]
    // easiestMode: the enemy only appears on that difficulty and harder ones (none = every difficulty)
    const MODE_RANK = { easy: 0, normal: 1, hard: 2 };
    const enemyData = levelData.enemies.filter(e => !e[7] || MODE_RANK[this.difficultyKey] >= MODE_RANK[e[7]]);

    // What the enemies look like depends on the level (an enemy can also name its own kind, 7th value):
    //   🐟 fish  (Deep Sea): swim at their own height (no gravity) instead of walking
    //   🐍 snake (Night Owl): long and low, slithering along the ground
    //   🌋 lava  (Magma Falls): a crawling lump of molten rock
    //   🔥 demon (Magma Falls): a fire demon that floats at its own height
    //   🐸 frog  (Toxic Swamp): a mutant frog that hops along the mud
    //   🦟 bug   (Toxic Swamp): a poisonous insect that flies at its own height
    //   🦂 scorpion (Lost Sands): scuttles along the sand
    //   🏜️ sand  (Lost Sands): burrows under the sand (harmless) and bursts out again (dangerous)
    //   slime   (every other level)
    const levelKind = { sea: "fish", forest: "snake", volcano: "lava", swamp: "frog", desert: "scorpion" }[levelData.theme] || "slime";
    const HITBOX = {
      fish: [28, 20], snake: [34, 16], lava: [32, 20], demon: [26, 26], frog: [30, 22], bug: [24, 18],
      scorpion: [34, 18], sand: [28, 26], slime: [28, 28]
    };
    const DRAW = {
      fish: "drawFish", snake: "drawSnake", lava: "drawLavaCreature", demon: "drawFireDemon",
      frog: "drawMutantFrog", bug: "drawToxicBug", scorpion: "drawScorpion", sand: "drawSandCreature", slime: "drawEnemy"
    };

    enemyData.forEach(([x, y, left, right, speed, color, ownKind], i) => {
      const kind = HITBOX[ownKind] ? ownKind : levelKind;
      const floats = kind === "fish" || kind === "demon" || kind === "bug";
      const enemySpeed = scaleEnemySpeed(speed, this.difficulty.enemySpeed);   // Easy slower, Hard faster
      const gfx = this.add.graphics();
      this[DRAW[kind]](gfx, color);
      gfx.x = x;
      gfx.y = kind === "slime" ? y - 16 : y;

      const body = this.physics.add.image(x, y, null);
      body.setDisplaySize(HITBOX[kind][0], HITBOX[kind][1]);
      body.setVisible(false);
      body.setCollideWorldBounds(false);
      body.setImmovable(false);

      if (floats) {
        body.body.setAllowGravity(false);
      } else {
        body.body.setGravityY(200);
        this.physics.add.collider(body, this.platforms);
      }

      // bobPhase: each one bobs (or slithers, or flickers) a little, out of step with the others
      const enemy = { body, gfx, left, right, speed: enemySpeed, color, kind, direction: 1, bobPhase: i * 1.7, nextHop: 800 + i * 300 };
      if (kind === "sand") {                     // sand creatures start out of the sand, on a staggered timer
        enemy.burrowed = false;
        enemy.nextSwitch = 1500 + i * 400;
      }
      body.enemyRef = enemy;                     // so hitEnemy can tell which enemy you touched
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

    // 🌋 Lava pools, falling rocks and collapsing platforms (see src/utils/Hazards.js)
    if (volcanic) setupVolcanoHazards(this, levelData, this.difficultyKey);
    // ☣️ Toxic water, breaking planks and sinking rafts (see src/utils/Hazards.js)
    if (swampy) setupSwampHazards(this, levelData, this.difficultyKey);
    // ⏳ Quicksand and collapsing sandstone blocks (see src/utils/Hazards.js)
    if (desert) setupDesertHazards(this, levelData, this.difficultyKey);

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
    this.lives = this.difficulty.lives;
    this.livesText = this.add.text(16, 72, "Lives: " + "❤️".repeat(this.lives), {
      fontSize: "20px",
      color: "#ff4444",
      stroke: "#000000",
      strokeThickness: 4
    }).setScrollFactor(0);

    this.invincible = false;

    this.progressBar = this.add.graphics().setScrollFactor(0);
    this.updateProgressBar();

    // ⏸ Pause button (top-right corner, however wide the screen is)
    const pauseBtn = this.add.text(this.cameras.main.width - 20, 16, "⏸", {
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
    this.timerX = this.cameras.main.width / 2;   // centred, like the progress bar
    this.timerText = this.add.text(this.timerX, 16, `⏱ ${startMins}:${startSecs}`, {
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
        x: this.timerX + 3,
        duration: 50,
        yoyo: true,
        repeat: 2,
        onComplete: () => this.timerText.x = this.timerX
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

  // 🐟 Draw a small fish facing right (it is flipped when it swims left)
  drawFish(gfx, color) {
    gfx.clear();
    gfx.fillStyle(color, 1);
    gfx.fillTriangle(-10, 0, -20, -9, -20, 9);      // tail
    gfx.fillEllipse(0, 0, 28, 18);                  // body
    gfx.fillTriangle(-4, -7, 6, -7, -2, -14);       // top fin
    gfx.fillStyle(0xffffff, 0.35);
    gfx.fillEllipse(1, 3, 16, 6);                   // lighter belly
    gfx.fillStyle(0x000000, 0.25);
    gfx.fillRect(-3, -8, 3, 16);                    // stripe
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(7, -2, 4);                       // eye
    gfx.fillStyle(0x000000, 1);
    gfx.fillCircle(8, -2, 2);
  }

  // 🦂 Draw a scorpion facing right: segmented body, pincers held forward, legs, and a tail curled up
  // over its back with a dark stinger. Its feet sit on the bottom of its hitbox (y = +9).
  drawScorpion(gfx, color) {
    gfx.clear();
    const dark = Phaser.Display.Color.IntegerToColor(color).darken(25).color;
    gfx.lineStyle(1.5, dark, 1);                                 // legs
    for (let k = 0; k < 4; k++) {
      const lx = -8 + k * 5;
      gfx.lineBetween(lx, 2, lx - 4, 9);
      gfx.lineBetween(lx + 1, 2, lx + 4, 9);
    }
    gfx.fillStyle(color, 1);                                     // body segments
    gfx.fillEllipse(-2, 2, 26, 11);
    gfx.fillStyle(dark, 1);
    [-9, -4, 1, 6].forEach(sx => gfx.fillRect(sx, -2, 1.2, 8));
    gfx.fillStyle(color, 1);                                     // head
    gfx.fillEllipse(11, 3, 10, 8);
    gfx.lineStyle(2.4, color, 1);                                // arms and pincers
    gfx.lineBetween(13, 2, 19, -2);
    gfx.lineBetween(13, 5, 19, 7);
    gfx.fillStyle(dark, 1);
    gfx.fillTriangle(18, -5, 23, -3, 18, 0);
    gfx.fillTriangle(18, 4, 23, 7, 18, 9);
    gfx.fillStyle(color, 1);                                     // tail curling up and forward
    [[-14, 0, 4], [-17, -5, 3.8], [-17, -11, 3.6], [-13, -16, 3.4], [-7, -18, 3.2]].forEach(([tx, ty, r]) => gfx.fillCircle(tx, ty, r));
    gfx.fillStyle(0x2a1408, 1);                                  // stinger
    gfx.fillTriangle(-4, -20, -2, -14, 1, -18);
    gfx.fillStyle(0xfff2c0, 0.9);
    gfx.fillCircle(-2, -17, 0.9);
    gfx.fillStyle(0x1a0a04, 1);                                  // eyes
    gfx.fillCircle(13, 1, 1.2);
  }

  // 🏜️ Draw a sand creature facing right. Out of the sand: a lumpy body of sand and stones with glowing
  // amber eyes and little arms. Burrowed: just a moving mound with its eyes peeking out (harmless).
  // Its bottom sits on the bottom of its hitbox (y = +13).
  drawSandCreature(gfx, color, burrowed = false) {
    gfx.clear();
    const dark = Phaser.Display.Color.IntegerToColor(color).darken(20).color;
    if (burrowed) {
      gfx.fillStyle(dark, 1);
      gfx.fillEllipse(0, 11, 32, 8);
      gfx.fillStyle(color, 1);
      gfx.fillEllipse(0, 9, 26, 7);
      gfx.fillStyle(0xffb030, 0.8);
      gfx.fillCircle(3, 7, 1.4);
      gfx.fillCircle(8, 7, 1.4);
      return;
    }
    gfx.fillStyle(dark, 1);                                      // base spreading into the ground
    gfx.fillEllipse(0, 11, 30, 6);
    gfx.fillStyle(color, 1);                                     // lumpy body
    gfx.fillCircle(0, 4, 11);
    gfx.fillCircle(-2, -6, 8);
    gfx.fillCircle(3, -11, 5.5);
    gfx.fillStyle(dark, 1);                                      // shaded side and stones
    gfx.fillEllipse(-6, 6, 7, 10);
    gfx.fillStyle(0x8a6a4a, 1);
    gfx.fillCircle(-4, 0, 2);
    gfx.fillCircle(5, 8, 1.6);
    gfx.fillStyle(color, 1);                                     // arms
    gfx.fillEllipse(-11, 2, 6, 10);
    gfx.fillEllipse(12, 0, 6, 10);
    gfx.fillStyle(0x3a1e0a, 1);                                  // eye sockets
    gfx.fillEllipse(2, -6, 6, 4);
    gfx.fillEllipse(8, -6, 5, 4);
    gfx.fillStyle(0xffb030, 1);                                  // glowing eyes
    gfx.fillCircle(2.5, -6, 1.6);
    gfx.fillCircle(8, -6, 1.4);
    gfx.fillStyle(0x3a1e0a, 1);                                  // mouth
    gfx.fillEllipse(5, 0, 6, 2.5);
  }

  // A burst of sand when a sand creature dives in or bursts out
  sandBurst(x, y) {
    for (let i = 0; i < 8; i++) {
      const grain = this.add.circle(x + (Math.random() - 0.5) * 16, y, 1.5 + Math.random() * 2, i % 2 ? 0xe8b870 : 0xc8944e);
      this.tweens.add({
        targets: grain, x: grain.x + (Math.random() - 0.5) * 40, y: y - 10 - Math.random() * 22, alpha: 0,
        duration: 420, ease: "Quad.Out", onComplete: () => grain.destroy()
      });
    }
  }

  // 🐸 Draw a mutant frog facing right: warty green body with purple blotches, one huge bulging eye,
  // and toxic drool. Its feet sit on the bottom of its hitbox (y = +11).
  drawMutantFrog(gfx, color) {
    gfx.clear();
    gfx.fillStyle(0x3a5a12, 1);                                  // back legs, folded
    gfx.fillEllipse(-11, 6, 14, 10);
    gfx.fillEllipse(-14, 10, 12, 3);
    gfx.fillStyle(color, 1);                                     // body
    gfx.fillEllipse(0, 2, 30, 18);
    gfx.fillStyle(0x4a7a1a, 1);                                  // darker back
    gfx.fillEllipse(-3, -2, 22, 9);
    gfx.fillStyle(0xe8f5b0, 1);                                  // pale belly
    gfx.fillEllipse(4, 7, 18, 6);
    gfx.fillStyle(0x8a4aa8, 0.9);                                // mutant blotches
    gfx.fillCircle(-7, -1, 2.6);
    gfx.fillCircle(0, -3, 1.8);
    gfx.fillStyle(0xc8ff4a, 1);                                  // warts
    [[-11, 2], [-4, 3], [-9, -4], [2, 0]].forEach(([wx, wy]) => gfx.fillCircle(wx, wy, 1.2));
    gfx.fillStyle(color, 1);                                     // front leg
    gfx.fillRect(8, 6, 4, 5);
    gfx.fillEllipse(11, 11, 8, 3);
    gfx.fillStyle(color, 1);                                     // eye bumps: one normal, one huge
    gfx.fillCircle(5, -7, 4.5);
    gfx.fillCircle(11, -8, 6.5);
    gfx.fillStyle(0xfff27a, 1);
    gfx.fillCircle(5, -7.5, 3);
    gfx.fillCircle(11, -8.5, 5);
    gfx.fillStyle(0x1a1a0a, 1);                                  // slit pupils
    gfx.fillRect(4.5, -9.5, 1.4, 4);
    gfx.fillRect(11.5, -12, 2, 7);
    gfx.lineStyle(1.2, 0x2a3a0e, 1);                             // mouth
    gfx.lineBetween(6, 1, 15, -1);
    gfx.fillStyle(0xb4ff2a, 1);                                  // toxic drool
    gfx.fillCircle(13, 2, 1.6);
    gfx.fillRect(12.4, 2, 1.2, 4);
  }

  // 🦟 Draw a poisonous insect facing right: striped abdomen with a stinger, glowing red eyes and
  // see-through wings
  drawToxicBug(gfx, color) {
    gfx.clear();
    gfx.fillStyle(0xeaffd0, 0.45);                               // wings
    gfx.fillEllipse(-4, -9, 16, 9);
    gfx.fillEllipse(3, -10, 12, 8);
    gfx.lineStyle(1, 0xeaffd0, 0.7);
    gfx.strokeEllipse(-4, -9, 16, 9);
    gfx.fillStyle(0x2a1a0a, 1);                                  // abdomen
    gfx.fillEllipse(-6, 2, 16, 10);
    gfx.fillStyle(color, 1);                                     // glowing stripes
    gfx.fillRect(-10, -2, 2.4, 8);
    gfx.fillRect(-6, -3, 2.4, 10);
    gfx.fillRect(-2, -2, 2.4, 8);
    gfx.fillStyle(0x2a1a0a, 1);
    gfx.fillTriangle(-14, 1, -14, 4, -19, 3);                   // stinger
    gfx.fillCircle(4, 0, 4.5);                                   // thorax
    gfx.fillCircle(9, -1, 3.6);                                  // head
    gfx.fillStyle(0xff3b3b, 1);                                  // red eyes
    gfx.fillCircle(10.5, -2, 1.6);
    gfx.lineStyle(1, 0x2a1a0a, 1);                               // antennae and legs
    gfx.lineBetween(10, -4, 14, -9);
    gfx.lineBetween(11, -3, 16, -6);
    gfx.lineBetween(2, 4, 0, 8);
    gfx.lineBetween(5, 4, 5, 8);
  }

  // 🔥 Draw a small fire demon facing right: a flame-shaped body, dark horns and glowing eyes
  drawFireDemon(gfx, color) {
    gfx.clear();
    gfx.fillStyle(color, 0.35);                                  // heat glow
    gfx.fillCircle(0, 2, 17);
    gfx.fillStyle(color, 1);                                     // outer flame
    gfx.fillCircle(0, 5, 11);
    gfx.fillTriangle(-11, 3, 11, 3, 2, -21);
    gfx.fillTriangle(-12, 4, -4, -2, -15, -11);
    gfx.fillTriangle(12, 4, 4, -2, 14, -9);
    gfx.fillStyle(0xffd060, 1);                                  // hot core
    gfx.fillCircle(0, 7, 6.5);
    gfx.fillTriangle(-6, 6, 6, 6, 1, -8);
    gfx.fillStyle(0x3a0a06, 1);                                  // horns
    gfx.fillTriangle(-8, -5, -3, -6, -11, -15);
    gfx.fillTriangle(8, -5, 3, -6, 11, -15);
    gfx.fillStyle(0x2a0806, 1);                                  // face
    gfx.fillEllipse(2, 3, 15, 9);
    gfx.fillStyle(0xfff2a0, 1);                                  // glowing eyes, slanted
    gfx.fillTriangle(-3, 1, 1, 2, -2, 4);
    gfx.fillTriangle(4, 2, 8, 1, 6, 4);
    gfx.lineStyle(1.2, 0xff8a1a, 1);                             // grin
    gfx.lineBetween(-1, 6, 6, 6);
  }

  // 🌋 Draw a lava creature facing right: a lump of dark crust over molten rock, with glowing cracks.
  // Its bottom sits on the bottom of its hitbox (y = +10).
  drawLavaCreature(gfx, color) {
    gfx.clear();
    gfx.fillStyle(color, 0.3);                                   // heat glow
    gfx.fillEllipse(0, 2, 44, 30);
    gfx.fillStyle(color, 1);                                     // molten body
    gfx.fillEllipse(0, 1, 34, 20);
    gfx.fillRect(-17, 1, 34, 9);
    gfx.fillStyle(0x2a1410, 1);                                  // crust plates
    gfx.fillEllipse(-6, -4, 16, 10);
    gfx.fillEllipse(7, -3, 14, 9);
    gfx.fillEllipse(-12, 4, 9, 7);
    gfx.fillEllipse(13, 5, 8, 6);
    gfx.lineStyle(1.5, 0xffd060, 1);                             // glowing cracks between plates
    gfx.lineBetween(0, -8, 1, 2);
    gfx.lineBetween(-8, 1, -15, 3);
    gfx.fillStyle(color, 1);                                     // drips at the bottom
    gfx.fillCircle(-10, 10, 2.5);
    gfx.fillCircle(4, 10, 2);
    gfx.fillStyle(0xfff2a0, 1);                                  // eyes
    gfx.fillCircle(6, 1, 3);
    gfx.fillCircle(13, 1, 2.6);
    gfx.fillStyle(0x2a0806, 1);
    gfx.fillCircle(7, 1, 1.4);
    gfx.fillCircle(14, 1, 1.2);
  }

  // 🐍 Draw a small snake facing right (it is flipped when it slithers left).
  // It is drawn so its belly rests on the bottom of its hitbox (y = +8).
  drawSnake(gfx, color) {
    gfx.clear();
    // Wavy body: overlapping circles that get thinner towards the tail
    for (let i = 0; i < 7; i++) {
      const x = -20 + i * 5;
      const r = 3 + i * 0.45;
      gfx.fillStyle(color, 1);
      gfx.fillCircle(x, 8 - r + Math.sin(i * 1.4) * 2, r);
    }
    // Head
    gfx.fillStyle(color, 1);
    gfx.fillEllipse(17, 2, 13, 10);
    // Darker stripes along the back
    gfx.fillStyle(0x000000, 0.25);
    gfx.fillCircle(-9, 3, 2);
    gfx.fillCircle(1, 2, 2.4);
    gfx.fillCircle(10, 1, 2.4);
    // Eye (with a little glow, so it shows in the dark) and flicking tongue
    gfx.fillStyle(0xfff3a0, 1);
    gfx.fillCircle(19, -1, 2.4);
    gfx.fillStyle(0x000000, 1);
    gfx.fillRect(19, -2.5, 1, 3);
    gfx.lineStyle(1.5, 0xff3b3b, 1);
    gfx.lineBetween(23, 3, 28, 3);
    gfx.lineBetween(28, 3, 30, 1);
    gfx.lineBetween(28, 3, 30, 5);
  }

  updateProgressBar() {
    const left = this.cameras.main.width / 2 - 200;   // 400px bar, centred on screen
    this.progressBar.clear();
    this.progressBar.fillStyle(0x000000, 0.5);
    this.progressBar.fillRect(left, 20, 400, 12);
    const progress = this.player ? this.player.x / this.worldWidth : 0;
    this.progressBar.fillStyle(0x00ff88, 1);
    this.progressBar.fillRect(left, 20, 400 * progress, 12);
    this.progressBar.lineStyle(2, 0xffffff, 1);
    this.progressBar.strokeRect(left, 20, 400, 12);
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

    // ⏳ Standing in quicksand (Lost Sands): you wade slowly and can only make small jumps
    const inQuicksand = this.time.now < (this.inQuicksandUntil || 0);
    const runSpeed = inQuicksand ? 90 : 220;

    if (goLeft) {
      this.player.setVelocityX(-runSpeed);
      this.player.anims.play("walk", true);
      this.player.setFlipX(false);
    } else if (goRight) {
      this.player.setVelocityX(runSpeed);
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
      this.player.setVelocityY(inQuicksand ? -420 : -600); // higher to clear platforms with strong gravity (a small hop out of quicksand)
      SoundManager.play("jump");
      this._jumpPressedAt  = -Infinity;   // this press is used up
      this._lastGroundedAt = -Infinity;   // so no second jump in mid-air
    }

    // Heavier gravity on the way DOWN (same jump height, quicker landing)
    const falling = this.player.body.velocity.y > 0 && !this.player.body.touching.down;
    this.player.body.setGravityY(falling ? FALL_GRAVITY : RISE_GRAVITY);

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

      // Only the picture bobs or stretches, never the hitbox
      const wave = Math.sin(this.time.now / 300 + enemy.bobPhase);
      enemy.gfx.x = enemy.body.x;
      if (enemy.kind === "fish") {
        enemy.gfx.y = enemy.body.y + wave * 3;
        enemy.gfx.setScale(enemy.direction, 1);
      } else if (enemy.kind === "snake") {
        enemy.gfx.y = enemy.body.y;
        enemy.gfx.setScale(enemy.direction * (1 + wave * 0.07), 1 - wave * 0.07);   // stretches and squashes as it slithers
      } else if (enemy.kind === "demon") {
        const flicker = Math.sin(this.time.now / 70 + enemy.bobPhase) * 0.06;     // the flames flicker
        enemy.gfx.y = enemy.body.y + wave * 4;
        enemy.gfx.setScale(enemy.direction * (1 - flicker * 0.5), 1 + flicker);
      } else if (enemy.kind === "frog") {
        // hops every second or two; squats on the ground, stretches in the air
        const grounded = enemy.body.body.blocked.down || enemy.body.body.touching.down;
        if (grounded && this.time.now > enemy.nextHop) {
          enemy.body.setVelocityY(-260);
          enemy.nextHop = this.time.now + 1300 + Math.random() * 1300;
        }
        enemy.gfx.y = enemy.body.y;
        enemy.gfx.setScale(enemy.direction * (grounded ? 1.06 : 0.92), grounded ? 0.92 : 1.12);
      } else if (enemy.kind === "scorpion") {
        enemy.gfx.y = enemy.body.y;
        enemy.gfx.setScale(enemy.direction, 1 + Math.sin(this.time.now / 120 + enemy.bobPhase) * 0.04);   // tail twitches
      } else if (enemy.kind === "sand") {
        // burrows under the sand for a while (harmless, moves faster), then bursts out (dangerous)
        if (this.time.now > enemy.nextSwitch) {
          enemy.burrowed = !enemy.burrowed;
          enemy.nextSwitch = this.time.now + (enemy.burrowed ? 1500 : 2200) + Math.random() * 600;
          this.drawSandCreature(enemy.gfx, enemy.color, enemy.burrowed);
          this.sandBurst(enemy.body.x, enemy.body.y + 12);
        }
        enemy.body.setVelocityX(enemy.speed * enemy.direction * (enemy.burrowed ? 1.4 : 1));
        enemy.gfx.y = enemy.body.y;
        enemy.gfx.setScale(enemy.direction, enemy.burrowed ? 1 : 1 + wave * 0.05);
      } else if (enemy.kind === "bug") {
        const buzz = Math.sin(this.time.now / 40 + enemy.bobPhase) * 0.12;      // wings beating fast
        enemy.gfx.y = enemy.body.y + Math.sin(this.time.now / 180 + enemy.bobPhase) * 5;
        enemy.gfx.setScale(enemy.direction, 1 + buzz * 0.4);
      } else if (enemy.kind === "lava") {
        enemy.gfx.y = enemy.body.y;
        enemy.gfx.setScale(enemy.direction * (1 + wave * 0.05), 1 - wave * 0.05);   // oozes as it crawls
      } else {
        enemy.gfx.y = enemy.body.y - 16;
        enemy.gfx.setScale(enemy.direction, 1);
      }
    });

    // 🛗 Move platforms back and forth
    this.movingPlatforms.forEach(mp => {
      if (mp.body.x >= mp.right) mp.direction = -1;
      else if (mp.body.x <= mp.left) mp.direction = 1;
      mp.body.setVelocityX(mp.speed * mp.direction);
      mp.gfx.x = mp.body.x - mp.w / 2;
      mp.gfx.y = mp.body.y - mp.h / 2 - mp.overY;
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
    if (enemyBody.enemyRef && enemyBody.enemyRef.burrowed) return;   // a sand creature under the sand can't hurt you
    this.loseLife("enemy");
  }

  loseLife(cause = "enemy") {
    // Invincibility only protects from enemies and rocks: falling off the world or into lava / toxic water
    // always costs a life, otherwise you would keep falling (or stand in it) until the blinking ends
    if (this.invincible && !["fall", "lava", "toxic", "quicksand"].includes(cause)) return;
    this.tweens.killTweensOf(this.player);   // stop the old blink, so it can't end the new one early
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
      cause,
      difficulty: this.difficultyKey,
      progress: this.player.x / this.worldWidth   // how far along the level you got
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

    // ⭐ Numbers for the star rating, taken at the moment the flag is reached
    const finishStats = {
  timeLeft: this.timeLeft,
  timeLimit: levels[this.currentLevel].timeLimit,
  coins: this.totalCoins - this.coins.countActive(),
  totalCoins: this.totalCoins,
  lives: this.lives,
  difficulty: this.difficultyKey
};

    this.player.setVelocityX(0);
    this.player.setVelocityY(0);
    this.time.delayedCall(1200, () => {
      this.scene.start("GameOverScene", {
        won: true,
        score: this.score,
        currentLevel: this.currentLevel,
        timeBonus,
        ...finishStats
      });
    });
  }
}
